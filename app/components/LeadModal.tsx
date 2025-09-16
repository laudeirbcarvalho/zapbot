'use client';

import { useState, useEffect } from 'react';

interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  source?: string;
  status: string;
  notes?: string;
  columnId?: string;
  position: number;
  createdAt: string;
  updatedAt: string;
  attendantId?: string;
  attendant?: {
    id: string;
    name: string;
    email: string;
  };
  // Campos para Pessoa Física
  cpf?: string;
  nomeCompleto?: string;
  // Campos para Pessoa Jurídica
  cnpj?: string;
  razaoSocial?: string;
  nomeFantasia?: string;
  // Campos de Endereço
  tipoEndereco?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cep?: string;
  municipio?: string;
  uf?: string;
  nomeCidadeExterior?: string;
  codigoPais?: string;
  // Campos de Contato
  telefones?: string;
  emails?: string;
  websites?: string;
  // Campos Empresariais
  dataInicioAtividade?: string;
  situacaoCadastral?: string;
  ultimaAtualizacao?: string;
  matrizFilial?: string;
  capitalSocial?: number;
  faixaFaturamento?: string;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  source: string;
  notes: string;
  attendantName: string;
  attendantId: string;
  // Tipo de pessoa
  tipoPessoa: 'fisica' | 'juridica';
  // Campos para Pessoa Física
  cpf: string;
  nomeCompleto: string;
  // Campos para Pessoa Jurídica
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  // Campos de Endereço
  tipoEndereco: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cep: string;
  municipio: string;
  uf: string;
  nomeCidadeExterior: string;
  codigoPais: string;
  // Campos de Contato
  telefones: string;
  emails: string;
  websites: string;
  // Campos Empresariais
  dataInicioAtividade: string;
  situacaoCadastral: string;
  ultimaAtualizacao: string;
  matrizFilial: string;
  capitalSocial: string;
  faixaFaturamento: string;
}

interface Attendant {
  id: string;
  name: string;
  email: string;
  position?: {
    id: string;
    name: string;
  };
  department?: {
    id: string;
    name: string;
  };
  isActive: boolean;
}

interface LeadModalProps {
  lead?: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (lead: Partial<Lead>) => void;
  columnId?: string;
  columnTitle?: string;
}

