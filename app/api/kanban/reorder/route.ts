import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withAuth } from "@/app/lib/auth-middleware";

const prisma = new PrismaClient();

// POST - Reordenar leads no Kanban
export const POST = withAuth(async (request: Request) => {
  try {
    const user = (request as any).user;
    const body = await request.json();
    const { updates } = body;

    if (!Array.isArray(updates)) {
      return NextResponse.json(
        { error: "Updates deve ser um array" },
        { status: 400 }
      );
    }
    
    // Verificar tipo de usuário para validar permissões
    const isAdmin = user.userType === 'ADMIN';
    const isManager = user.userType === 'MANAGER';
    const isAttendant = user.userType === 'ATTENDANT';
    
    // Para gerentes, buscar IDs dos atendentes
    let allowedLeadIds: string[] = [];
    if (isManager) {
      const attendants = await prisma.attendant.findMany({
        where: { managerId: user.id },
        select: { id: true }
      });
      const attendantIds = attendants.map(a => a.id);
      
      // Buscar leads que o gerente pode ver
      const allowedLeads = await prisma.lead.findMany({
        where: {
          OR: [
            { attendantId: { in: attendantIds } },
            { createdBy: user.id }
          ]
        },
        select: { id: true }
      });
      allowedLeadIds = allowedLeads.map(l => l.id);
    } else if (isAttendant) {
      // Atendente só pode mover seus próprios leads
      const allowedLeads = await prisma.lead.findMany({
        where: { attendantId: user.id },
        select: { id: true }
      });
      allowedLeadIds = allowedLeads.map(l => l.id);
    }
    // Admin pode mover qualquer lead
    
    // Validar se o usuário tem permissão para mover todos os leads
    if (!isAdmin) {
      const unauthorizedLeads = updates.filter(update => !allowedLeadIds.includes(update.id));
      if (unauthorizedLeads.length > 0) {
        return NextResponse.json(
          { error: "Você não tem permissão para mover alguns destes leads" },
          { status: 403 }
        );
      }
    }

    // Executar todas as atualizações em uma transação
    const results = await prisma.$transaction(async (tx) => {
      const updatedLeads = [];
      
      for (const update of updates) {
        const updateData: any = { position: update.position };
        
        if (update.columnId !== undefined) {
          updateData.columnId = update.columnId;
          
          // Buscar o título da coluna para atualizar o status
          const column = await tx.column.findUnique({
            where: { id: update.columnId },
            select: { title: true }
          });
          
          if (column) {
            updateData.status = column.title;
            console.log('🔄 [Kanban] Atualizando status do lead', update.id, 'para:', column.title);
          }
        }

        const updatedLead = await tx.lead.update({
          where: { id: update.id },
          data: updateData,
        });
        
        updatedLeads.push(updatedLead);
      }
      
      return updatedLeads;
    });

    console.log('💾 [Kanban] Reordenação em lote concluída -', results.length, 'leads atualizados');

    return NextResponse.json({ 
      message: "Leads reordenados com sucesso",
      updated: results.length 
    });
  } catch (error) {
    console.error('❌ [Kanban] Erro na reordenação em lote:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: "Erro ao reordenar leads" },
      { status: 500 }
    );
  }
});