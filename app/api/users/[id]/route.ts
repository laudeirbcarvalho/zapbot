import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { withAuth } from '@/app/lib/auth-middleware';

const prisma = new PrismaClient();

// GET - Buscar usuário por ID
export const GET = withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: params.id
      },
      select: {
        id: true,
        name: true,
        email: true,
        userType: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});

// PUT - Atualizar usuário
export const PUT = withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const body = await request.json();
    const {
      name,
      email,
      password,
      userType,
      isActive
    } = body;

    // Verificar se o usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o email já está em uso por outro usuário
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email }
      });

      if (emailExists) {
        return NextResponse.json(
          { error: 'Este email já está em uso' },
          { status: 409 }
        );
      }
    }

    // Preparar dados para atualização
    const updateData: any = {};
    
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (userType) updateData.userType = userType;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    // Hash da nova senha se fornecida
    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    // Atualizar usuário
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        userType: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });



    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});

// DELETE - Excluir usuário
export const DELETE = withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    // Verificar se o usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Proteger Super Admin contra exclusão
    if (existingUser.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Super Admin não pode ser excluído' },
        { status: 403 }
      );
    }

    // Excluir o usuário
    await prisma.user.delete({
      where: { id: params.id }
    });

    return NextResponse.json(
      { message: 'Usuário excluído com sucesso' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});