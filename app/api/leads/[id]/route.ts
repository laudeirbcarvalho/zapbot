import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET - Buscar um lead específico
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    const lead = await prisma.lead.findUnique({
      where: {
        id: id,
      },
    });
    
    if (!lead) {
      return NextResponse.json(
        { error: "Lead não encontrado" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(lead);
  } catch (error) {
    console.error("Erro ao buscar lead:", error);
    return NextResponse.json(
      { error: "Erro ao buscar lead" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar um lead
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();
    
    const { name, email, phone, source, status, columnId, notes, position } = body;
    
    const lead = await prisma.lead.update({
      where: {
        id: id,
      },
      data: {
        name,
        email,
        phone,
        source,
        status,
        columnId,
        notes,
        position,
      },
    });
    
    return NextResponse.json(lead);
  } catch (error) {
    console.error("Erro ao atualizar lead:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar lead" },
      { status: 500 }
    );
  }
}

// DELETE - Excluir um lead
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    await prisma.lead.delete({
      where: {
        id: id,
      },
    });
    
    return NextResponse.json({ message: "Lead excluído com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir lead:", error);
    return NextResponse.json(
      { error: "Erro ao excluir lead" },
      { status: 500 }
    );
  }
}