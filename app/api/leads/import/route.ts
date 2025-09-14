import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/app/lib/auth-middleware';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  console.log('🔍 [IMPORT] Iniciando importação de leads');
  
  try {
    // Verificar autenticação usando o middleware padrão
    const user = await getUserFromRequest(request);
    
    if (!user) {
      console.log('❌ [IMPORT] Usuário não autenticado');
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    console.log('✅ [IMPORT] Usuário autenticado:', user.name);

    // Buscar atendente para associar automaticamente baseado na hierarquia
    let defaultAttendantId = null;
    
    if (user.userType === 'MANAGER') {
      // Se for gerente, buscar o primeiro atendente ativo da sua equipe
      const teamAttendant = await prisma.attendant.findFirst({
        where: {
          managerId: user.id,
          isActive: true
        },
        select: { id: true, name: true }
      });
      
      if (teamAttendant) {
        defaultAttendantId = teamAttendant.id;
        console.log('👥 [IMPORT] Atendente padrão encontrado (gerente):', teamAttendant.name);
      }
    } else if (user.userType === 'ADMIN' && !user.isSuperAdmin) {
      // Se for admin (não super), buscar atendente da sua hierarquia
      const teamAttendant = await prisma.attendant.findFirst({
        where: {
          OR: [
            { adminId: user.id }, // Atendentes diretamente associados ao admin
            { 
              manager: {
                adminId: user.id // Atendentes de gerentes deste admin
              }
            }
          ],
          isActive: true
        },
        select: { id: true, name: true }
      });
      
      if (teamAttendant) {
        defaultAttendantId = teamAttendant.id;
        console.log('👥 [IMPORT] Atendente padrão encontrado (admin):', teamAttendant.name);
      }
    }
    
    if (!defaultAttendantId) {
      console.log('⚠️ [IMPORT] Nenhum atendente encontrado para associação automática');
    }

    // Processar FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    console.log('📁 [IMPORT] Arquivo recebido:', file.name, file.size);

    // Verificar se é um arquivo Excel (por extensão e MIME type)
    const isExcelByName = file.name.match(/\.(xlsx|xls)$/i);
    const isExcelByType = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                         file.type === 'application/vnd.ms-excel' ||
                         file.type === 'application/octet-stream'; // Alguns browsers enviam como octet-stream
    
    if (!isExcelByName && !isExcelByType) {
      console.log('❌ [IMPORT] Arquivo rejeitado - Nome:', file.name, 'Tipo:', file.type);
      return NextResponse.json({ error: 'Formato de arquivo inválido. Use .xlsx ou .xls' }, { status: 400 });
    }
    
    console.log('✅ [IMPORT] Arquivo Excel válido - Nome:', file.name, 'Tipo:', file.type);

    // Ler arquivo Excel
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log('📊 [IMPORT] Dados extraídos:', data.length, 'linhas');

    if (data.length === 0) {
      return NextResponse.json({ error: 'Arquivo Excel vazio' }, { status: 400 });
    }

    // Buscar colunas existentes
    const columns = await prisma.column.findMany({
      where: { deletedAt: null },
      orderBy: { position: 'asc' }
    });

    if (columns.length === 0) {
      return NextResponse.json({ error: 'Nenhuma coluna encontrada no sistema' }, { status: 400 });
    }

    const firstColumn = columns[0];
    let importedCount = 0;
    let skippedCount = 0;

    // Processar cada linha do Excel
    for (const row of data as any[]) {
      try {
        const name = row['Nome'] || row['nome'] || row['Name'] || row['name'];
        const phone = row['Telefone'] || row['telefone'] || row['Phone'] || row['phone'];
        const email = row['Email'] || row['email'] || row['E-mail'] || row['e-mail'];
        const source = row['Origem'] || row['origem'] || row['Source'] || row['source'] || 'Excel Import';

        if (!name && !phone && !email) {
          skippedCount++;
          continue;
        }

        // Verificar se o lead já existe (apenas se tiver phone ou email válidos)
        let existingLead = null;
        if (phone || email) {
          const whereConditions = [];
          if (phone) whereConditions.push({ phone });
          if (email) whereConditions.push({ email });
          
          if (whereConditions.length > 0) {
            existingLead = await prisma.lead.findFirst({
               where: {
                 OR: whereConditions,
                 deletedAt: null,
                 tenantId: user.tenantId // Buscar apenas leads do mesmo tenant
               },
               include: {
                 creator: {
                   select: {
                     id: true,
                     userType: true,
                     adminId: true
                   }
                 }
               }
             });
          }
        }
        
        console.log('🔍 [IMPORT] Verificando duplicata para:', { name, phone, email, existingLead: !!existingLead });
        if (existingLead) {
          console.log('📋 [IMPORT] Lead existente encontrado:', {
             id: existingLead.id,
             name: existingLead.name,
             phone: existingLead.phone,
             email: existingLead.email,
             createdBy: existingLead.creator?.id,
             userType: existingLead.creator?.userType,
             adminId: existingLead.creator?.adminId
           });
          console.log('👤 [IMPORT] Usuário atual:', {
            id: user.id,
            userType: user.userType,
            adminId: user.adminId
          });
        }

        if (existingLead) {
          // Como agora filtramos por tenantId, qualquer lead encontrado é do mesmo tenant
          // Portanto, deve ser considerado duplicata e ignorado
          console.log('⚠️ [IMPORT] Lead duplicado ignorado (mesmo tenant):', name || phone || email);
          skippedCount++;
          continue;
        }

        // Criar novo lead
        await prisma.lead.create({
          data: {
            name: name || 'Lead Importado',
            phone: phone || null,
            email: email || null,
            columnId: firstColumn.id,
            createdBy: user.id,
            attendantId: defaultAttendantId, // Associar automaticamente ao atendente
            tenantId: user.tenantId, // Associar ao tenant do usuário
            source: source,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });

        importedCount++;
      } catch (rowError) {
        console.error('❌ [IMPORT] Erro ao processar linha:', rowError);
        skippedCount++;
      }
    }

    console.log('✅ [IMPORT] Importação concluída:', importedCount, 'importados,', skippedCount, 'ignorados');

    return NextResponse.json({
      success: true,
      message: `Importação concluída com sucesso!`,
      imported: importedCount,
      skipped: skippedCount,
      total: data.length
    });

  } catch (error) {
    console.error('❌ [IMPORT] Erro geral:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}