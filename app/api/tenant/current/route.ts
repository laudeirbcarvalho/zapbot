import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Obter informações do tenant dos headers (definidos pelo middleware)
    const tenantId = request.headers.get('x-tenant-id');
    const tenantName = request.headers.get('x-tenant-name');
    const tenantSlug = request.headers.get('x-tenant-slug');
    const tenantDomain = request.headers.get('x-tenant-domain');

    if (!tenantId || !tenantName || !tenantSlug) {
      return NextResponse.json(
        { error: 'Informações do tenant não encontradas' },
        { status: 400 }
      );
    }

    // Para desenvolvimento local, buscar configurações do tenant padrão
    let settings: { [key: string]: string } = {
      system_name: 'CRM',
      system_logo_url: '',
      system_url: 'http://localhost:3000'
    };

    try {
      // Tentar buscar tenant real do banco de dados
      const tenant = await prisma.tenant.findFirst({
        include: {
          settings: {
            where: {
              isPublic: true
            }
          }
        }
      });

      if (tenant && tenant.settings) {
        // Converter configurações para objeto simples
        tenant.settings.forEach(setting => {
          settings[setting.key] = setting.value;
        });
      }
    } catch (dbError) {
      console.log('Usando configurações padrão (banco não disponível)');
    }

    const tenantInfo = {
      id: tenantId,
      name: tenantName,
      slug: tenantSlug,
      domain: tenantDomain || undefined,
    };

    return NextResponse.json({
      tenant: tenantInfo,
      settings,
    });
  } catch (error) {
    console.error('Erro ao buscar informações do tenant:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}