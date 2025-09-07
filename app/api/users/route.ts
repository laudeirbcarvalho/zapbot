import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { withAuth } from '@/app/lib/auth-middleware';

const prisma = new PrismaClient();

// GET - Listar todos os usuários
export const GET = withAuth(async (request: NextRequest) => {
  try {
    const currentUser = (request as any).user;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const userType = searchParams.get('userType') || '';
    const isActive = searchParams.get('isActive');

    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {};
    
    // Filtrar baseado no tipo de usuário logado
    if (currentUser.isSuperAdmin) {
      // Super Admin pode ver todos os usuários
      // Não adiciona filtro adicional
    } else if (currentUser.userType === 'ADMIN') {
      // Administradores normais podem ver apenas gerentes da mesma conta e a si mesmos
      where.OR = [
        { 
          userType: 'MANAGER',
          accountId: currentUser.accountId // Apenas gerentes da mesma conta
        },
        { id: currentUser.id } // E a si mesmo
      ];
    } else {
      // Gerentes não deveriam acessar esta API, mas por segurança
      where.id = currentUser.id; // Só pode ver a si mesmo
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Se um userType específico foi solicitado, aplicar apenas se permitido
    if (userType) {
      if (currentUser.isSuperAdmin) {
        // Super Admin pode filtrar por qualquer tipo
        where.userType = userType;
      } else if (currentUser.userType === 'ADMIN' && userType === 'MANAGER') {
        // Admin normal pode filtrar apenas por gerentes
        where.userType = userType;
      }
      // Ignora filtro de userType para outros casos
    }
    
    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true';
    }

    // Buscar usuários com paginação
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          userType: true,
          isSuperAdmin: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.user.count({ where })
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});

// POST - Criar novo usuário
export const POST = withAuth(async (request: NextRequest) => {
  try {
    const currentUser = (request as any).user;
    const body = await request.json();
    const {
      name,
      email,
      password,
      userType = 'MANAGER',
      isActive = true
    } = body;

    // Validações básicas
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: name, email, password' },
        { status: 400 }
      );
    }

    // Verificar permissões para criar administradores
    if (userType === 'ADMIN') {
      // Apenas Super Admin pode criar administradores
      if (!currentUser.isSuperAdmin) {
        return NextResponse.json(
          { error: 'Apenas Super Admin pode criar administradores' },
          { status: 403 }
        );
      }
    }

    // Verificar se o email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email já está em uso' },
        { status: 400 }
      );
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Formato de email inválido' },
        { status: 400 }
      );
    }

    // Validar senha (mínimo 6 caracteres)
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 12);

    // Criar usuário
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        userType,
        isActive,
        isSuperAdmin: false // Novos usuários nunca são Super Admin
      },
      select: {
        id: true,
        name: true,
        email: true,
        userType: true,
        isSuperAdmin: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});