import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Buscar uma integração específica
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    const integration = await prisma.integration.findUnique({
      where: {
        id: id,
      },
    });
    
    if (!integration) {
      return NextResponse.json(
        { error: "Integração não encontrada" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(integration);
  } catch (error) {
    console.error("Erro ao buscar integração:", error);
    return NextResponse.json(
      { error: "Erro ao buscar integração" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar uma integração
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();
    
    const { name, type, config } = body;
    
    const integration = await prisma.integration.update({
      where: {
        id: id,
      },
      data: {
        name,
        type,
        config,
      },
    });
    
    return NextResponse.json(integration);
  } catch (error) {
    console.error("Erro ao atualizar integração:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar integração" },
      { status: 500 }
    );
  }
}

// DELETE - Excluir uma integração
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    await prisma.integration.delete({
      where: {
        id: id,
      },
    });
    
    return NextResponse.json({ message: "Integração excluída com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir integração:", error);
    return NextResponse.json(
      { error: "Erro ao excluir integração" },
      { status: 500 }
    );
  }
}