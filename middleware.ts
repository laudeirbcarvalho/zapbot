import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl;
  
  // Ignorar arquivos estáticos e algumas API routes específicas
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/favicon.ico') ||
    (pathname.includes('.') && !pathname.startsWith('/api/'))
  ) {
    return NextResponse.next();
  }

  // Para desenvolvimento local, usar tenant padrão
  const response = NextResponse.next();
  
  // Definir tenant padrão para localhost
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('localhost')) {
    response.headers.set('x-tenant-id', 'default');
    response.headers.set('x-tenant-slug', 'default');
    response.headers.set('x-tenant-name', 'CRM');
  } else {
    // Para outros domínios, usar o hostname como identificador
    response.headers.set('x-tenant-id', hostname);
    response.headers.set('x-tenant-slug', hostname);
    response.headers.set('x-tenant-name', 'CRM');
    response.headers.set('x-tenant-domain', hostname);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};