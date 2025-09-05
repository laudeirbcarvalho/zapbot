import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Gerenciar instâncias e QR codes do Evolution API
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const instanceName = searchParams.get('instance_name');
    const evolutionUrl = process.env.EVOLUTION_API_URL;
    const evolutionKey = process.env.EVOLUTION_API_KEY;

    if (!evolutionUrl || !evolutionKey) {
      return NextResponse.json(
        { error: 'Configurações do Evolution API não encontradas' },
        { status: 500 }
      );
    }

    if (action === 'test-connection') {
      // Testa conexão com Evolution API
      try {
        const response = await fetch(`${evolutionUrl}/manager/fetchInstances`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evolutionKey
          }
        });

        if (response.ok) {
          return NextResponse.json({ 
            success: true, 
            message: 'Conexão com Evolution API estabelecida com sucesso!' 
          });
        } else {
          return NextResponse.json({ 
            success: false, 
            message: 'Erro ao conectar com Evolution API' 
          }, { status: 400 });
        }
      } catch (error) {
        return NextResponse.json({ 
          success: false, 
          message: 'Erro de conexão com Evolution API' 
        }, { status: 400 });
      }
    }

    if (action === 'list-instances') {
      // Lista todas as instâncias
      try {
        const response = await fetch(`${evolutionUrl}/manager/fetchInstances`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evolutionKey
          }
        });

        if (response.ok) {
          const instances = await response.json();
          return NextResponse.json({
            success: true,
            instances
          });
        } else {
          return NextResponse.json(
            { error: 'Erro ao listar instâncias' },
            { status: 400 }
          );
        }
      } catch (error) {
        return NextResponse.json(
          { error: 'Erro de conexão ao listar instâncias' },
          { status: 500 }
        );
      }
    }

    if (action === 'get-qrcode' && instanceName) {
      // Obtém QR code de uma instância específica
      try {
        const response = await fetch(`${evolutionUrl}/instance/connect/${instanceName}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evolutionKey
          }
        });

        if (response.ok) {
          const data = await response.json();
          return NextResponse.json({
            success: true,
            qrcode: data.base64 || data.qrcode,
            instanceName
          });
        } else {
          return NextResponse.json(
            { error: 'Erro ao obter QR code' },
            { status: 400 }
          );
        }
      } catch (error) {
        return NextResponse.json(
          { error: 'Erro de conexão ao obter QR code' },
          { status: 500 }
        );
      }
    }

    if (action === 'instance-status' && instanceName) {
      // Verifica status de uma instância
      try {
        const response = await fetch(`${evolutionUrl}/instance/connectionState/${instanceName}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evolutionKey
          }
        });

        if (response.ok) {
          const status = await response.json();
          return NextResponse.json({
            success: true,
            status,
            instanceName
          });
        } else {
          return NextResponse.json(
            { error: 'Erro ao verificar status da instância' },
            { status: 400 }
          );
        }
      } catch (error) {
        return NextResponse.json(
          { error: 'Erro de conexão ao verificar status' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Ação não especificada ou parâmetros ausentes' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Erro na API Evolution:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar nova instância e salvar integração
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { instanceName, name } = body;
    const evolutionUrl = process.env.EVOLUTION_API_URL;
    const evolutionKey = process.env.EVOLUTION_API_KEY;

    if (!instanceName) {
      return NextResponse.json(
        { error: 'Nome da instância é obrigatório' },
        { status: 400 }
      );
    }

    if (!evolutionUrl || !evolutionKey) {
      return NextResponse.json(
        { error: 'Configurações do Evolution API não encontradas' },
        { status: 500 }
      );
    }

    // Cria nova instância no Evolution API
    try {
      const response = await fetch(`${evolutionUrl}/instance/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionKey
        },
        body: JSON.stringify({
          instanceName,
          token: evolutionKey,
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS'
        })
      });

      if (response.ok) {
        const instanceData = await response.json();

        // Salva integração no banco
        const integration = await prisma.integration.create({
          data: {
            name: name || `Evolution API - ${instanceName}`,
            type: 'evolution-api',
            config: JSON.stringify({
              instanceName,
              evolutionUrl,
              apiKey: evolutionKey,
              createdAt: new Date().toISOString(),
              instanceData
            })
          }
        });

        return NextResponse.json({
          success: true,
          integration,
          instanceData,
          message: 'Instância Evolution API criada com sucesso!'
        });
      } else {
        const errorData = await response.json();
        return NextResponse.json(
          { error: `Erro ao criar instância: ${errorData.message || 'Erro desconhecido'}` },
          { status: 400 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Erro de conexão ao criar instância' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erro ao processar criação de instância Evolution:', error);
    return NextResponse.json(
      { error: 'Erro ao processar criação de instância' },
      { status: 500 }
    );
  }
}

// DELETE - Deletar instância
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const instanceName = searchParams.get('instance_name');
    const evolutionUrl = process.env.EVOLUTION_API_URL;
    const evolutionKey = process.env.EVOLUTION_API_KEY;

    if (!instanceName) {
      return NextResponse.json(
        { error: 'Nome da instância é obrigatório' },
        { status: 400 }
      );
    }

    if (!evolutionUrl || !evolutionKey) {
      return NextResponse.json(
        { error: 'Configurações do Evolution API não encontradas' },
        { status: 500 }
      );
    }

    // Deleta instância no Evolution API
    try {
      const response = await fetch(`${evolutionUrl}/instance/delete/${instanceName}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionKey
        }
      });

      if (response.ok) {
        return NextResponse.json({
          success: true,
          message: 'Instância deletada com sucesso!'
        });
      } else {
        return NextResponse.json(
          { error: 'Erro ao deletar instância' },
          { status: 400 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Erro de conexão ao deletar instância' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erro ao deletar instância Evolution:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar instância' },
      { status: 500 }
    );
  }
}