'use client';

import { useEffect, useState } from 'react';

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  domain?: string;
}

export interface SystemSettings {
  system_name: string;
  system_logo_url: string;
  system_url: string;
  [key: string]: string;
}

export function useTenant() {
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Obter informações do tenant das meta tags
  const getTenantFromMeta = () => {
    if (typeof window === 'undefined') return { tenantId: null, tenantSlug: null, tenantName: null };
    
    const tenantId = document.querySelector('meta[name="tenant-id"]')?.getAttribute('content') || null;
    const tenantSlug = document.querySelector('meta[name="tenant-slug"]')?.getAttribute('content') || null;
    const tenantName = document.querySelector('meta[name="tenant-name"]')?.getAttribute('content') || null;
    
    return { tenantId, tenantSlug, tenantName };
  };

  useEffect(() => {
    async function fetchTenantInfo() {
      try {
        setLoading(true);
        
        // Buscar informações do tenant atual
        const response = await fetch('/api/tenant/current');
        if (!response.ok) {
          throw new Error('Erro ao buscar informações do tenant');
        }
        
        const data = await response.json();
        setTenant(data.tenant);
        setSettings(data.settings);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    }

    fetchTenantInfo();
  }, []);

  const updateSettings = async (newSettings: Partial<SystemSettings>) => {
    try {
      const { authenticatedFetch } = await import('@/app/lib/api-client');
      
      const updatedSettings = await authenticatedFetch('/api/tenant/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
      });

      setSettings(prev => ({ ...prev, ...updatedSettings }));
      
      return updatedSettings;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao atualizar configurações');
    }
  };

  const getSystemName = () => {
    return settings?.system_name || 'CRM';
  };

  const getSystemLogo = () => {
    return settings?.system_logo_url || '/logo.png';
  };

  return {
    tenant,
    settings,
    loading,
    error,
    updateSettings,
    getSystemName,
    getSystemLogo,
  };
}

// Hook para usar em componentes server-side
export function getTenantFromHeaders(headers: Headers): TenantInfo | null {
  const id = headers.get('x-tenant-id');
  const name = headers.get('x-tenant-name');
  const slug = headers.get('x-tenant-slug');
  const domain = headers.get('x-tenant-domain');

  if (!id || !name || !slug) {
    return null;
  }

  return {
    id,
    name,
    slug,
    domain: domain || undefined,
  };
}