import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAuth } from '@/app/lib/auth-middleware';

const prisma = new PrismaClient();

// GET - Listar atendimentos de um lead
export const GET = withAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');

    if (!leadId) {
      return NextResponse.json(
        { error: 'leadId é obrigatório' },
        { status: 400 }
      );
    }

    const attendances = await prisma.Attendance.findMany({
      where: {
        leadId: leadId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(attendances);
  } catch (error) {
    console.error('Erro ao buscar atendimentos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});

// POST - Criar novo atendimento
export const POST = withAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const {
      leadId,
      type,
      subject,
      description,
      status = 'pending',
      priority = 'medium',
      scheduledAt,
      duration,
      outcome,
      nextAction,
      tags,
      attachments
    } = body;

    // Obter o usuário autenticado
    const { getUserFromRequest } = await import('@/app/lib/auth-middleware');
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    if (!leadId || !type) {
      return NextResponse.json(
        { error: 'leadId e type são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se o lead existe
    const leadExists = await prisma.Lead.findUnique({
      where: { id: leadId }
    });

    if (!leadExists) {
      return NextResponse.json(
        { error: 'Lead não encontrado' },
        { status: 404 }
      );
    }

    const attendance = await prisma.Attendance.create({
      data: {
        leadId,
        userId: user.id,
        type,
        subject,
        description,
        status,
        priority,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        duration: duration ? parseInt(duration) : null,
        outcome,
        nextAction,
        tags,
        attachments
      },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json(attendance, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar atendimento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});

// PUT - Atualizar atendimento
export const PUT = withAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const {
      id,
      type,
      subject,
      description,
      status,
      priority,
      scheduledAt,
      completedAt,
      duration,
      outcome,
      nextAction,
      tags,
      attachments
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório' },
        { status: 400 }
      );
    }

    const attendance = await prisma.Attendance.update({
      where: { id },
      data: {
        type,
        subject,
        description,
        status,
        priority,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        completedAt: completedAt ? new Date(completedAt) : null,
        duration: duration ? parseInt(duration) : null,
        outcome,
        nextAction,
        tags,
        attachments,
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json(updatedAttendance);
  } catch (error) {
    console.error('Erro ao atualizar atendimento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});

// DELETE - Deletar atendimento
export const DELETE = withAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório' },
        { status: 400 }
      );
    }

    await prisma.Attendance.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Atendimento deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar atendimento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});