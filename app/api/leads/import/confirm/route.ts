import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/app/lib/auth-utils';
import prisma from '@/lib/prisma';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    console.log('🔄 [IMPORT-CONFIRM] Usuário autenticado:', user.name, user.userType);

    // Determinar atendente padrão baseado na hierarquia
    let defaultAttendantId = null;
    
    if (user.userType === 'MANAGER') {
      const managerAttendant = await prisma.attendant.findFirst({
        where: {
          managerId: user.id,
          isActive: true
        },
        select: { id: true, name: true }
      });
      
      if (managerAttendant) {
        defaultAttendantId = managerAttendant.id;
        console.log('👥 [IMPORT-CONFIRM] Atendente padrão encontrado (manager):', managerAttendant.name);
      }
    } else if (user.userType === 'ADMIN') {
      const teamAttendant = await prisma.attendant.findFirst({
        where: {
          OR: [
            { adminId: user.id },
            { 
              manager: {
                adminId: user.id
              }
            }
          ],
          isActive: true
        },
        select: { id: true, name: true }
      });
      
      if (teamAttendant) {
        defaultAttendantId = teamAttendant.id;
        console.log('👥 [IMPORT-CONFIRM] Atendente padrão encontrado (admin):', teamAttendant.name);
      }
    }

    // Processar FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const forceImport = formData.get('forceImport') === 'true';
    
    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    if (!forceImport) {
      return NextResponse.json({ error: 'Confirmação de importação necessária' }, { status: 400 });
    }

    console.log('📁 [IMPORT-CONFIRM] Arquivo recebido para importação forçada:', file.name);

    // Ler arquivo Excel
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

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

    // Processar cada linha do Excel (forçando importação)
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

        // Criar novo lead (mesmo se duplicado)
        await prisma.lead.create({
          data: {
            name: name || 'Lead Importado',
            phone: phone || null,
            email: email || null,
            columnId: firstColumn.id,
            createdBy: user.id,
            attendantId: defaultAttendantId,
            source: source,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });

        importedCount++;
      } catch (rowError) {
        console.error('❌ [IMPORT-CONFIRM] Erro ao processar linha:', rowError);
        skippedCount++;
      }
    }

    console.log('✅ [IMPORT-CONFIRM] Importação forçada concluída:', importedCount, 'importados,', skippedCount, 'ignorados');

    return NextResponse.json({
      success: true,
      message: `Importação forçada concluída com sucesso!`,
      imported: importedCount,
      skipped: skippedCount,
      total: data.length
    });

  } catch (error) {
    console.error('❌ [IMPORT-CONFIRM] Erro geral:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}