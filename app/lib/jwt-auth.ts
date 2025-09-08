import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

interface JWTPayload {
  userId: string;
  email: string;
  userType: string;
  isSuperAdmin: boolean;
  tenantId?: string;
}

export function verifyJWT(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback-secret'
    ) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('Erro ao verificar JWT:', error);
    return null;
  }
}

export function getJWTFromRequest(request: NextRequest): JWTPayload | null {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7); // Remove 'Bearer '
  return verifyJWT(token);
}

export function requireSuperAdmin(request: NextRequest): JWTPayload {
  const payload = getJWTFromRequest(request);
  
  if (!payload) {
    throw new Error('Token de autenticação não fornecido');
  }
  
  if (!payload.isSuperAdmin) {
    throw new Error('Acesso negado. Apenas Super Admins podem acessar este recurso.');
  }
  
  return payload;
}

export function requireAuth(request: NextRequest): JWTPayload {
  const payload = getJWTFromRequest(request);
  
  if (!payload) {
    throw new Error('Token de autenticação não fornecido');
  }
  
  return payload;
}