import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface SystemSetting {
  id: string;
  key: string;
  value: string;
  type: string;
  category: string;
  description?: string;
  isPublic: boolean;
}

export class SettingsManager {
  private tenantId: string;
  private cache: Map<string, SystemSetting> = new Map();
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  /**
   * Busca uma configuração específica
   */
  async getSetting(key: string): Promise<SystemSetting | null> {
    await this.loadCache();
    return this.cache.get(key) || null;
  }

  /**
   * Busca o valor de uma configuração
   */
  async getValue(key: string, defaultValue?: string): Promise<string | null> {
    const setting = await this.getSetting(key);
    return setting ? setting.value : (defaultValue || null);
  }

  /**
   * Busca configurações por categoria
   */
  async getSettingsByCategory(category: string): Promise<SystemSetting[]> {
    await this.loadCache();
    return Array.from(this.cache.values()).filter(s => s.category === category);
  }

  /**
   * Busca todas as configurações públicas
   */
  async getPublicSettings(): Promise<SystemSetting[]> {
    await this.loadCache();
    return Array.from(this.cache.values()).filter(s => s.isPublic);
  }

  /**
   * Atualiza uma configuração
   */
  async updateSetting(key: string, value: string): Promise<SystemSetting> {
    const setting = await prisma.systemSettings.upsert({
      where: {
        tenantId_key: {
          tenantId: this.tenantId,
          key: key
        }
      },
      update: {
        value: value,
        updatedAt: new Date()
      },
      create: {
        tenantId: this.tenantId,
        key: key,
        value: value,
        type: 'string',
        category: 'general'
      }
    });

    // Limpar cache para forçar reload
    this.clearCache();
    
    return setting;
  }

  /**
   * Atualiza múltiplas configurações
   */
  async updateSettings(settings: { key: string; value: string }[]): Promise<void> {
    for (const setting of settings) {
      await this.updateSetting(setting.key, setting.value);
    }
  }

  /**
   * Carrega configurações no cache
   */
  private async loadCache(): Promise<void> {
    const now = Date.now();
    if (this.cacheExpiry > now && this.cache.size > 0) {
      return; // Cache ainda válido
    }

    const settings = await prisma.systemSettings.findMany({
      where: { tenantId: this.tenantId },
      orderBy: { key: 'asc' }
    });

    this.cache.clear();
    settings.forEach(setting => {
      this.cache.set(setting.key, setting);
    });

    this.cacheExpiry = now + this.CACHE_DURATION;
  }

  /**
   * Limpa o cache
   */
  private clearCache(): void {
    this.cache.clear();
    this.cacheExpiry = 0;
  }
}

/**
 * Função utilitária para buscar configurações de um tenant
 */
export async function getTenantSettings(tenantId: string): Promise<SettingsManager> {
  return new SettingsManager(tenantId);
}

/**
 * Função para buscar tenant por slug ou domínio
 */
export async function getTenantByIdentifier(identifier: string): Promise<any> {
  // Primeiro tenta por slug
  let tenant = await prisma.tenant.findUnique({
    where: { slug: identifier },
    include: { settings: true }
  });

  // Se não encontrar, tenta por domínio
  if (!tenant) {
    tenant = await prisma.tenant.findUnique({
      where: { domain: identifier },
      include: { settings: true }
    });
  }

  return tenant;
}

/**
 * Função para buscar tenant padrão
 */
export async function getDefaultTenant(): Promise<any> {
  return await prisma.tenant.findUnique({
    where: { slug: 'default' },
    include: { settings: true }
  });
}