import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/app/lib/auth-middleware';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  console.log('🔍 [IMPORT] Iniciando importação de leads');
  
  try {
    // Verificar autenticação usando o middleware padrão
    const user = await getUserFromRequest(request);
    
    if (!user) {
      console.log('❌ [IMPORT] Usuário não autenticado');
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    console.log('✅ [IMPORT] Usuário autenticado:', user.name);

    // Buscar atendente para associar automaticamente baseado na hierarquia
    let defaultAttendantId = null;
    
    if (user.userType === 'MANAGER') {
      // Se for gerente, buscar o primeiro atendente ativo da sua equipe
      const teamAttendant = await prisma.attendant.findFirst({
        where: {
          managerId: user.id,
          isActive: true
        },
        select: { id: true, name: true }
      });
      
      if (teamAttendant) {
        defaultAttendantId = teamAttendant.id;
        console.log('👥 [IMPORT] Atendente padrão encontrado (gerente):', teamAttendant.name);
      }
    } else if (user.userType === 'ADMIN' && !user.isSuperAdmin) {
      // Se for admin (não super), buscar atendente da sua hierarquia
      const teamAttendant = await prisma.attendant.findFirst({
        where: {
          OR: [
            { adminId: user.id }, // Atendentes diretamente associados ao admin
            { 
              manager: {
                adminId: user.id // Atendentes de gerentes deste admin
              }
            }
          ],
          isActive: true
        },
        select: { id: true, name: true }
      });
      
      if (teamAttendant) {
        defaultAttendantId = teamAttendant.id;
        console.log('👥 [IMPORT] Atendente padrão encontrado (admin):', teamAttendant.name);
      }
    }
    
    if (!defaultAttendantId) {
      console.log('⚠️ [IMPORT] Nenhum atendente encontrado para associação automática');
    }

    // Processar FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    console.log('📁 [IMPORT] Arquivo recebido:', file.name, file.size);

    // Verificar se é um arquivo Excel (por extensão e MIME type)
    const isExcelByName = file.name.match(/\.(xlsx|xls)$/i);
    const isExcelByType = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                         file.type === 'application/vnd.ms-excel' ||
                         file.type === 'application/octet-stream'; // Alguns browsers enviam como octet-stream
    
    if (!isExcelByName && !isExcelByType) {
      console.log('❌ [IMPORT] Arquivo rejeitado - Nome:', file.name, 'Tipo:', file.type);
      return NextResponse.json({ error: 'Formato de arquivo inválido. Use .xlsx ou .xls' }, { status: 400 });
    }
    
    console.log('✅ [IMPORT] Arquivo Excel válido - Nome:', file.name, 'Tipo:', file.type);

    // Ler arquivo Excel
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log('📊 [IMPORT] Dados extraídos:', data.length, 'linhas');

    if (data.length === 0) {
      return NextResponse.json({ error: 'Arquivo Excel vazio' }, { status: 400 });
    }

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

    // Processar cada linha do Excel
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
        
        // Campos empresariais completos
        const dataInicioAtividade = row['Data de início da atividade'] || row['data_inicio_atividade'];
        const situacaoCadastral = row['Situação cadastral'] || row['situacao_cadastral'];
        const ultimaAtualizacao = row['Última atualização'] || row['ultima_atualizacao'];
        const matrizFilial = row['Matriz ou filial'] || row['matriz_filial'];
        const capitalSocial = row['Capital Social (R$)'] || row['capital_social'];
        const faixaFaturamento = row['Faixa de Faturamento'] || row['faixa_faturamento'];
        const numeroFiliais = row['Número de filiais'] || row['numero_filiais'];
        const naturezaJuridica = row['Natureza Jurídica'] || row['natureza_juridica'];
        const porte = row['Porte'] || row['porte'];
        const regimeTributario = row['Regime Tributário'] || row['regime_tributario'];
        const optanteSimples = row['Optante pelo Simples'] || row['optante_simples'];
        const dataOpcaoSimples = row['Data da opção pelo Simples'] || row['data_opcao_simples'];
        const dataExclusaoSimples = row['Data de exclusão do Simples'] || row['data_exclusao_simples'];
        const optanteMEI = row['Optante pelo MEI'] || row['optante_mei'];
        const qualificacaoResponsavel = row['Qualificação do Responsável'] || row['qualificacao_responsavel'];
        const situacaoEspecial = row['Situação especial'] || row['situacao_especial'];
        const dataSituacaoEspecial = row['Data da situação especial'] || row['data_situacao_especial'];
        const cnaeFiscal = row['CNAE fiscal'] || row['cnae_fiscal'];
        const cnaesSecundarios = row['CNAEs secundários'] || row['cnaes_secundarios'];
        const socios = row['Socios'] || row['socios'];

        // Validação mais flexível: aceitar se tiver pelo menos um identificador
        // Para empresas: CNPJ, razão social, nome fantasia, telefone ou email
        // Para pessoas: nome, CPF, telefone ou email
        const hasValidIdentifier = name || phone || email || cpf || cnpj || razaoSocial || nomeFantasia;
        
        if (!hasValidIdentifier) {
          console.log('⚠️ [IMPORT] Linha ignorada - sem identificador válido:', { name, phone, email, cpf, cnpj, razaoSocial, nomeFantasia });
          skippedCount++;
          continue;
        }

        // Verificar se o lead já existe - só verificar campos que não estão vazios
        let existingLead = null;
        const whereConditions = [];
        
        // Adicionar condições apenas para campos preenchidos
        if (phone && phone.trim()) whereConditions.push({ phone: phone.trim() });
        if (email && email.trim()) whereConditions.push({ email: email.trim() });
        if (cpf && cpf.trim()) whereConditions.push({ cpf: cpf.trim() });
        if (cnpj && cnpj.trim()) whereConditions.push({ cnpj: cnpj.trim() });
        
        if (whereConditions.length > 0) {
          existingLead = await prisma.lead.findFirst({
             where: {
               OR: whereConditions,
               deletedAt: null,
               tenantId: user.tenantId // Buscar apenas leads do mesmo tenant
             },
             include: {
               creator: {
                 select: {
                   id: true,
                   userType: true,
                   adminId: true
                 }
               }
             }
           });
        }
        
        console.log('🔍 [IMPORT] Verificando duplicata para:', { name, phone, email, existingLead: !!existingLead });
        if (existingLead) {
          console.log('📋 [IMPORT] Lead existente encontrado:', {
             id: existingLead.id,
             name: existingLead.name,
             phone: existingLead.phone,
             email: existingLead.email,
             createdBy: existingLead.creator?.id,
             userType: existingLead.creator?.userType,
             adminId: existingLead.creator?.adminId
           });
          console.log('👤 [IMPORT] Usuário atual:', {
            id: user.id,
            userType: user.userType,
            adminId: user.adminId
          });
        }

        if (existingLead) {
          // Como agora filtramos por tenantId, qualquer lead encontrado é do mesmo tenant
          // Portanto, deve ser considerado duplicata e ignorado
          console.log('⚠️ [IMPORT] Lead duplicado ignorado (mesmo tenant):', name || phone || email);
          skippedCount++;
          continue;
        }

        // Criar novo lead
        // Definir nome apropriado baseado nos dados disponíveis
        const leadName = name || razaoSocial || nomeFantasia || email || phone || 'Lead Importado';
        
        await prisma.lead.create({
          data: {
            name: leadName,
            phone: phone || null,
            email: email || null,
            columnId: firstColumn.id,
            createdBy: user.id,
            attendantId: defaultAttendantId, // Associar automaticamente ao atendente
            tenantId: user.tenantId, // Associar ao tenant do usuário
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
            // Campos empresariais completos
            dataInicioAtividade: dataInicioAtividade ? new Date(dataInicioAtividade) : null,
            situacaoCadastral: situacaoCadastral || null,
            ultimaAtualizacao: ultimaAtualizacao ? new Date(ultimaAtualizacao) : null,
            matrizFilial: matrizFilial || null,
            capitalSocial: capitalSocial ? parseFloat(capitalSocial.toString().replace(/[^0-9.,]/g, '').replace(',', '.')) : null,
            faixaFaturamento: faixaFaturamento || null,
            numeroFiliais: numeroFiliais ? parseInt(numeroFiliais.toString()) : null,
            naturezaJuridica: naturezaJuridica || null,
            porte: porte || null,
            regimeTributario: regimeTributario || null,
            optanteSimples: optanteSimples || null,
            dataOpcaoSimples: dataOpcaoSimples ? new Date(dataOpcaoSimples) : null,
            dataExclusaoSimples: dataExclusaoSimples ? new Date(dataExclusaoSimples) : null,
            optanteMEI: optanteMEI || null,
            qualificacaoResponsavel: qualificacaoResponsavel || null,
            situacaoEspecial: situacaoEspecial || null,
            dataSituacaoEspecial: dataSituacaoEspecial ? new Date(dataSituacaoEspecial) : null,
            cnaeFiscal: cnaeFiscal || null,
            cnaesSecundarios: cnaesSecundarios || null,
            socios: socios || null,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });

        importedCount++;
      } catch (rowError) {
        console.error('❌ [IMPORT] Erro ao processar linha:', rowError);
        skippedCount++;
      }
    }

    console.log('✅ [IMPORT] Importação concluída:', importedCount, 'importados,', skippedCount, 'ignorados');

    return NextResponse.json({
      success: true,
      message: `Importação concluída com sucesso!`,
      imported: importedCount,
      skipped: skippedCount,
      total: data.length
    });

  } catch (error) {
    console.error('❌ [IMPORT] Erro geral:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}