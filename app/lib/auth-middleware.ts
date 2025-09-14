import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

interface AuthUser {
  id: string;
  name: string;
  email: string;
  userType: 'ADMIN' | 'MANAGER';
  isSuperAdmin: boolean;
  accountId: string | null;
  tenantId: string | null;
  isActive: boolean;
}



// Extrair usuário do token JWT
export async function getUserFromRequest(request: NextRequest): Promise<AuthUser | null> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    let decoded: any;
    
    try {
      // Tentar JWT primeiro
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    } catch (jwtError) {
      // Se falhar, tentar decodificar token simples (para desenvolvimento)
      try {
        decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
      } catch (simpleError) {
        console.error('Erro ao decodificar token:', jwtError, simpleError);
        return null;
      }
    }
    
    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        userType: true,
        isSuperAdmin: true,
        accountId: true,
        tenantId: true,
        isActive: true
      }
    });

    return user;
  } catch (error) {
    console.error('Erro ao extrair usuário do token:', error);
    return null;
  }
}



// Middleware para verificar autenticação
export async function requireAuth(request: NextRequest) {
  const user = await getUserFromRequest(request);
  
  if (!user) {
    return {
      error: 'Token de autenticação inválido ou expirado',
      status: 401
    };
  }

  return { user };
}



// Função auxiliar para aplicar middleware em rotas
export function withAuth(handler: Function) {
  return async (request: NextRequest, context?: any) => {
    const authResult = await requireAuth(request);
    
    if ('error' in authResult) {
      return Response.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    // Adicionar usuário ao contexto da requisição
    (request as any).user = authResult.user;
    
    return handler(request, context);
  };
}