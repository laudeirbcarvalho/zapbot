import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticação
    const token = request.cookies.get("attendant-token")?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: "Token de acesso não encontrado" },
        { status: 401 }
      );
    }

    let attendantId: string;
    try {
      const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || "fallback-secret") as any;
      attendantId = decoded.id;
    } catch (error) {
      return NextResponse.json(
        { error: "Token inválido" },
        { status: 401 }
      );
    }

    // Verificar se o atendente existe
    const attendant = await prisma.attendant.findFirst({
      where: {
        id: attendantId
      }
    });

    if (!attendant) {
      return NextResponse.json(
        { error: "Atendente não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se é FormData (com foto) ou JSON
    const contentType = request.headers.get("content-type");
    let name, phone, whatsapp, currentPassword, newPassword, photoFile;
    
    if (contentType?.includes("multipart/form-data")) {
      // Processar FormData
      const formData = await request.formData();
      name = formData.get("name") as string;
      phone = formData.get("phone") as string;
      whatsapp = formData.get("whatsapp") as string;
      currentPassword = formData.get("currentPassword") as string;
      newPassword = formData.get("password") as string;
      photoFile = formData.get("photo") as File;
    } else {
      // Processar JSON
      const body = await request.json();
      ({ name, phone, whatsapp, currentPassword, newPassword } = body);
    }

    // Usar valores atuais se não fornecidos
    const finalName = name?.trim() || attendant.name;
    const finalPhone = phone?.trim() || attendant.phone;
    const finalWhatsapp = whatsapp?.trim() || attendant.whatsapp;

    if (newPassword && newPassword.length < 6) {
      return NextResponse.json(
        { error: "A senha deve ter pelo menos 6 caracteres" },
        { status: 400 }
      );
    }

    // Dados para atualização
    const updateData: any = {
      name: finalName,
      phone: finalPhone,
      whatsapp: finalWhatsapp
    };

    // Se uma nova senha foi fornecida, criptografá-la
    if (newPassword) {
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(newPassword, saltRounds);
    }

    // Se há uma foto para upload, processá-la
    if (photoFile && photoFile.size > 0) {
      try {
        // Criar diretório de uploads se não existir
        const uploadsDir = path.join(process.cwd(), "public", "uploads", "attendants");
        await mkdir(uploadsDir, { recursive: true });

        // Gerar nome único para o arquivo
        const fileExtension = path.extname(photoFile.name);
        const fileName = `${uuidv4()}${fileExtension}`;
        const filePath = path.join(uploadsDir, fileName);

        // Converter File para Buffer e salvar
        const bytes = await photoFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filePath, buffer);

        // Salvar URL da foto no banco
        updateData.photoUrl = `/uploads/attendants/${fileName}`;
      } catch (error) {
        console.error("Erro ao fazer upload da foto:", error);
        return NextResponse.json(
          { error: "Erro ao fazer upload da foto" },
          { status: 500 }
        );
      }
    }

    // Atualizar o atendente no banco de dados
    const updatedAttendant = await prisma.attendant.update({
      where: { id: attendantId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        whatsapp: true,
        photoUrl: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json(updatedAttendant);

  } catch (error) {
    console.error("Erro ao atualizar perfil do atendente:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const token = request.cookies.get("attendant-token")?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: "Token de acesso não encontrado" },
        { status: 401 }
      );
    }

    let attendantId: string;
    try {
      const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || "fallback-secret") as any;
      attendantId = decoded.id;
    } catch (error) {
      return NextResponse.json(
        { error: "Token inválido" },
        { status: 401 }
      );
    }

    // Buscar dados do atendente
    const attendant = await prisma.attendant.findFirst({
      where: {
        id: attendantId
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        whatsapp: true,
        photoUrl: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!attendant) {
      return NextResponse.json(
        { error: "Atendente não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(attendant);

  } catch (error) {
    console.error("Erro ao buscar perfil do atendente:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}