import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { getUserFromRequest } from '@/app/lib/auth-middleware';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Tipo de arquivo não permitido. Use JPG, PNG ou GIF.' 
      }, { status: 400 });
    }

    // Validar tamanho (máx. 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ 
        error: 'Arquivo muito grande. Máximo 5MB.' 
      }, { status: 400 });
    }

    // Criar diretório se não existir
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'attendants');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const filename = `attendant_${timestamp}.${extension}`;
    const filepath = join(uploadDir, filename);

    // Salvar arquivo
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Retornar URL do arquivo
    const fileUrl = `/uploads/attendants/${filename}`;
    
    console.log(`✅ [Upload] Foto de atendente salva: ${fileUrl}`);
    
    return NextResponse.json({ 
      url: fileUrl,
      message: 'Foto enviada com sucesso' 
    });

  } catch (error) {
    console.error('❌ [Upload] Erro ao fazer upload da foto:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}