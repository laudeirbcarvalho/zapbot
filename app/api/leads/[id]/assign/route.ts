import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withAuth } from '@/app/lib/auth-middleware';

const prisma = new PrismaClient();

// POST - Associar lead a um atendente
export const POST = withAuth(async (request: Request, { params }: { params: { id: string } }) => {
  try {
    // Obter o usuário autenticado do contexto da requisição
    const user = (request as any).user;
    
    // Verificar se o usuário é administrador
    if (user.userType !== 'ADMIN') {
      return NextResponse.json(
        { error: "Apenas administradores podem alterar o atendente do lead" },
        { status: 403 }
      );
    }

    const { attendantId } = await request.json();
    const leadId = params.id;

    if (!leadId) {
      return NextResponse.json(
        { error: "ID do lead é obrigatório" },
        { status: 400 }
      );
    }

    console.log('🔗 [API] Associando lead', leadId, 'ao atendente:', attendantId || 'nenhum');

    // Verificar se o lead existe
    const existingLead = await prisma.Lead.findUnique({
      where: { id: leadId }
    });

    if (!existingLead) {
      return NextResponse.json(
        { error: "Lead não encontrado" },
        { status: 404 }
      );
    }

    // Se attendantId for fornecido, verificar se o atendente existe
    if (attendantId) {
      const existingAttendant = await prisma.Attendant.findUnique({
        where: { id: attendantId, isActive: true }
      });

      if (!existingAttendant) {
        return NextResponse.json(
          { error: "Atendente não encontrado ou inativo" },
          { status: 404 }
        );
      }
    }

    // Atualizar o lead
    const updatedLead = await prisma.Lead.update({
      where: { id: leadId },
      data: {
        attendantId: attendantId || null
      },
      include: {
        attendant: {
          select: {
            id: true,
            name: true,
            email: true,
            position: true
          }
        }
      }
    });

    const action = attendantId ? 'associado' : 'desassociado';
    console.log(`✅ [API] Lead ${action} com sucesso`);

    return NextResponse.json({
      message: `Lead ${action} com sucesso`,
      lead: updatedLead
    });
  } catch (error) {
    console.error('❌ [API] Erro ao associar lead:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: "Erro ao associar lead" },
      { status: 500 }
    );
  }
});

// DELETE - Desassociar lead do atendente
export const DELETE = withAuth(async (request: Request, { params }: { params: { id: string } }) => {
  try {
    // Obter o usuário autenticado do contexto da requisição
    const user = (request as any).user;
    
    // Verificar se o usuário é administrador
    if (user.userType !== 'ADMIN') {
      return NextResponse.json(
        { error: "Apenas administradores podem alterar o atendente do lead" },
        { status: 403 }
      );
    }

    const leadId = params.id;

    if (!leadId) {
      return NextResponse.json(
        { error: "ID do lead é obrigatório" },
        { status: 400 }
      );
    }

    console.log('🔗 [API] Desassociando lead', leadId, 'do atendente');

    // Verificar se o lead existe
    const existingLead = await prisma.Lead.findUnique({
      where: { id: leadId }
    });

    if (!existingLead) {
      return NextResponse.json(
        { error: "Lead não encontrado" },
        { status: 404 }
      );
    }

    // Desassociar o lead
    const updatedLead = await prisma.Lead.update({
      where: { id: leadId },
      data: {
        attendantId: null
      }
    });

    console.log('✅ [API] Lead desassociado com sucesso');

    return NextResponse.json({
      message: "Lead desassociado com sucesso",
      lead: updatedLead
    });
  } catch (error) {
    console.error('❌ [API] Erro ao desassociar lead:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: "Erro ao desassociar lead" },
      { status: 500 }
    );
  }
});