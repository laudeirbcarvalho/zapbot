import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireSuperAdmin } from '@/app/lib/jwt-auth';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// PUT - Atualizar tenant/administrador
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verificar se é super admin
    requireSuperAdmin(request);

    const { name, slug, domain, email, password, logo } = await request.json();
    const { id } = params;

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Nome e slug são obrigatórios' },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se o tenant existe
    const existingTenant = await prisma.tenant.findUnique({
      where: { id }
    });

    if (!existingTenant) {
      return NextResponse.json(
        { error: 'Administrador não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se slug já existe (exceto o atual)
    const existingSlug = await prisma.tenant.findFirst({
      where: { 
        slug: slug.toLowerCase(),
        id: { not: id }
      }
    });

    if (existingSlug) {
      return NextResponse.json(
        { error: 'Slug já está em uso' },
        { status: 400 }
      );
    }

    // Verificar se domínio já existe (se fornecido e exceto o atual)
    if (domain) {
      const existingDomain = await prisma.tenant.findFirst({
        where: { 
          domain,
          id: { not: id }
        }
      });

      if (existingDomain) {
        return NextResponse.json(
          { error: 'Domínio já está em uso' },
          { status: 400 }
        );
      }
    }

    // Verificar se email já existe (exceto o atual)
    const existingEmail = await prisma.tenant.findFirst({
      where: { 
        email,
        id: { not: id }
      }
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email já está em uso' },
        { status: 400 }
      );
    }

    // Preparar dados para atualização
    const updateData: any = {
      name,
      slug: slug.toLowerCase(),
      domain: domain || null,
      email,
      logo: logo || null
    };

    // Se uma nova senha foi fornecida, fazer hash
    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 12);
    }

    // Atualizar tenant
    const updatedTenant = await prisma.tenant.update({
      where: { id },
      data: updateData
    });

    // Remover senha do retorno
    const { password: _, ...tenantWithoutPassword } = updatedTenant;

    return NextResponse.json(tenantWithoutPassword);
  } catch (error) {
    console.error('Erro ao atualizar tenant:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Excluir tenant/administrador
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verificar se é super admin
    requireSuperAdmin(request);

    const { id } = params;

    // Verificar se o tenant existe
    const existingTenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        users: true,
        settings: true
      }
    });

    if (!existingTenant) {
      return NextResponse.json(
        { error: 'Administrador não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se há usuários associados
    if (existingTenant.users.length > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir um administrador que possui usuários associados' },
        { status: 400 }
      );
    }

    // Excluir configurações do sistema primeiro (devido à relação)
    await prisma.systemSettings.deleteMany({
      where: { tenantId: id }
    });

    // Excluir tenant
    await prisma.tenant.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Administrador excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir tenant:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}