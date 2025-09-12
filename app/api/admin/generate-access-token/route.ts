import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { withAuth } from '@/app/lib/auth-middleware';

// POST - Gerar token de acesso direto para administrador
export const POST = withAuth(async (
  request: NextRequest
) => {
  try {
    const body = await request.json();
    const {
      userId,
      email,
      userType,
      isSuperAdmin,
      name
    } = body;

    // Validar dados obrigatórios
    if (!userId || !email) {
      return NextResponse.json(
        { error: 'userId e email são obrigatórios' },
        { status: 400 }
      );
    }

    // Gerar token JWT
    const token = jwt.sign(
      {
        userId,
        email,
        name,
        userType: userType || 'ADMIN',
        isSuperAdmin: isSuperAdmin || false
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    console.log('🔑 Token de acesso gerado para:', name);

    return NextResponse.json({
      token,
      message: `Token de acesso gerado para ${name}`,
      expiresIn: '24h'
    });

  } catch (error) {
    console.error('Erro ao gerar token de acesso:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});