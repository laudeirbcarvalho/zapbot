import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/app/lib/auth-utils';
import prisma from '@/lib/prisma';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    console.log('🔄 [IMPORT-CONFIRM] Usuário autenticado:', user.name, user.userType);

    // Determinar atendente padrão baseado na hierarquia
    let defaultAttendantId = null;
    
    if (user.userType === 'MANAGER') {
      const managerAttendant = await prisma.attendant.findFirst({
        where: {
          managerId: user.id,
          isActive: true
        },
        select: { id: true, name: true }
      });
      
      if (managerAttendant) {
        defaultAttendantId = managerAttendant.id;
        console.log('👥 [IMPORT-CONFIRM] Atendente padrão encontrado (manager):', managerAttendant.name);
      }
    } else if (user.userType === 'ADMIN') {
      const teamAttendant = await prisma.attendant.findFirst({
        where: {
          OR: [
            { adminId: user.id },
            { 
              manager: {
                adminId: user.id
              }
            }
          ],
          isActive: true
        },
        select: { id: true, name: true }
      });
      
      if (teamAttendant) {
        defaultAttendantId = teamAttendant.id;
        console.log('👥 [IMPORT-CONFIRM] Atendente padrão encontrado (admin):', teamAttendant.name);
      }
    }

    // Processar FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const forceImport = formData.get('forceImport') === 'true';
    
    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    if (!forceImport) {
      return NextResponse.json({ error: 'Confirmação de importação necessária' }, { status: 400 });
    }

    console.log('📁 [IMPORT-CONFIRM] Arquivo recebido para importação forçada:', file.name);

    // Ler arquivo Excel
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    // Buscar colunas existentes
    const columns = await prisma.column.findMany({
      where: { deletedAt: null },
      orderBy: { position: 'asc' }
    });

    if (columns.length === 0) {
      return NextResponse.json({ error: 'Nenhuma coluna encontrada no sistema' }, { status: 400 });
    }

    const firstColumn = columns[0];
    let importedCount = 0;
    let skippedCount = 0;

    // Processar cada linha do Excel (forçando importação)
    for (const row of data as any[]) {
      try {
        // Campos básicos
        const name = row['Nome'] || row['nome'] || row['Name'] || row['name'];
        const phone = row['Telefone'] || row['telefone'] || row['Phone'] || row['phone'];
        const email = row['Email'] || row['email'] || row['E-mail'] || row['e-mail'];
        const source = row['Origem'] || row['origem'] || row['Source'] || row['source'] || 'Excel Import';
        
        // Novos campos - Pessoa Física
        const cpf = row['CPF'] || row['cpf'];
        const nomeCompleto = row['Nome Completo'] || row['nome_completo'] || row['nomeCompleto'];
        
        // Novos campos - Pessoa Jurídica
        const cnpj = row['CNPJ'] || row['cnpj'];
        const razaoSocial = row['Razão Social'] || row['razao_social'] || row['razaoSocial'];
        const nomeFantasia = row['Nome Fantasia'] || row['nome_fantasia'] || row['nomeFantasia'];
        
        // Determinar tipo de pessoa
        const tipoPessoa = cnpj ? 'JURIDICA' : (cpf ? 'FISICA' : 'FISICA');
        
        // Campos de endereço
        const tipoEndereco = row['Tipo de Endereço'] || row['tipo_endereco'] || row['tipoEndereco'] || 'COMERCIAL';
        const logradouro = row['Logradouro'] || row['logradouro'];
        const numero = row['Número'] || row['numero'] || row['number'];
        const complemento = row['Complemento'] || row['complemento'];
        const bairro = row['Bairro'] || row['bairro'];
        const cep = row['CEP'] || row['cep'];
        const municipio = row['Município'] || row['municipio'] || row['cidade'];
        const uf = row['UF'] || row['uf'] || row['estado'];
        const nomeCidadeExterior = row['Nome da Cidade no Exterior'] || row['cidade_exterior'];
        const codigoPais = row['Código do País'] || row['codigo_pais'];
        
        // Campos de contato adicionais
        const telefones = row['Telefones'] || row['telefones'];
        const emails = row['E-mails'] || row['emails'];
        const websites = row['Websites'] || row['websites'];
        
        // Campos empresariais
        const dataInicioAtividade = row['Data de Início da Atividade'] || row['data_inicio_atividade'];
        const situacaoCadastral = row['Situação Cadastral'] || row['situacao_cadastral'];
        const ultimaAtualizacao = row['Última Atualização'] || row['ultima_atualizacao'];
        const matrizFilial = row['Matriz ou Filial'] || row['matriz_filial'];
        const capitalSocial = row['Capital Social (R$)'] || row['capital_social'];
        const faixaFaturamento = row['Faixa de Faturamento'] || row['faixa_faturamento'];

        if (!name && !phone && !email && !cpf && !cnpj) {
          skippedCount++;
          continue;
        }

        // Criar novo lead (mesmo se duplicado)
        await prisma.lead.create({
          data: {
            name: name || 'Lead Importado',
            phone: phone || null,
            email: email || null,
            columnId: firstColumn.id,
            createdBy: user.id,
            attendantId: defaultAttendantId,
            source: source,
            // Novos campos - Tipo de pessoa
            tipoPessoa: tipoPessoa,
            // Campos pessoa física
            cpf: cpf || null,
            nomeCompleto: nomeCompleto || null,
            // Campos pessoa jurídica
            cnpj: cnpj || null,
            razaoSocial: razaoSocial || null,
            nomeFantasia: nomeFantasia || null,
            // Campos de endereço
            tipoEndereco: tipoEndereco || null,
            logradouro: logradouro || null,
            numero: numero || null,
            complemento: complemento || null,
            bairro: bairro || null,
            cep: cep || null,
            municipio: municipio || null,
            uf: uf || null,
            nomeCidadeExterior: nomeCidadeExterior || null,
            codigoPais: codigoPais || null,
            // Campos de contato adicionais
            telefones: telefones || null,
            emails: emails || null,
            websites: websites || null,
            // Campos empresariais
            dataInicioAtividade: dataInicioAtividade ? new Date(dataInicioAtividade) : null,
            situacaoCadastral: situacaoCadastral || null,
            ultimaAtualizacao: ultimaAtualizacao ? new Date(ultimaAtualizacao) : null,
            matrizFilial: matrizFilial || null,
            capitalSocial: capitalSocial ? parseFloat(capitalSocial.toString().replace(/[^0-9.,]/g, '').replace(',', '.')) : null,
            faixaFaturamento: faixaFaturamento || null,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });

        importedCount++;
      } catch (rowError) {
        console.error('❌ [IMPORT-CONFIRM] Erro ao processar linha:', rowError);
        skippedCount++;
      }
    }

    console.log('✅ [IMPORT-CONFIRM] Importação forçada concluída:', importedCount, 'importados,', skippedCount, 'ignorados');

    return NextResponse.json({
      success: true,
      message: `Importação forçada concluída com sucesso!`,
      imported: importedCount,
      skipped: skippedCount,
      total: data.length
    });

  } catch (error) {
    console.error('❌ [IMPORT-CONFIRM] Erro geral:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}