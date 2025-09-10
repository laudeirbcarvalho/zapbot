import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withAttendantAuth } from '@/app/lib/attendant-auth-middleware';

const prisma = new PrismaClient();

// GET - Listar leads para atendentes
export const GET = withAttendantAuth(async (request: NextRequest, attendant) => {
  try {
    console.log('🔍 [API Attendant] Buscando leads para atendente:', attendant.name);
    
    // Buscar apenas leads atribuídos ao atendente
    const leads = await prisma.lead.findMany({
      where: {
        deletedAt: null, // Apenas leads não deletados
        attendantId: attendant.id // Apenas leads atribuídos ao atendente
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
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    console.log('✅ [API Attendant] Leads encontrados:', leads.length);
    
    return NextResponse.json(leads);
  } catch (error) {
    console.error("Erro ao buscar leads para atendente:", error);
    return NextResponse.json(
      { error: "Erro ao buscar leads" },
      { status: 500 }
    );
  }
});

// PUT - Atualizar um lead (apenas leads atribuídos ao atendente)
export const PUT = withAttendantAuth(async (request: NextRequest, attendant) => {
  try {
    const { leadId, ...updateData } = await request.json();
    
    if (!leadId) {
      return NextResponse.json(
        { error: "ID do lead é obrigatório" },
        { status: 400 }
      );
    }
    
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
    
    // Atualizar o lead
    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: {
        ...updateData,
        updatedAt: new Date()
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
    
    console.log('✅ [API Attendant] Lead atualizado:', updatedLead.id);
    
    return NextResponse.json(updatedLead);
  } catch (error) {
    console.error("Erro ao atualizar lead:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar lead" },
      { status: 500 }
    );
  }
});