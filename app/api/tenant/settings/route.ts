import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/app/lib/jwt-auth';
import { getTenantSettings } from '@/app/lib/settings';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const tenantId = request.headers.get('x-tenant-id') || request.headers.get('X-Tenant-Id');
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant não identificado' },
        { status: 400 }
      );
    }

    const settingsManager = await getTenantSettings(tenantId);
    
    // Se for super admin, retorna todas as configurações
    // Senão, retorna apenas as públicas
    let settings;
    if (user.isSuperAdmin) {
      const general = await settingsManager.getSettingsByCategory('general');
      const smtp = await settingsManager.getSettingsByCategory('smtp');
      const appearance = await settingsManager.getSettingsByCategory('appearance');
      settings = [...general, ...smtp, ...appearance];
    } else {
      settings = await settingsManager.getPublicSettings();
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    
    // Verificar se é erro de autenticação
    if (error instanceof Error && (error.message.includes('Acesso negado') || error.message.includes('Token'))) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    if (!user.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas Super Admins podem alterar configurações.' },
        { status: 403 }
      );
    }

    const tenantId = request.headers.get('x-tenant-id') || request.headers.get('X-Tenant-Id');
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant não identificado' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const settingsManager = await getTenantSettings(tenantId);

    // Atualizar configurações
    const settingsToUpdate = Object.entries(body).map(([key, value]) => ({
      key,
      value: String(value)
    }));

    await settingsManager.updateSettings(settingsToUpdate);

    // Retornar configurações atualizadas
    const updatedSettings: { [key: string]: string } = {};
    for (const { key, value } of settingsToUpdate) {
      updatedSettings[key] = value;
    }

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error);
    
    // Verificar se é erro de autenticação
    if (error instanceof Error && (error.message.includes('Acesso negado') || error.message.includes('Token'))) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}