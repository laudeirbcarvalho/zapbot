import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withAuth } from '@/app/lib/auth-middleware';

const prisma = new PrismaClient();

// GET - Buscar um lead específico
export const GET = withAuth(async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const { id } = params;
    
    const lead = await prisma.lead.findUnique({
      where: {
        id: id,
        deletedAt: null, // Apenas leads não deletados
      },
    });
    
    if (!lead) {
      return NextResponse.json(
        { error: "Lead não encontrado" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(lead);
  } catch (error) {
    console.error("Erro ao buscar lead:", error);
    return NextResponse.json(
      { error: "Erro ao buscar lead" },
      { status: 500 }
    );
  }
});

// PUT - Atualizar um lead
export const PUT = withAuth(async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const { id } = params;
    const body = await request.json();
    
    const { name, email, phone, source, status, columnId, notes, position, attendantId } = body;
    
    // Construir objeto de dados apenas com campos definidos
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (source !== undefined) updateData.source = source;
    if (status !== undefined) updateData.status = status;
    if (columnId !== undefined) updateData.columnId = columnId;
    if (notes !== undefined) updateData.notes = notes;
    if (position !== undefined) updateData.position = position;
    if (attendantId !== undefined) updateData.attendantId = attendantId;
    
    const lead = await prisma.lead.update({
      where: {
        id: id,
        deletedAt: null, // Apenas leads não deletados
      },
      data: updateData,
      include: {
        attendant: {
          select: {
            id: true,
            name: true,
            email: true,
            position: true,
            department: true,
            isActive: true
          }
        }
      }
    });
    
    // Log apenas se houve mudança de posição ou coluna (movimento no kanban)
    if (updateData.position !== undefined || updateData.columnId !== undefined) {
      console.log('💾 [Kanban] MySQL atualizado - Lead:', lead.id, 'Coluna:', lead.columnId, 'Posição:', lead.position);
    }
    
    return NextResponse.json(lead);
  } catch (error) {
    console.error('❌ [Kanban] Erro ao atualizar lead no MySQL:', {
      leadId: id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: "Erro ao atualizar lead" },
      { status: 500 }
    );
  }
});

// DELETE - Soft delete de um lead
export const DELETE = withAuth(async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const { id } = params;
    const user = (request as any).user;
    
    // Verificar se o lead existe e não está deletado
    const existingLead = await prisma.lead.findUnique({
      where: {
        id: id,
        deletedAt: null
      },
      include: {
        attendant: true
      }
    });
    
    if (!existingLead) {
      return NextResponse.json(
        { error: "Lead não encontrado" },
        { status: 404 }
      );
    }
    
    // Verificar permissões baseadas no tipo de usuário
    if (user.type === 'manager') {
      // Gerentes só podem excluir leads da sua equipe ou não atribuídos
      if (existingLead.attendantId) {
        // Se o lead tem atendente, verificar se é da equipe do gerente
        const attendant = await prisma.user.findUnique({
          where: { id: existingLead.attendantId }
        });
        
        if (!attendant || attendant.managerId !== user.id) {
          return NextResponse.json(
            { error: "Você não tem permissão para excluir este lead" },
            { status: 403 }
          );
        }
      }
      // Se não tem atendente (não atribuído), gerente pode excluir
    }
    // Administradores podem excluir qualquer lead
    
    // Soft delete - marcar como deletado
    await prisma.lead.update({
      where: {
        id: id,
      },
      data: {
        deletedAt: new Date(),
        deletedBy: user.id,
      },
    });
    
    console.log(`🗑️ Lead ${id} movido para lixeira por ${user.name} (${user.email})`);
    return NextResponse.json({ message: "Lead movido para lixeira" });
  } catch (error) {
    console.error("Erro ao excluir lead:", error);
    return NextResponse.json(
      { error: "Erro ao excluir lead" },
      { status: 500 }
    );
  }
});