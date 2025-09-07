import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withAttendantAuth } from '@/app/lib/attendant-auth-middleware';

const prisma = new PrismaClient();

// PUT - Atualizar um lead específico (apenas leads atribuídos ao atendente ou não atribuídos)
export const PUT = withAttendantAuth(async (request: NextRequest, attendant) => {
  try {
    // Extrair o ID da URL
    const url = new URL(request.url);
    const leadId = url.pathname.split('/').pop();
    const updateData = await request.json();
    
    if (!leadId) {
      return NextResponse.json(
        { error: "ID do lead é obrigatório" },
        { status: 400 }
      );
    }
    
    console.log('🔄 [API Attendant] Atualizando lead:', leadId, 'por atendente:', attendant.name);
    
    // Verificar se o lead pertence ao atendente ou não está atribuído
    const existingLead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        deletedAt: null,
        OR: [
          { attendantId: attendant.id },
          { attendantId: null }
        ]
      }
    });
    
    if (!existingLead) {
      return NextResponse.json(
        { error: "Lead não encontrado ou sem permissão" },
        { status: 404 }
      );
    }
    
    // Se o lead não estava atribuído e está sendo movido, atribuir ao atendente atual
    const finalUpdateData = {
      ...updateData,
      updatedAt: new Date()
    };
    
    // Se o lead não tem atendente, atribuir ao atendente atual
    if (!existingLead.attendantId) {
      finalUpdateData.attendantId = attendant.id;
    }
    
    // Atualizar o lead
    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: finalUpdateData,
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
    
    console.log('✅ [API Attendant] Lead atualizado:', updatedLead.id, 'Status:', updatedLead.status);
    
    return NextResponse.json(updatedLead);
  } catch (error) {
    console.error("Erro ao atualizar lead:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar lead" },
      { status: 500 }
    );
  }
});

// GET - Buscar um lead específico
export const GET = withAttendantAuth(async (request: NextRequest, attendant) => {
  try {
    // Extrair o ID da URL
    const url = new URL(request.url);
    const leadId = url.pathname.split('/').pop();
    
    if (!leadId) {
      return NextResponse.json(
        { error: "ID do lead é obrigatório" },
        { status: 400 }
      );
    }
    
    // Buscar o lead se pertence ao atendente ou não está atribuído
    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        deletedAt: null,
        OR: [
          { attendantId: attendant.id },
          { attendantId: null }
        ]
      },
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
    
    if (!lead) {
      return NextResponse.json(
        { error: "Lead não encontrado ou sem permissão" },
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