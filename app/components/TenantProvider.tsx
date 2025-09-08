import { headers } from 'next/headers';

export async function TenantProvider({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const tenantId = headersList.get('x-tenant-id') || '';
  const tenantSlug = headersList.get('x-tenant-slug') || '';
  const tenantName = headersList.get('x-tenant-name') || '';

  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            if (typeof document !== 'undefined') {
              const metaTenantId = document.querySelector('meta[name="tenant-id"]');
              const metaTenantSlug = document.querySelector('meta[name="tenant-slug"]');
              const metaTenantName = document.querySelector('meta[name="tenant-name"]');
              
              if (metaTenantId) metaTenantId.setAttribute('content', '${tenantId}');
              if (metaTenantSlug) metaTenantSlug.setAttribute('content', '${tenantSlug}');
              if (metaTenantName) metaTenantName.setAttribute('content', '${tenantName}');
            }
          `,
        }}
      />
      {children}
    </>
  );
}