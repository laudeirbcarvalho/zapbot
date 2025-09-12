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

    // Verificar se é um arquivo Excel
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      return NextResponse.json({ error: 'Formato de arquivo inválido. Use .xlsx ou .xls' }, { status: 400 });
    }

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
    let duplicatesFound: any[] = [];

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

        // Verificar se o lead já existe
        const existingLead = await prisma.lead.findFirst({
          where: {
            OR: [
              phone ? { phone } : {},
              email ? { email } : {}
            ].filter(condition => Object.keys(condition).length > 0),
            deletedAt: null
          },
          include: {
            createdByUser: {
              select: {
                id: true,
                userType: true,
                adminId: true
              }
            }
          }
        });

        if (existingLead) {
          // Verificar hierarquia para decidir se deve importar ou pular
          let shouldImport = false;
          
          if (user.userType === 'SUPER_ADMIN') {
            // Super admin pode importar qualquer lead duplicado
            shouldImport = true;
          } else if (user.userType === 'ADMIN') {
            // Admin só pode importar se o lead existente não for do mesmo admin
            shouldImport = existingLead.createdByUser?.adminId !== user.id && existingLead.createdByUser?.id !== user.id;
          } else if (user.userType === 'MANAGER') {
            // Manager pode importar se:
            // 1. O lead não for do mesmo admin
            // 2. Ou se for do mesmo admin mas de gerente diferente
            const existingUserAdminId = existingLead.createdByUser?.adminId || existingLead.createdByUser?.id;
            const currentUserAdminId = user.adminId;
            
            if (existingUserAdminId !== currentUserAdminId) {
              shouldImport = true; // Diferentes admins
            } else if (existingLead.createdByUser?.id !== user.id) {
              shouldImport = true; // Mesmo admin, mas gerente diferente
            }
          }
          
          if (!shouldImport) {
             console.log('⚠️ [IMPORT] Lead duplicado ignorado (mesma hierarquia):', name || phone || email);
             skippedCount++;
             continue;
           } else {
             // Adicionar à lista de duplicatas que podem ser importadas
             duplicatesFound.push({
               name: name || 'Sem nome',
               phone: phone || 'Sem telefone',
               email: email || 'Sem email',
               existingCreatedBy: existingLead.createdByUser?.id
             });
           }
           
           console.log('✅ [IMPORT] Lead duplicado será importado (hierarquia diferente):', name || phone || email);
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

    // Se há duplicatas que podem ser importadas, retornar para confirmação
    if (duplicatesFound.length > 0) {
      return NextResponse.json({
        success: false,
        requiresConfirmation: true,
        message: `Encontrados ${duplicatesFound.length} leads duplicados que podem ser importados`,
        duplicates: duplicatesFound,
        imported: importedCount,
        skipped: skippedCount,
        total: data.length
      });
    }

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