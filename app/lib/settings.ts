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
  private cache: Map<string, any> = new Map();
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  constructor() {
    // Inicialização sem tenantId
  }

  /**
   * Obtém uma configuração específica
   */
  async getSetting(key: string): Promise<any> {
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
   * Obtém configurações por categoria
   */
  async getSettingsByCategory(category: string): Promise<any[]> {
    const settings = await prisma.systemSettings.findMany({
      where: { category },
      orderBy: { key: 'asc' }
    });
    return settings.map(s => ({ ...s, value: JSON.parse(s.value) }));
  }

  /**
   * Obtém configurações públicas
   */
  async getPublicSettings(): Promise<any[]> {
    const settings = await prisma.systemSettings.findMany({
      where: { isPublic: true },
      orderBy: { key: 'asc' }
    });
    return settings.map(s => ({ ...s, value: JSON.parse(s.value) }));
  }

  /**
   * Atualiza uma configuração
   */
  async updateSetting(key: string, value: any): Promise<void> {
    await prisma.systemSettings.upsert({
      where: {
        key,
      },
      update: {
        value: JSON.stringify(value),
        updatedAt: new Date(),
      },
      create: {
         key,
         value: JSON.stringify(value),
         type: 'string',
         category: 'general'
       },
    });

    // Update cache
    this.cache.set(key, value);
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
      orderBy: { key: 'asc' }
    });

    this.cache.clear();
    settings.forEach(setting => {
      try {
        this.cache.set(setting.key, JSON.parse(setting.value));
      } catch {
        this.cache.set(setting.key, setting.value);
      }
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
 * Função utilitária para buscar configurações do sistema
 */
export async function getSystemSettings(): Promise<SettingsManager> {
  return new SettingsManager();
}