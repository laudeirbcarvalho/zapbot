// 📋 GUIA COMPLETO: Como acessar o banco de dados com Prisma
// ================================================================

// 1. IMPORTAR O PRISMA CLIENT
const { PrismaClient } = require('@prisma/client');
// ou em TypeScript/ES6:
// import { PrismaClient } from '@prisma/client';

// 2. CRIAR UMA INSTÂNCIA DO PRISMA
const prisma = new PrismaClient();

// 3. EXEMPLOS DE USO

// ===== BUSCAR DADOS =====
async function buscarUsuarios() {
  try {
    // Buscar todos os usuários
    const usuarios = await prisma.user.findMany();
    console.log('Todos os usuários:', usuarios);

    // Buscar usuário por ID
    const usuario = await prisma.user.findUnique({
      where: { id: 'seu-id-aqui' }
    });
    console.log('Usuário específico:', usuario);

    // Buscar com filtros
    const admins = await prisma.user.findMany({
      where: {
        userType: 'ADMIN',
        isActive: true
      }
    });
    console.log('Administradores ativos:', admins);

    // Buscar com relacionamentos
    const usuarioComAtendimentos = await prisma.user.findUnique({
      where: { id: 'seu-id-aqui' },
      include: {
        attendances: true,
        createdLeads: true
      }
    });
    console.log('Usuário com relacionamentos:', usuarioComAtendimentos);

  } catch (error) {
    console.error('Erro ao buscar dados:', error);
  }
}

// ===== CRIAR DADOS =====
async function criarUsuario() {
  try {
    const novoUsuario = await prisma.user.create({
      data: {
        name: 'João Silva',
        email: 'joao@exemplo.com',
        password: 'senha-hash-aqui',
        userType: 'MANAGER',
        isActive: true
      }
    });
    console.log('Usuário criado:', novoUsuario);
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
  }
}

// ===== ATUALIZAR DADOS =====
async function atualizarUsuario() {
  try {
    const usuarioAtualizado = await prisma.user.update({
      where: { id: 'seu-id-aqui' },
      data: {
        name: 'João Silva Santos',
        isActive: false
      }
    });
    console.log('Usuário atualizado:', usuarioAtualizado);
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
  }
}

// ===== DELETAR DADOS =====
async function deletarUsuario() {
  try {
    const usuarioDeletado = await prisma.user.delete({
      where: { id: 'seu-id-aqui' }
    });
    console.log('Usuário deletado:', usuarioDeletado);
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
  }
}

// ===== UPSERT (Criar ou Atualizar) =====
async function upsertUsuario() {
  try {
    const usuario = await prisma.user.upsert({
      where: { email: 'joao@exemplo.com' },
      update: {
        name: 'João Silva Atualizado'
      },
      create: {
        name: 'João Silva',
        email: 'joao@exemplo.com',
        password: 'senha-hash-aqui',
        userType: 'MANAGER'
      }
    });
    console.log('Usuário upsert:', usuario);
  } catch (error) {
    console.error('Erro no upsert:', error);
  }
}

// ===== CONTAR REGISTROS =====
async function contarUsuarios() {
  try {
    const total = await prisma.user.count();
    console.log('Total de usuários:', total);

    const adminsAtivos = await prisma.user.count({
      where: {
        userType: 'ADMIN',
        isActive: true
      }
    });
    console.log('Admins ativos:', adminsAtivos);
  } catch (error) {
    console.error('Erro ao contar:', error);
  }
}

// ===== QUERIES RAW (SQL direto) =====
async function queryRaw() {
  try {
    // Query raw para casos específicos
    const resultado = await prisma.$queryRaw`
      SELECT COUNT(*) as total 
      FROM "User" 
      WHERE "userType" = 'ADMIN'
    `;
    console.log('Resultado query raw:', resultado);
  } catch (error) {
    console.error('Erro na query raw:', error);
  }
}

// ===== TRANSAÇÕES =====
async function transacao() {
  try {
    const resultado = await prisma.$transaction(async (tx) => {
      // Criar usuário
      const usuario = await tx.user.create({
        data: {
          name: 'Maria Silva',
          email: 'maria@exemplo.com',
          password: 'senha-hash',
          userType: 'MANAGER'
        }
      });

      // Criar lead associado
      const lead = await tx.lead.create({
        data: {
          name: 'Lead Teste',
          email: 'lead@exemplo.com',
          phone: '11999999999',
          userId: usuario.id
        }
      });

      return { usuario, lead };
    });

    console.log('Transação concluída:', resultado);
  } catch (error) {
    console.error('Erro na transação:', error);
  }
}

// ===== FUNÇÃO PRINCIPAL =====
async function main() {
  try {
    console.log('🔗 Conectando ao banco de dados...');
    await prisma.$connect();
    console.log('✅ Conectado com sucesso!');

    // Executar exemplos (descomente o que quiser testar)
    // await buscarUsuarios();
    // await criarUsuario();
    // await atualizarUsuario();
    // await contarUsuarios();
    // await queryRaw();
    // await transacao();

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    // IMPORTANTE: Sempre desconectar
    await prisma.$disconnect();
    console.log('🔌 Desconectado do banco');
  }
}

// ===== USANDO EM NEXT.JS (API Routes) =====
/*
// Em app/api/exemplo/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Usar instância singleton

export async function GET() {
  try {
    const usuarios = await prisma.user.findMany();
    return NextResponse.json(usuarios);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar usuários' },
      { status: 500 }
    );
  }
}
*/

// ===== COMANDOS ÚTEIS DO PRISMA =====
/*
# Gerar cliente Prisma após mudanças no schema
npx prisma generate

# Aplicar migrações
npx prisma migrate dev

# Visualizar banco no Prisma Studio
npx prisma studio

# Reset do banco (CUIDADO!)
npx prisma migrate reset

# Push do schema sem migração
npx prisma db push
*/

// Executar se for chamado diretamente
if (require.main === module) {
  main();
}

module.exports = {
  prisma,
  buscarUsuarios,
  criarUsuario,
  atualizarUsuario,
  deletarUsuario,
  contarUsuarios
};