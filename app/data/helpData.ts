export interface HelpStep {
  title: string;
  description: string;
  image?: string;
  tips?: string[];
}

export interface ModuleHelp {
  moduleName: string;
  steps: HelpStep[];
}

export const helpData: { [key: string]: ModuleHelp } = {
  attendants: {
    moduleName: "Atendentes",
    steps: [
      {
        title: "Visão Geral do Módulo",
        description: "O módulo de Atendentes permite gerenciar toda sua equipe de atendimento. Aqui você pode adicionar novos atendentes, editar informações, acompanhar desempenho e controlar acessos.",
        tips: [
          "Use este módulo para manter sua equipe organizada",
          "Acompanhe métricas de desempenho em tempo real",
          "Controle horários e dias de trabalho de cada atendente"
        ]
      },
      {
        title: "Adicionando um Novo Atendente",
        description: "Clique no botão 'Adicionar Atendente' no canto superior direito. Preencha as informações básicas como nome, email, telefone e CPF. Defina também o cargo, função, departamento e horários de trabalho.",
        tips: [
          "Todos os campos marcados com * são obrigatórios",
          "O email será usado para login do atendente",
          "Defina horários realistas de trabalho",
          "Escolha um gerente responsável pelo atendente"
        ]
      },
      {
        title: "Editando Informações do Atendente",
        description: "Clique no ícone de lápis (✏️) ao lado do nome do atendente para editar suas informações. Você pode alterar dados pessoais, horários, status e vinculações.",
        tips: [
          "Use o status 'Ativo/Inativo' para controlar acesso",
          "Atualize horários conforme mudanças na escala",
          "Mantenha informações de contato sempre atualizadas"
        ]
      },
      {
        title: "Acompanhando Desempenho",
        description: "Cada atendente possui métricas de desempenho visíveis no card: total de leads, avaliação média, número de avaliações e distribuição entre elogios, críticas e avaliações neutras.",
        tips: [
          "Avaliações acima de 4.5 são excelentes (verde)",
          "Avaliações entre 3.5-4.4 são boas (amarelo)",
          "Avaliações abaixo de 3.5 precisam de atenção (vermelho)",
          "Use essas métricas para feedback e treinamento"
        ]
      },
      {
        title: "Acesso Direto ao Dashboard",
        description: "Use o botão 'Acessar Dashboard' para entrar diretamente na conta do atendente. Isso é útil para suporte, treinamento ou verificação de atividades.",
        tips: [
          "O acesso direto abre em uma nova aba",
          "Você verá exatamente o que o atendente vê",
          "Use com responsabilidade e transparência",
          "Ideal para treinamentos e suporte técnico"
        ]
      },
      {
        title: "Gerenciando Leads dos Atendentes",
        description: "Cada atendente mostra quantos leads possui atualmente. Você pode acompanhar a distribuição de trabalho e balancear a carga entre a equipe.",
        tips: [
          "Distribua leads de forma equilibrada",
          "Monitore atendentes sobrecarregados",
          "Use as métricas para otimizar a equipe",
          "Leads ativos aparecem no contador"
        ]
      },
      {
        title: "Controle de Horários e Dias",
        description: "Defina os dias da semana e horários de trabalho de cada atendente. Isso ajuda no controle de disponibilidade e planejamento de escalas.",
        tips: [
          "Configure horários realistas",
          "Use abreviações: Seg, Ter, Qua, Qui, Sex, Sáb, Dom",
          "Horários ajudam no roteamento automático",
          "Mantenha sempre atualizado"
        ]
      },
      {
        title: "Exclusão de Atendentes",
        description: "Use o botão vermelho de lixeira (🗑️) para excluir um atendente. Esta ação é irreversível, então use com cuidado. Considere desativar ao invés de excluir.",
        tips: [
          "CUIDADO: Exclusão é permanente",
          "Prefira desativar ao invés de excluir",
          "Exclua apenas em casos extremos",
          "Faça backup dos dados importantes antes"
        ]
      }
    ]
  },
  
  leads: {
    moduleName: "Leads",
    steps: [
      {
        title: "Visão Geral do Módulo",
        description: "O módulo de Leads é o coração do seu CRM. Aqui você gerencia todos os contatos, acompanha o funil de vendas e controla o processo comercial.",
        tips: [
          "Organize leads por colunas do funil",
          "Use filtros para encontrar leads específicos",
          "Acompanhe métricas de conversão"
        ]
      },
      {
        title: "Adicionando Leads Manualmente",
        description: "Clique em 'Adicionar Lead' para criar um novo contato. Preencha nome, telefone, email e outras informações relevantes. Escolha a coluna inicial e o atendente responsável.",
        tips: [
          "Nome e telefone são obrigatórios",
          "Email ajuda na comunicação",
          "Escolha a coluna correta no funil",
          "Atribua ao atendente mais adequado"
        ]
      },
      {
        title: "Importação de Planilhas Excel",
        description: "Use o botão 'Importar Excel' para adicionar múltiplos leads de uma vez. O sistema suporta colunas Nome, Telefone, Email e Origem. Leads duplicados são tratados automaticamente.",
        tips: [
          "Use o formato: Nome, Telefone, Email, Origem",
          "Sistema detecta duplicatas automaticamente",
          "Confirme importação de duplicatas se necessário",
          "Verifique dados antes de importar"
        ]
      }
    ]
  },
  
  kanban: {
    moduleName: "Kanban",
    steps: [
      {
        title: "Visão Geral do Kanban",
        description: "O Kanban oferece uma visão visual do seu funil de vendas. Arraste e solte leads entre as colunas para atualizar seu status no processo comercial.",
        tips: [
          "Arraste leads entre colunas",
          "Visualize todo o funil de uma vez",
          "Acompanhe progresso visualmente"
        ]
      }
    ]
  },
  
  usuarios: {
    moduleName: "Usuários",
    steps: [
      {
        title: "Gerenciamento de Usuários",
        description: "Controle todos os usuários do sistema: administradores, gerentes e atendentes. Defina permissões e hierarquias organizacionais.",
        tips: [
          "Defina hierarquias claras",
          "Controle permissões por tipo de usuário",
          "Mantenha informações atualizadas"
        ]
      }
    ]
  },
  
  lixeira: {
    moduleName: "Lixeira",
    steps: [
      {
        title: "Visão Geral da Lixeira",
        description: "A lixeira armazena todos os leads excluídos do sistema. Aqui você pode visualizar, restaurar ou excluir permanentemente os leads removidos.",
        tips: [
          "Leads ficam na lixeira por segurança",
          "Você pode restaurar leads excluídos por engano",
          "Exclusão permanente não pode ser desfeita"
        ]
      },
      {
        title: "Restaurando Leads",
        description: "Use o botão de restaurar (↻) para devolver um lead excluído ao sistema. O lead voltará para sua coluna original no funil de vendas.",
        tips: [
          "Lead volta para a coluna original",
          "Todas as informações são preservadas",
          "Atendente original é mantido",
          "Histórico de atividades é preservado"
        ]
      },
      {
        title: "Exclusão Permanente",
        description: "O botão de lixeira (🗑️) remove permanentemente o lead do sistema. Esta ação é irreversível e apaga todos os dados relacionados.",
        tips: [
          "ATENÇÃO: Ação irreversível",
          "Todos os dados são perdidos",
          "Use apenas quando necessário",
          "Considere manter na lixeira por mais tempo"
        ]
      },
      {
        title: "Busca e Filtros",
        description: "Use a barra de busca para encontrar leads específicos na lixeira. Você pode buscar por nome, email, telefone ou outras informações.",
        tips: [
          "Busque por qualquer campo do lead",
          "Use termos parciais para busca ampla",
          "Filtros ajudam a organizar a visualização"
        ]
      }
    ]
  },
  
  configuracoes: {
    moduleName: "Configurações",
    steps: [
      {
        title: "Visão Geral",
        description: "Esta página permite configurar as informações gerais da empresa e personalizar a aparência do sistema. O nome da empresa configurado aqui aparecerá em todo o sistema.",
        tips: [
          "Configure dados da empresa",
          "Personalize aparência do sistema",
          "Nome da empresa aparece em headers, títulos e emails"
        ]
      },
      {
        title: "Nome da Empresa/Sistema",
        description: "O nome configurado aqui será exibido dinamicamente em todo o sistema: headers, títulos, rodapés, emails e qualquer comunicação. Por padrão é 'ZapBot CRM'.",
        tips: [
          "Nome aparece em todo o sistema",
          "Usado em comunicações e emails",
          "Pode ser o nome da sua empresa ou sistema personalizado"
        ]
      },
      {
        title: "Informações de Contato",
        description: "Configure email, telefone e URL/website da empresa. Essas informações são usadas para contato e podem aparecer em relatórios e comunicações.",
        tips: [
          "Email para comunicações do sistema",
          "Telefone para contato direto",
          "URL deve incluir https:// para websites"
        ]
      },
      {
        title: "Tema do Sistema",
        description: "Escolha entre tema claro ou escuro. A mudança é aplicada imediatamente em todo o sistema e salva automaticamente para sua preferência.",
        tips: [
          "Tema escuro: melhor para ambientes com pouca luz",
          "Tema claro: melhor contraste e legibilidade",
          "Mudança é aplicada instantaneamente"
        ]
      },
      {
        title: "Salvando Configurações",
        description: "Clique em 'Salvar Configurações' para aplicar todas as alterações. As configurações são salvas localmente e aplicadas imediatamente.",
        tips: [
          "Configurações são salvas no navegador",
          "Mudanças aplicadas imediatamente",
          "Mensagem de sucesso confirma salvamento"
        ]
      }
    ]
  },
  
  kanban: {
    moduleName: "Kanban",
    steps: [
      {
        title: "Visão Geral do Kanban",
        description: "O Kanban oferece uma visão visual do seu funil de vendas. Arraste e solte leads entre as colunas para atualizar seu status no processo comercial.",
        tips: [
          "Arraste leads entre colunas",
          "Visualize todo o funil de uma vez",
          "Acompanhe progresso visualmente"
        ]
      },
      {
        title: "Colunas do Kanban",
        description: "Cada coluna representa uma etapa do processo. Você pode adicionar, editar ou remover colunas conforme necessário. Use o botão '+' para criar novas colunas.",
        tips: [
          "Personalize colunas conforme seu processo",
          "Organize etapas de forma lógica",
          "Remova colunas desnecessárias"
        ]
      },
      {
        title: "Movendo Leads",
        description: "Arraste e solte os cards de leads entre as colunas para atualizar seu status. O sistema salva automaticamente as mudanças de posição.",
        tips: [
          "Mudanças são salvas automaticamente",
          "Arraste pela área do card",
          "Solte na coluna desejada"
        ]
      },
      {
        title: "Gerenciando Leads",
        description: "Clique em um card para visualizar detalhes do lead. Você pode editar informações, adicionar notas ou marcar atendimentos realizados.",
        tips: [
          "Clique no card para abrir detalhes",
          "Mantenha informações atualizadas",
          "Use notas para registrar observações"
        ]
      },
      {
        title: "Adicionando Novos Leads",
        description: "Clique no botão '+' em qualquer coluna para adicionar um novo lead diretamente naquela etapa do processo.",
        tips: [
          "Lead é criado na coluna selecionada",
          "Preencha informações básicas",
          "Atribua a um atendente responsável"
        ]
      }
    ]
  }
};

export function getHelpData(moduleKey: string): ModuleHelp | null {
  return helpData[moduleKey] || null;
}