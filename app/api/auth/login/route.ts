import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar usuário no banco
    const user = await prisma.user.findUnique({
      where: {
        email: email.toLowerCase(),
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        userType: true,
        isSuperAdmin: true,
        accountId: true,
        isActive: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    // Gerar JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        userType: user.userType,
        isSuperAdmin: user.isSuperAdmin
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    // Remover senha da resposta
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Erro no login:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}