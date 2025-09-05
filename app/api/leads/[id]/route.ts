import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    
    console.log(`🔄 API: Recebendo requisição PUT para lead ${id}`);
    console.log(`📋 API: Dados recebidos:`, JSON.stringify(body, null, 2));
    
    const { name, email, phone, source, status, columnId, notes, position } = body;
    
    // Buscar estado atual antes da atualização
    const currentLead = await prisma.lead.findUnique({ where: { id } });
    console.log(`📋 API: Estado ANTES da atualização:`, {
      id: currentLead?.id,
      columnId: currentLead?.columnId,
      status: currentLead?.status,
      position: currentLead?.position
    });
    
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
        updatedAt: new Date() // Forçar atualização do timestamp
      },
    });
    
    console.log(`✅ API: Lead ${id} atualizado com sucesso!`);
    console.log(`📋 API: Estado DEPOIS da atualização:`, {
      id: lead.id,
      columnId: lead.columnId,
      status: lead.status,
      position: lead.position,
      updatedAt: lead.updatedAt
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