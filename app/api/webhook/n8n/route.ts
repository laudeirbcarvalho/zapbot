import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Verificar se os dados necessários estão presentes
    if (!data.name) {
      return NextResponse.json(
        { error: "Dados incompletos. Nome é obrigatório." },
        { status: 400 }
      );
    }

    // Encontrar a primeira coluna para adicionar o lead
    const firstColumn = await prisma.column.findFirst({
      orderBy: {
        position: "asc",
      },
    });

    // Se não existir nenhuma coluna, criar uma
    let columnId: string;
    if (!firstColumn) {
      const newColumn = await prisma.column.create({
        data: {
          title: "Novos Leads",
          position: 0,
        },
      });
      columnId = newColumn.id;
    } else {
      columnId = firstColumn.id;
    }

    // Contar leads na coluna para determinar a posição
    const leadsCount = await prisma.lead.count({
      where: {
        columnId,
      },
    });

    // Criar o lead
    const lead = await prisma.lead.create({
      data: {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        source: data.source || "n8n",
        notes: data.notes || null,
        columnId,
        position: leadsCount,
      },
    });

    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error("Erro ao processar webhook:", error);
    return NextResponse.json(
      { error: "Erro ao processar a requisição" },
      { status: 500 }
    );
  }
}