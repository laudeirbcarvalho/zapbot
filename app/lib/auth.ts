import { PrismaClient } from "@prisma/client";
import { compare } from "bcryptjs";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { authenticateWithFallback, checkDatabaseConnection } from './fallback-auth';

const prisma = new PrismaClient();

// Função para testar conexão com o banco
async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    return true;
  } catch (error) {
    console.error('Erro de conexão com o banco de dados:', error);
    return false;
  }
}

export const authOptions: NextAuthOptions = {
  // Removido o adapter do PrismaAdapter para evitar o erro
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          console.log('🔍 Tentativa de login para:', credentials.email);
          console.log('🔍 Senha fornecida:', credentials.password);
          
          // Verificar se o banco está disponível
          const isDatabaseAvailable = await checkDatabaseConnection();
          console.log('🔗 Banco de dados disponível:', isDatabaseAvailable);
          
          if (!isDatabaseAvailable) {
            console.log('🔄 Usando sistema de fallback...');
            return await authenticateWithFallback(credentials.email, credentials.password);
          }

          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email,
            },
          });

          if (!user) {
            console.log('❌ Usuário não encontrado:', credentials.email);
            console.log('🔍 Verificando todos os usuários no banco...');
            const allUsers = await prisma.user.findMany({
              select: { email: true, name: true }
            });
            console.log('📋 Usuários encontrados:', allUsers);
            
            // Tentar fallback se não encontrar no banco
            console.log('🔄 Tentando fallback...');
            return await authenticateWithFallback(credentials.email, credentials.password);
          }

          console.log('✅ Usuário encontrado:', user.email);
          console.log('🔍 Hash no banco:', user.password);
          console.log('🔍 Comprimento do hash:', user.password.length);

          const isPasswordValid = await compare(credentials.password, user.password);

          console.log('🔍 Resultado da comparação:', isPasswordValid);

          if (!isPasswordValid) {
            console.log('❌ Senha inválida para usuário:', credentials.email);
            // Teste adicional com hash conhecido
            const testHash = '$2b$10$4DN9ONVk.zKNMB8X4IuTVOS2UBWb1V6LQ/HKRYiOU6PF1q6rSxat2';
            const testResult = await compare(credentials.password, testHash);
            console.log('🧪 Teste com hash conhecido:', testResult);
            return null;
          }

          console.log('✅ Login bem-sucedido para:', credentials.email);
          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
          };
        } catch (error) {
          console.error('❌ Erro durante autenticação:', error);
          console.error('❌ Stack trace:', error.stack);
          
          // Em caso de erro, tentar fallback
          console.log('🔄 Erro no banco, tentando fallback...');
          try {
            return await authenticateWithFallback(credentials.email, credentials.password);
          } catch (fallbackError) {
            console.error('❌ Erro no fallback também:', fallbackError);
            return null;
          }
        }
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.name = token.name;
        session.user.email = token.email;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
};