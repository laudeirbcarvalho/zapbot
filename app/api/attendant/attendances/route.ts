import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAttendantAuth } from '@/app/lib/attendant-auth-middleware';

const prisma = new PrismaClient();

// GET - Listar atendimentos de um lead (apenas leads do atendente)
export const GET = withAttendantAuth(async (request: NextRequest, attendant) => {
  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');

    if (!leadId) {
      return NextResponse.json(
        { error: 'leadId é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se o lead pertence ao atendente ou não está atribuído
    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        deletedAt: null,
        OR: [
          { attendantId: attendant.id },
          { attendantId: null }
        ]
      }
    });

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead não encontrado ou sem permissão' },
        { status: 404 }
      );
    }

    const attendances = await prisma.attendance.findMany({
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

    console.log('✅ [API Attendant] Atendimentos carregados:', attendances.length, 'para lead:', leadId);
    return NextResponse.json(attendances);
  } catch (error) {
    console.error('Erro ao buscar atendimentos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});

// POST - Criar novo atendimento (apenas para leads do atendente)
export const POST = withAttendantAuth(async (request: NextRequest, attendant) => {
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

    if (!leadId || !type) {
      return NextResponse.json(
        { error: 'leadId e type são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se o lead pertence ao atendente ou não está atribuído
    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        deletedAt: null,
        OR: [
          { attendantId: attendant.id },
          { attendantId: null }
        ]
      }
    });

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead não encontrado ou sem permissão' },
        { status: 404 }
      );
    }

    // Se o lead não estava atribuído, atribuir ao atendente atual
    if (!lead.attendantId) {
      await prisma.lead.update({
        where: { id: leadId },
        data: { 
          attendantId: attendant.id,
          updatedAt: new Date()
        }
      });
    }

    const attendance = await prisma.attendance.create({
      data: {
        leadId,
        userId: null, // Atendentes não são usuários do sistema admin
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
      }
    });

    console.log('✅ [API Attendant] Atendimento criado:', attendance.id, 'por atendente:', attendant.name);
    return NextResponse.json(attendance, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar atendimento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});

// PUT - Atualizar atendimento (apenas atendimentos de leads do atendente)
export const PUT = withAttendantAuth(async (request: NextRequest, attendant) => {
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

    // Verificar se o atendimento pertence a um lead do atendente
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        id: id
      },
      include: {
        lead: {
          select: {
            id: true,
            attendantId: true,
            deletedAt: true
          }
        }
      }
    });

    if (!existingAttendance || 
        existingAttendance.lead.deletedAt ||
        (existingAttendance.lead.attendantId && existingAttendance.lead.attendantId !== attendant.id)) {
      return NextResponse.json(
        { error: 'Atendimento não encontrado ou sem permissão' },
        { status: 404 }
      );
    }

    const updatedAttendance = await prisma.attendance.update({
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
      }
    });

    console.log('✅ [API Attendant] Atendimento atualizado:', updatedAttendance.id, 'por atendente:', attendant.name);
    return NextResponse.json(updatedAttendance);
  } catch (error) {
    console.error('Erro ao atualizar atendimento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});

// DELETE - Deletar atendimento (apenas atendimentos de leads do atendente)
export const DELETE = withAttendantAuth(async (request: NextRequest, attendant) => {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se o atendimento pertence a um lead do atendente
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        id: id
      },
      include: {
        lead: {
          select: {
            id: true,
            attendantId: true,
            deletedAt: true
          }
        }
      }
    });

    if (!existingAttendance || 
        existingAttendance.lead.deletedAt ||
        (existingAttendance.lead.attendantId && existingAttendance.lead.attendantId !== attendant.id)) {
      return NextResponse.json(
        { error: 'Atendimento não encontrado ou sem permissão' },
        { status: 404 }
      );
    }

    await prisma.attendance.delete({
      where: { id }
    });

    console.log('✅ [API Attendant] Atendimento deletado:', id, 'por atendente:', attendant.name);
    return NextResponse.json({ message: 'Atendimento deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar atendimento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});