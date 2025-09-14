import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Função auxiliar para verificar autenticação
async function getAuthenticatedUser(request?: NextRequest) {
  // Tentar autenticação por sessão NextAuth primeiro
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    return { userId: session.user.id, userType: session.user.userType };
  }

  // Se não houver sessão, tentar autenticação por token
  if (request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
        return { userId: decoded.userId, userType: decoded.userType };
      } catch (error) {
        console.error('Erro ao verificar token:', error);
      }
    }
  }

  return null;
}

// GET - Listar todas as instâncias
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth?.userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const instances = await prisma.whatsAppInstance.findMany({
      where: {
        isActive: true,
        createdBy: auth.userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(instances);
  } catch (error) {
    console.error('Erro ao buscar instâncias:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// POST - Criar nova instância
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth?.userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { instanceName, instanceId, apiUrl, apiKey, phoneNumber, channel, token, status, qrCode } = body;

    if (!instanceName || !apiUrl || !apiKey) {
      return NextResponse.json({ error: 'Dados obrigatórios não fornecidos' }, { status: 400 });
    }

    // Verificar se já existe uma instância com o mesmo nome
    const existingInstance = await prisma.whatsAppInstance.findUnique({
      where: { instanceName }
    });

    if (existingInstance) {
      return NextResponse.json({ error: 'Já existe uma instância com este nome' }, { status: 409 });
    }

    const instance = await prisma.whatsAppInstance.create({
      data: {
        instanceName,
        instanceId,
        apiUrl,
        apiKey,
        phoneNumber,
        channel: channel || 'BAILEYS',
        token,
        status: status || 'created',
        qrCode,
        createdBy: auth.userId
      }
    });

    return NextResponse.json(instance, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar instância:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// PUT - Atualizar instância
export async function PUT(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth?.userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { id, instanceId, status, qrCode, phoneNumber } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID da instância é obrigatório' }, { status: 400 });
    }

    const instance = await prisma.whatsAppInstance.update({
      where: {
        id,
        createdBy: auth.userId
      },
      data: {
        ...(instanceId && { instanceId }),
        ...(status && { status }),
        ...(qrCode !== undefined && { qrCode }),
        ...(phoneNumber !== undefined && { phoneNumber }),
        updatedAt: new Date()
      }
    });

    return NextResponse.json(instance);
  } catch (error) {
    console.error('Erro ao atualizar instância:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// DELETE - Deletar instância
export async function DELETE(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth?.userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID da instância é obrigatório' }, { status: 400 });
    }

    await prisma.whatsAppInstance.update({
      where: {
        id,
        createdBy: auth.userId
      },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ message: 'Instância deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar instância:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}