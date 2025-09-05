import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { evolutionUrl, apiKey, phoneNumber, instanceName } = await request.json();

    if (!evolutionUrl || !apiKey || !phoneNumber) {
      return NextResponse.json(
        { error: 'URL da Evolution API, API Key e número do WhatsApp são obrigatórios' },
        { status: 400 }
      );
    }

    // Criar ou conectar instância na Evolution API
    const instanceId = instanceName || phoneNumber;
    
    try {
      // Primeiro, tentar criar a instância
      const createResponse = await fetch(`${evolutionUrl}/instance/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey,
        },
        body: JSON.stringify({
          instanceName: instanceId,
          token: apiKey,
          qrcode: true,
          number: phoneNumber,
        }),
      });

      let instanceData;
      if (createResponse.ok) {
        instanceData = await createResponse.json();
      } else {
        // Se falhar ao criar, tentar conectar com instância existente
        const connectResponse = await fetch(`${evolutionUrl}/instance/connect/${instanceId}`, {
          method: 'GET',
          headers: {
            'apikey': apiKey,
          },
        });
        
        if (connectResponse.ok) {
          instanceData = await connectResponse.json();
        } else {
          throw new Error('Falha ao criar ou conectar com a instância');
        }
      }

      // Gerar QR Code
      const qrResponse = await fetch(`${evolutionUrl}/instance/connect/${instanceId}`, {
        method: 'GET',
        headers: {
          'apikey': apiKey,
        },
      });

      let qrCode = null;
      if (qrResponse.ok) {
        const qrData = await qrResponse.json();
        qrCode = qrData.base64 || qrData.qrcode;
      }

      // Salvar configuração no banco de dados
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });

      if (!user) {
        return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
      }

      // Verificar se já existe uma integração Evolution para este usuário
      const existingIntegration = await prisma.integration.findFirst({
        where: {
          userId: user.id,
          type: 'evolution',
        },
      });

      const integrationData = {
        evolutionUrl,
        apiKey,
        phoneNumber,
        instanceName: instanceId,
        status: 'connecting',
      };

      if (existingIntegration) {
        await prisma.integration.update({
          where: { id: existingIntegration.id },
          data: {
            config: integrationData,
            isActive: true,
          },
        });
      } else {
        await prisma.integration.create({
          data: {
            userId: user.id,
            type: 'evolution',
            name: 'Evolution API',
            config: integrationData,
            isActive: true,
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Conexão com Evolution API configurada com sucesso',
        qrCode,
        instanceId,
      });

    } catch (evolutionError) {
      console.error('Erro ao conectar com Evolution API:', evolutionError);
      return NextResponse.json(
        { error: 'Erro ao conectar com Evolution API. Verifique a URL e API Key.' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Erro interno:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}