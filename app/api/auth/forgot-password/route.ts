import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    console.log('📧 Iniciando processo de recuperação de senha');
    const { email } = await request.json();
    console.log('📧 Email solicitado:', email);

    if (!email) {
      console.log('❌ Email não fornecido');
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se o banco está disponível
    try {
      await prisma.$connect();
      console.log('✅ Conexão com banco estabelecida');
    } catch (connectionError) {
      console.log('❌ Banco não disponível, usando fallback...');
      // Redirecionar para API de fallback
      const fallbackResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/forgot-password-fallback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const fallbackData = await fallbackResponse.json();
      return NextResponse.json(fallbackData, { status: fallbackResponse.status });
    }

    // Verificar se o usuário existe
    console.log('🔍 Procurando usuário no banco...');
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log('❌ Usuário não encontrado:', email);
      // Listar todos os usuários para debug
      const allUsers = await prisma.user.findMany({
        select: { email: true, name: true }
      });
      console.log('📋 Usuários no banco:', allUsers);
      // Por segurança, não revelamos se o email existe ou não
      return NextResponse.json(
        { message: 'Se o email existir, você receberá um link de recuperação.' },
        { status: 200 }
      );
    }
    
    console.log('✅ Usuário encontrado:', user.email);

    // Gerar token de reset
    console.log('🔑 Gerando token de reset...');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hora
    console.log('🔑 Token gerado:', resetToken.substring(0, 10) + '...');
    console.log('⏰ Token expira em:', resetTokenExpiry);

    // Salvar token no banco
    console.log('💾 Salvando token no banco...');
    await prisma.user.update({
      where: { email },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });
    console.log('✅ Token salvo no banco');

    // Verificar variáveis de ambiente
    console.log('🔧 Verificando configurações de email...');
    console.log('EMAIL_USER:', process.env.EMAIL_USER);
    console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
    console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
    console.log('EMAIL_PASS definido:', !!process.env.EMAIL_PASS);

    // Configurar transporter de email (exemplo com Gmail)
    console.log('📮 Configurando transporter...');
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Testar conexão
    console.log('🔗 Testando conexão com servidor de email...');
    try {
      await transporter.verify();
      console.log('✅ Conexão com servidor de email OK');
    } catch (verifyError) {
      console.error('❌ Erro na conexão com servidor de email:', verifyError);
      return NextResponse.json(
        { error: 'Erro na configuração de email' },
        { status: 500 }
      );
    }

    // URL de reset
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    console.log('📧 URL de reset:', resetUrl);

    // Enviar email
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@crm.com',
      to: email,
      subject: 'Recuperação de Senha - CRM',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Recuperação de Senha</h2>
          <p>Você solicitou a recuperação de senha para sua conta no CRM.</p>
          <p>Clique no link abaixo para redefinir sua senha:</p>
          <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Redefinir Senha</a>
          <p style="margin-top: 20px; color: #666;">Este link expira em 1 hora.</p>
          <p style="color: #666;">Se você não solicitou esta recuperação, ignore este email.</p>
        </div>
      `,
    };

    console.log('📤 Enviando email...');
    try {
      await transporter.sendMail(mailOptions);
      console.log('✅ Email de recuperação enviado para:', email);
    } catch (emailError) {
      console.error('❌ Erro ao enviar email:', emailError);
      // Mesmo com erro no email, não revelamos isso ao usuário
    }

    return NextResponse.json(
      { message: 'Se o email existir, você receberá um link de recuperação' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro na recuperação de senha:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}