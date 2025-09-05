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

    const { evolutionUrl, apiKey, phoneNumber } = await request.json();

    if (!evolutionUrl || !apiKey || !phoneNumber) {
      return NextResponse.json(
        { error: 'URL da Evolution API, API Key e número do WhatsApp são obrigatórios' },
        { status: 400 }
      );
    }

    const instanceId = phoneNumber;

    try {
      // Gerar novo QR Code da Evolution API
      const qrResponse = await fetch(`${evolutionUrl}/instance/connect/${instanceId}`, {
        method: 'GET',
        headers: {
          'apikey': apiKey,
        },
      });

      if (!qrResponse.ok) {
        // Se não conseguir conectar, tentar reiniciar a instância
        const restartResponse = await fetch(`${evolutionUrl}/instance/restart/${instanceId}`, {
          method: 'PUT',
          headers: {
            'apikey': apiKey,
          },
        });

        if (restartResponse.ok) {
          // Aguardar um pouco e tentar novamente
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const retryQrResponse = await fetch(`${evolutionUrl}/instance/connect/${instanceId}`, {
            method: 'GET',
            headers: {
              'apikey': apiKey,
            },
          });

          if (retryQrResponse.ok) {
            const qrData = await retryQrResponse.json();
            return NextResponse.json({
              success: true,
              qrCode: qrData.base64 || qrData.qrcode,
              instanceId,
            });
          }
        }

        throw new Error('Falha ao gerar QR Code');
      }

      const qrData = await qrResponse.json();
      
      return NextResponse.json({
        success: true,
        qrCode: qrData.base64 || qrData.qrcode,
        instanceId,
      });

    } catch (evolutionError) {
      console.error('Erro ao gerar QR Code na Evolution API:', evolutionError);
      return NextResponse.json(
        { error: 'Erro ao gerar QR Code. Verifique se a instância está ativa.' },
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