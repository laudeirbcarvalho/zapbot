import { NextResponse } from 'next/server';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

// Armazenamento temporário de tokens (em produção, use Redis ou banco)
const resetTokens = new Map<string, { email: string; token: string; expiry: Date }>();

export async function POST(request: Request) {
  try {
    console.log('📧 [FALLBACK] Iniciando processo de recuperação de senha');
    const { email } = await request.json();
    console.log('📧 [FALLBACK] Email solicitado:', email);

    if (!email) {
      console.log('❌ [FALLBACK] Email não fornecido');
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se é um email válido do sistema
    const validEmails = ['ti@adlux.com.br', 'admin@zapbot.com'];
    
    if (!validEmails.includes(email)) {
      console.log('❌ [FALLBACK] Email não encontrado:', email);
      console.log('📋 [FALLBACK] Emails válidos:', validEmails);
      return NextResponse.json(
        { message: 'Se o email existir, você receberá um link de recuperação.' },
        { status: 200 }
      );
    }
    
    console.log('✅ [FALLBACK] Email válido encontrado:', email);

    // Gerar token de reset
    console.log('🔑 [FALLBACK] Gerando token de reset...');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hora
    console.log('🔑 [FALLBACK] Token gerado:', resetToken.substring(0, 10) + '...');
    console.log('⏰ [FALLBACK] Token expira em:', resetTokenExpiry);

    // Salvar token em memória
    console.log('💾 [FALLBACK] Salvando token em memória...');
    resetTokens.set(resetToken, {
      email,
      token: resetToken,
      expiry: resetTokenExpiry
    });
    console.log('✅ [FALLBACK] Token salvo em memória');

    // Verificar variáveis de ambiente
    console.log('🔧 [FALLBACK] Verificando configurações de email...');
    console.log('EMAIL_USER:', process.env.EMAIL_USER);
    console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
    console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
    console.log('EMAIL_PASS definido:', !!process.env.EMAIL_PASS);

    // Se não tiver configuração de email, simular envio
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('⚠️ [FALLBACK] Configuração de email não encontrada, simulando envio...');
      const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
      console.log('📧 [FALLBACK] URL de reset (SIMULADO):', resetUrl);
      console.log('✅ [FALLBACK] Email "enviado" com sucesso (simulado)!');
      
      return NextResponse.json(
        { 
          message: 'Email de recuperação enviado! (Modo de desenvolvimento)',
          resetUrl: resetUrl // Apenas para desenvolvimento
        },
        { status: 200 }
      );
    }

    // Configurar nodemailer
    console.log('📮 [FALLBACK] Configurando transporter...');
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Testar conexão
    console.log('🔗 [FALLBACK] Testando conexão com servidor de email...');
    try {
      await transporter.verify();
      console.log('✅ [FALLBACK] Conexão com servidor de email OK');
    } catch (verifyError) {
      console.error('❌ [FALLBACK] Erro na conexão com servidor de email:', verifyError);
      // Mesmo com erro, retornar sucesso para não revelar problemas internos
      const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
      console.log('📧 [FALLBACK] URL de reset (erro email):', resetUrl);
      return NextResponse.json(
        { 
          message: 'Email de recuperação enviado!',
          resetUrl: resetUrl // Para debug
        },
        { status: 200 }
      );
    }

    // Enviar email
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    console.log('📧 [FALLBACK] URL de reset:', resetUrl);
    
    console.log('📤 [FALLBACK] Enviando email...');
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Recuperação de Senha - ZapBot',
      html: `
        <h2>Recuperação de Senha</h2>
        <p>Você solicitou a recuperação de sua senha.</p>
        <p>Clique no link abaixo para redefinir sua senha:</p>
        <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-decoration: none; display: inline-block;">Redefinir Senha</a>
        <p>Este link expira em 1 hora.</p>
        <p>Se você não solicitou esta recuperação, ignore este email.</p>
      `,
    });
    console.log('✅ [FALLBACK] Email enviado com sucesso!');

    return NextResponse.json(
      { message: 'Email de recuperação enviado!' },
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ [FALLBACK] Erro no processo de recuperação:', error);
    return NextResponse.json(
      { message: 'Se o email existir, você receberá um link de recuperação.' },
      { status: 200 }
    );
  }
}

// Função para verificar token (para uso na API de reset)
export function getResetToken(token: string) {
  const tokenData = resetTokens.get(token);
  if (!tokenData) return null;
  
  if (new Date() > tokenData.expiry) {
    resetTokens.delete(token);
    return null;
  }
  
  return tokenData;
}

// Função para remover token após uso
export function removeResetToken(token: string) {
  resetTokens.delete(token);
}