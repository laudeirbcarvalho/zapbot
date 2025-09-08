import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug do tenant é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar tenant pelo slug
    const tenant = await prisma.tenant.findFirst({
      where: {
        slug: slug.toLowerCase(),
        isActive: true
      },
      include: {
        settings: {
          where: {
            key: {
              in: ['system_name', 'system_logo_url', 'system_url']
            }
          }
        }
      }
    });

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant não encontrado ou inativo' },
        { status: 404 }
      );
    }

    // Converter configurações para objeto
    const settingsMap = tenant.settings.reduce((acc: any, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});

    // Retornar informações do tenant
    const tenantInfo = {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      domain: tenant.domain,
      isActive: tenant.isActive,
      settings: settingsMap
    };

    return NextResponse.json({
      success: true,
      tenant: tenantInfo
    });

  } catch (error) {
    console.error('Erro ao buscar tenant:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}