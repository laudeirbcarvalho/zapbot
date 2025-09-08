import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    const tenantSlug = request.headers.get('X-Tenant-Slug');

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    let tenantId = null;

    // Se um slug de tenant foi fornecido, validar e obter o tenant
    if (tenantSlug) {
      const tenant = await prisma.tenant.findFirst({
        where: {
          slug: tenantSlug.toLowerCase(),
          isActive: true
        }
      });

      if (!tenant) {
        return NextResponse.json(
          { error: 'Tenant não encontrado ou inativo' },
          { status: 404 }
        );
      }

      tenantId = tenant.id;
    }

    // Buscar usuário no banco
    const whereClause: any = {
      email: email.toLowerCase(),
      isActive: true
    };

    // Se um tenant foi especificado, filtrar por ele (exceto para Super Admins)
    if (tenantId) {
      whereClause.OR = [
        { tenantId: tenantId }, // Usuário pertence ao tenant
        { isSuperAdmin: true }   // Ou é Super Admin (pode acessar qualquer tenant)
      ];
    }

    const user = await prisma.user.findFirst({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        userType: true,
        isSuperAdmin: true,
        accountId: true,
        isActive: true,
        tenantId: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
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

    // Verificar se o usuário tem acesso ao tenant (se especificado)
    if (tenantId && !user.isSuperAdmin && user.tenantId !== tenantId) {
      return NextResponse.json(
        { error: 'Usuário não tem acesso a este tenant' },
        { status: 403 }
      );
    }

    // Gerar JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        userType: user.userType,
        isSuperAdmin: user.isSuperAdmin,
        tenantId: tenantId || user.tenantId
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