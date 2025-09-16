import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Listar todas as integrações
export async function GET() {
  try {
    const integrations = await prisma.integration.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    return NextResponse.json(integrations);
  } catch (error) {
    console.error("Erro ao buscar integrações:", error);
    return NextResponse.json(
      { error: "Erro ao buscar integrações" },
      { status: 500 }
    );
  }
}

// POST - Criar uma nova integração
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const { name, type, config } = body;
    
    if (!name || !type) {
      return NextResponse.json(
        { error: "Nome e tipo são obrigatórios" },
        { status: 400 }
      );
    }
    
    const integration = await prisma.integration.create({
      data: {
        name,
        type,
        config: config || "{}",
      },
    });
    
    return NextResponse.json(integration, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar integração:", error);
    return NextResponse.json(
      { error: "Erro ao criar integração" },
      { status: 500 }
    );
  }
}