export function LeadModal({ lead, isOpen, onClose, onSave, columnId, columnTitle }: LeadModalProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    source: '',
    notes: '',
    attendantName: '',
    attendantId: '',
    tipoPessoa: 'fisica',
    // Campos para Pessoa Física
    cpf: '',
    nomeCompleto: '',
    // Campos para Pessoa Jurídica
    cnpj: '',
    razaoSocial: '',
    nomeFantasia: '',
    // Campos de Endereço
    tipoEndereco: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cep: '',
    municipio: '',
    uf: '',
    nomeCidadeExterior: '',
    codigoPais: '',
    // Campos de Contato
    telefones: '',
    emails: '',
    websites: '',
    // Campos Empresariais
    dataInicioAtividade: '',
    situacaoCadastral: '',
    ultimaAtualizacao: '',
    matrizFilial: '',
    capitalSocial: '',
    faixaFaturamento: ''
  });
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentAttendant, setCurrentAttendant] = useState<any>(null);
  const [attendants, setAttendants] = useState<Attendant[]>([]);

  // Buscar dados do usuário logado
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setCurrentUser(user);
        
        // Buscar atendente correspondente ao usuário logado
        fetchCurrentAttendant(user.email);
      } catch (error) {
        console.error('Erro ao parsear dados do usuário:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchAttendants();
    }
  }, [isOpen]);

  const fetchCurrentAttendant = async (userEmail: string) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch('/api/attendants', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const attendants = await response.json();
        const attendant = attendants.find((att: any) => att.email === userEmail);
        if (attendant) {
          setCurrentAttendant(attendant);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar atendente:', error);
    }
  };

  const fetchAttendants = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('Token de autenticação não encontrado');
        return;
      }
      
      const response = await fetch('/api/attendants', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const attendantsData = await response.json();
        setAttendants(attendantsData.filter((att: Attendant) => att.isActive));
      }
    } catch (error) {
      console.error('Erro ao buscar atendentes:', error);
    }
  };

  useEffect(() => {
    if (lead) {
      setFormData({
        name: lead.name || '',
        email: lead.email || '',
        phone: lead.phone || '',
        source: lead.source || '',
        notes: lead.notes || '',
        attendantName: lead.attendant?.name || '',
        attendantId: lead.attendantId || '',
        tipoPessoa: (lead.cnpj ? 'juridica' : 'fisica') as 'fisica' | 'juridica',
        // Campos para Pessoa Física
        cpf: lead.cpf || '',
        nomeCompleto: lead.nomeCompleto || '',
        // Campos para Pessoa Jurídica
        cnpj: lead.cnpj || '',
        razaoSocial: lead.razaoSocial || '',
        nomeFantasia: lead.nomeFantasia || '',
        // Campos de Endereço
        tipoEndereco: lead.tipoEndereco || '',
        logradouro: lead.logradouro || '',
        numero: lead.numero || '',
        complemento: lead.complemento || '',
        bairro: lead.bairro || '',
        cep: lead.cep || '',
        municipio: lead.municipio || '',
        uf: lead.uf || '',
        nomeCidadeExterior: lead.nomeCidadeExterior || '',
        codigoPais: lead.codigoPais || '',
        // Campos de Contato
        telefones: lead.telefones || '',
        emails: lead.emails || '',
        websites: lead.websites || '',
        // Campos Empresariais
        dataInicioAtividade: lead.dataInicioAtividade || '',
        situacaoCadastral: lead.situacaoCadastral || '',
        ultimaAtualizacao: lead.ultimaAtualizacao || '',
        matrizFilial: lead.matrizFilial || '',
        capitalSocial: lead.capitalSocial?.toString() || '',
        faixaFaturamento: lead.faixaFaturamento || ''
      });
    } else {
      // Para novos leads, pré-preencher com o atendente atual
      setFormData({
        name: '',
        email: '',
        phone: '',
        source: '',
        notes: '',
        attendantName: currentAttendant?.name || '',
        attendantId: currentAttendant?.id || '',
        tipoPessoa: 'fisica',
        // Campos para Pessoa Física
        cpf: '',
        nomeCompleto: '',
        // Campos para Pessoa Jurídica
        cnpj: '',
        razaoSocial: '',
        nomeFantasia: '',
        // Campos de Endereço
        tipoEndereco: '',
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        cep: '',
        municipio: '',
        uf: '',
        nomeCidadeExterior: '',
        codigoPais: '',
        // Campos de Contato
        telefones: '',
        emails: '',
        websites: '',
        // Campos Empresariais
        dataInicioAtividade: '',
        situacaoCadastral: '',
        ultimaAtualizacao: '',
        matrizFilial: '',
        capitalSocial: '',
        faixaFaturamento: ''
      });
    }
  }, [lead, isOpen, currentAttendant]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação: deve ter o título da coluna para novos leads
    if (!lead && !columnTitle) {
      alert('Erro: Nome do quadro não encontrado. Não é possível criar o lead.');
      return;
    }

    // Validação de CPF para pessoa física
    if (formData.tipoPessoa === 'fisica' && formData.cpf) {
      const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/;
      if (!cpfRegex.test(formData.cpf)) {
        alert('CPF inválido. Use o formato 000.000.000-00 ou apenas números.');
        return;
      }
    }

    // Validação de CNPJ para pessoa jurídica
    if (formData.tipoPessoa === 'juridica' && formData.cnpj) {
      const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/;
      if (!cnpjRegex.test(formData.cnpj)) {
        alert('CNPJ inválido. Use o formato 00.000.000/0000-00 ou apenas números.');
        return;
      }
    }

    // Validação de campos obrigatórios por tipo de pessoa
    if (formData.tipoPessoa === 'fisica' && !formData.nomeCompleto) {
      alert('Nome completo é obrigatório para pessoa física.');
      return;
    }

    if (formData.tipoPessoa === 'juridica' && !formData.razaoSocial) {
      alert('Razão social é obrigatória para pessoa jurídica.');
      return;
    }
    
    const leadData = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      source: formData.source,
      notes: formData.notes,
      attendantId: formData.attendantId,
      // Campos para Pessoa Física
      cpf: formData.tipoPessoa === 'fisica' ? formData.cpf : null,
      nomeCompleto: formData.tipoPessoa === 'fisica' ? formData.nomeCompleto : null,
      // Campos para Pessoa Jurídica
      cnpj: formData.tipoPessoa === 'juridica' ? formData.cnpj : null,
      razaoSocial: formData.tipoPessoa === 'juridica' ? formData.razaoSocial : null,
      nomeFantasia: formData.tipoPessoa === 'juridica' ? formData.nomeFantasia : null,
      // Campos de Endereço
      tipoEndereco: formData.tipoEndereco || null,
      logradouro: formData.logradouro || null,
      numero: formData.numero || null,
      complemento: formData.complemento || null,
      bairro: formData.bairro || null,
      cep: formData.cep || null,
      municipio: formData.municipio || null,
      uf: formData.uf || null,
      nomeCidadeExterior: formData.nomeCidadeExterior || null,
      codigoPais: formData.codigoPais || null,
      // Campos de Contato
      telefones: formData.telefones || null,
      emails: formData.emails || null,
      websites: formData.websites || null,
      // Campos Empresariais
      dataInicioAtividade: formData.dataInicioAtividade ? new Date(formData.dataInicioAtividade).toISOString() : null,
      situacaoCadastral: formData.situacaoCadastral || null,
      ultimaAtualizacao: formData.ultimaAtualizacao ? new Date(formData.ultimaAtualizacao).toISOString() : null,
      matrizFilial: formData.matrizFilial || null,
      capitalSocial: formData.capitalSocial ? parseFloat(formData.capitalSocial) : null,
      faixaFaturamento: formData.faixaFaturamento || null,
      ...(lead ? { id: lead.id } : {}),
      ...(columnId ? { columnId } : {})
    };
    onSave(leadData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 border border-gray-600 rounded-xl p-6 w-full max-w-4xl mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">
              {lead ? 'Editar Lead' : `Novo Lead${columnTitle ? ` - ${columnTitle}` : ''}`}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 max-h-96 overflow-y-auto">
          {/* Tipo de Pessoa */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Tipo de Pessoa *
            </label>
            <select
              value={formData.tipoPessoa}
              onChange={(e) => setFormData({ ...formData, tipoPessoa: e.target.value as 'fisica' | 'juridica' })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="fisica">Pessoa Física</option>
              <option value="juridica">Pessoa Jurídica</option>
            </select>
          </div>

          {/* Campos para Pessoa Física */}
          {formData.tipoPessoa === 'fisica' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nomeCompleto}
                  onChange={(e) => setFormData({ ...formData, nomeCompleto: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                  placeholder="Nome completo da pessoa"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  CPF
                </label>
                <input
                  type="text"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                  placeholder="000.000.000-00"
                />
              </div>
            </>
          )}

          {/* Campos para Pessoa Jurídica */}
          {formData.tipoPessoa === 'juridica' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Razão Social *
                </label>
                <input
                  type="text"
                  required
                  value={formData.razaoSocial}
                  onChange={(e) => setFormData({ ...formData, razaoSocial: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                  placeholder="Razão social da empresa"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Nome Fantasia
                </label>
                <input
                  type="text"
                  value={formData.nomeFantasia}
                  onChange={(e) => setFormData({ ...formData, nomeFantasia: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                  placeholder="Nome fantasia"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  CNPJ
                </label>
                <input
                  type="text"
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                  placeholder="00.000.000/0000-00"
                />
              </div>
            </>
          )}

          {/* Nome (campo legado) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Nome {formData.tipoPessoa === 'fisica' ? '(Apelido/Como gosta de ser chamado)' : '(Nome de contato)'}
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
              placeholder={formData.tipoPessoa === 'fisica' ? 'Como gosta de ser chamado' : 'Nome do contato na empresa'}
            />
          </div>

          {/* Seção de Contato */}
          <div className="border-t border-gray-600 pt-4">
            <h3 className="text-lg font-medium text-gray-200 mb-3">Informações de Contato</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                E-mail Principal
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                placeholder="email@exemplo.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                E-mails Adicionais
              </label>
              <textarea
                value={formData.emails}
                onChange={(e) => setFormData({ ...formData, emails: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                placeholder="Outros e-mails separados por vírgula"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Telefone Principal
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                placeholder="(11) 99999-9999"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Telefones Adicionais
              </label>
              <textarea
                value={formData.telefones}
                onChange={(e) => setFormData({ ...formData, telefones: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                placeholder="Outros telefones separados por vírgula"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Websites
              </label>
              <textarea
                value={formData.websites}
                onChange={(e) => setFormData({ ...formData, websites: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                placeholder="Sites separados por vírgula"
                rows={2}
              />
            </div>
          </div>

          {/* Seção de Endereço */}
          <div className="border-t border-gray-600 pt-4">
            <h3 className="text-lg font-medium text-gray-200 mb-3">Endereço</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Tipo de Endereço
                </label>
                <select
                  value={formData.tipoEndereco}
                  onChange={(e) => setFormData({ ...formData, tipoEndereco: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecione</option>
                  <option value="residencial">Residencial</option>
                  <option value="comercial">Comercial</option>
                  <option value="correspondencia">Correspondência</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  CEP
                </label>
                <input
                  type="text"
                  value={formData.cep}
                  onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                  placeholder="00000-000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Logradouro
              </label>
              <input
                type="text"
                value={formData.logradouro}
                onChange={(e) => setFormData({ ...formData, logradouro: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                placeholder="Rua, Avenida, etc."
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Número
                </label>
                <input
                  type="text"
                  value={formData.numero}
                  onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                  placeholder="123"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Complemento
                </label>
                <input
                  type="text"
                  value={formData.complemento}
                  onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                  placeholder="Apto, Sala, etc."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Bairro
                </label>
                <input
                  type="text"
                  value={formData.bairro}
                  onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                  placeholder="Nome do bairro"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Município
                </label>
                <input
                  type="text"
                  value={formData.municipio}
                  onChange={(e) => setFormData({ ...formData, municipio: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                  placeholder="Nome da cidade"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  UF
                </label>
                <input
                  type="text"
                  value={formData.uf}
                  onChange={(e) => setFormData({ ...formData, uf: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                  placeholder="SP"
                  maxLength={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Código do País
                </label>
                <input
                  type="text"
                  value={formData.codigoPais}
                  onChange={(e) => setFormData({ ...formData, codigoPais: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                  placeholder="BR"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Cidade no Exterior
                </label>
                <input
                  type="text"
                  value={formData.nomeCidadeExterior}
                  onChange={(e) => setFormData({ ...formData, nomeCidadeExterior: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                  placeholder="Se aplicável"
                />
              </div>
            </div>
          </div>

          {/* Seção de Informações Empresariais - apenas para Pessoa Jurídica */}
          {formData.tipoPessoa === 'juridica' && (
            <div className="border-t border-gray-600 pt-4">
              <h3 className="text-lg font-medium text-gray-200 mb-3">Informações Empresariais</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Data de Início da Atividade
                  </label>
                  <input
                    type="date"
                    value={formData.dataInicioAtividade}
                    onChange={(e) => setFormData({ ...formData, dataInicioAtividade: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Situação Cadastral
                  </label>
                  <select
                    value={formData.situacaoCadastral}
                    onChange={(e) => setFormData({ ...formData, situacaoCadastral: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecione</option>
                    <option value="ativa">Ativa</option>
                    <option value="suspensa">Suspensa</option>
                    <option value="inapta">Inapta</option>
                    <option value="baixada">Baixada</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Matriz ou Filial
                  </label>
                  <select
                    value={formData.matrizFilial}
                    onChange={(e) => setFormData({ ...formData, matrizFilial: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecione</option>
                    <option value="matriz">Matriz</option>
                    <option value="filial">Filial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Última Atualização
                  </label>
                  <input
                    type="date"
                    value={formData.ultimaAtualizacao}
                    onChange={(e) => setFormData({ ...formData, ultimaAtualizacao: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Capital Social (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.capitalSocial}
                    onChange={(e) => setFormData({ ...formData, capitalSocial: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Faixa de Faturamento
                  </label>
                  <select
                    value={formData.faixaFaturamento}
                    onChange={(e) => setFormData({ ...formData, faixaFaturamento: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecione</option>
                    <option value="mei">MEI - até R$ 81.000</option>
                    <option value="microempresa">Microempresa - até R$ 360.000</option>
                    <option value="pequena">Pequena Empresa - até R$ 4.800.000</option>
                    <option value="media">Média Empresa - até R$ 300.000.000</option>
                    <option value="grande">Grande Empresa - acima de R$ 300.000.000</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Origem
            </label>
            <select
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Selecione a origem</option>
              <option value="Website">Website</option>
              <option value="Facebook">Facebook</option>
              <option value="Instagram">Instagram</option>
              <option value="Google Ads">Google Ads</option>
              <option value="Indicação">Indicação</option>
              <option value="Telefone">Telefone</option>
              <option value="Email">Email</option>
              <option value="Outros">Outros</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Atendente *
            </label>
            <select
              value={formData.attendantId}
              onChange={(e) => {
                const selectedAttendant = attendants.find(att => att.id === e.target.value);
                setFormData({ 
                  ...formData, 
                  attendantId: e.target.value,
                  attendantName: selectedAttendant?.name || ''
                });
              }}
              required
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Selecione um atendente</option>
              {attendants.map((attendant) => (
                <option key={attendant.id} value={attendant.id}>
                  {attendant.name} - {attendant.position?.name || 'Sem cargo'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Observações
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
              placeholder="Observações sobre o lead..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-300 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              {lead ? 'Salvar' : 'Criar Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}