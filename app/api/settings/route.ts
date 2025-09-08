import { NextResponse } from 'next/server';
import { withAuth } from '@/app/lib/auth-middleware';

// Simulação de configurações (em um cenário real, usaríamos o Prisma)
let mockSettings = {
  nomeEmpresa: "",
  email: "",
  telefone: "",
  endereco: "",
  webhookUrl: "",
  apiKey: "",
  tema: "escuro"
};

export const GET = withAuth(async () => {
  try {
    return NextResponse.json(mockSettings);
  } catch (error) {
    console.error('Erro na API de configurações:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
});

export const PUT = withAuth(async (request: Request) => {
  try {
    
    const data = await request.json();
    
    // Validar dados
    if (!data.nomeEmpresa) {
      return NextResponse.json({ error: 'Nome da empresa é obrigatório' }, { status: 400 });
    }
    
    // Atualizar configurações
    mockSettings = { ...mockSettings, ...data };
    
    return NextResponse.json(mockSettings);
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error);
    return NextResponse.json({ error: 'Erro ao processar requisição' }, { status: 500 });
  }
});