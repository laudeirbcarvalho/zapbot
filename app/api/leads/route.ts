import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Listar todos os leads
export async function GET() {
  try {
    const leads = await prisma.lead.findMany({
      orderBy: [
        { columnId: 'asc' },
        { position: 'asc' },
        { createdAt: 'desc' }
      ],
    });
    
    return NextResponse.json(leads);
  } catch (error) {
    console.error("Erro ao buscar leads:", error);
    return NextResponse.json(
      { error: "Erro ao buscar leads" },
      { status: 500 }
    );
  }
}

// POST - Criar um novo lead
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const { name, email, phone, source, status, columnId, notes, position } = body;
    
    if (!name) {
      return NextResponse.json(
        { error: "Nome é obrigatório" },
        { status: 400 }
      );
    }
    
    // Calcular posição se não fornecida
    let leadPosition = position;
    if (leadPosition === undefined && columnId) {
      const existingLeads = await prisma.lead.count({
        where: { columnId }
      });
      leadPosition = existingLeads;
    }
    
    const lead = await prisma.lead.create({
      data: {
        name,
        email: email || "",
        phone: phone || "",
        source: source || "Site",
        status: status || "novo",
        columnId: columnId || null,
        notes: notes || "",
        position: leadPosition || 0,
      },
    });
    
    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar lead:", error);
    return NextResponse.json(
      { error: "Erro ao criar lead" },
      { status: 500 }
    );
  }
}