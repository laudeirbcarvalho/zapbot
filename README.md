# 🤖 ZapBot - Dashboard de Leads

Um sistema completo de gerenciamento de leads com interface Kanban intuitiva, desenvolvido com Next.js 14 e TypeScript.

## ✨ Funcionalidades

- 📊 **Dashboard Kanban**: Visualização e gerenciamento de leads em colunas personalizáveis
- 🔄 **Sincronização Dinâmica**: Atualizações automáticas entre componentes
- 📝 **Formulário de Leads**: Cadastro e edição de leads com validação
- 🎨 **Interface Moderna**: Design responsivo e intuitivo
- 🐳 **Docker Ready**: Containerização completa para fácil deploy
- 🔧 **TypeScript**: Tipagem forte para maior confiabilidade

## 🚀 Instalação Rápida

### Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) (recomendado)
- [Docker Compose](https://docs.docker.com/compose/install/)
- Ou [Node.js 18+](https://nodejs.org/) para instalação manual

### 🐳 Instalação com Docker (Recomendado)

#### Windows
```powershell
# Clone o repositório
git clone https://github.com/laudeirbcarvalho/zapbot.git
cd zapbot

# Execute o script de instalação
.\install.ps1
```

#### Linux/macOS
```bash
# Clone o repositório
git clone https://github.com/laudeirbcarvalho/zapbot.git
cd zapbot

# Torne o script executável e execute
chmod +x install.sh
./install.sh
```

#### Instalação Manual com Docker
```bash
# Clone o repositório
git clone https://github.com/laudeirbcarvalho/zapbot.git
cd zapbot

# Copie o arquivo de ambiente
cp .env.example .env

# Build e execute
docker-compose up -d
```

### 📦 Instalação Manual (sem Docker)

```bash
# Clone o repositório
git clone https://github.com/laudeirbcarvalho/zapbot.git
cd zapbot

# Instale as dependências
npm install

# Configure o ambiente
cp .env.example .env

# Execute em modo de desenvolvimento
npm run dev

# Ou build para produção
npm run build
npm start
```

## 🔧 Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Configurações da aplicação
NODE_ENV=production
PORT=3000

# Adicione suas configurações específicas aqui
# DATABASE_URL=sua_url_do_banco
# API_KEY=sua_chave_api
```

## 🎯 Como Usar

1. **Acesse a aplicação**: http://localhost:3000
2. **Dashboard Kanban**: Visualize e gerencie seus leads
3. **Adicionar Leads**: Use o formulário para cadastrar novos leads
4. **Gerenciar Colunas**: Crie, edite e organize suas colunas
5. **Arrastar e Soltar**: Mova leads entre colunas facilmente

## 🏗️ Estrutura do Projeto

```
zapbot/
├── app/                    # Código da aplicação Next.js 14
│   ├── api/               # Rotas da API
│   │   ├── columns/       # Gerenciamento de colunas
│   │   ├── leads/         # Gerenciamento de leads
│   │   └── health/        # Health check
│   ├── dashboard/         # Páginas do dashboard
│   │   ├── kanban/        # Interface Kanban
│   │   └── leads/         # Formulário de leads
│   ├── hooks/             # Hooks personalizados
│   └── components/        # Componentes reutilizáveis
├── public/                # Arquivos estáticos
├── docker-compose.yml     # Orquestração Docker
├── Dockerfile            # Imagem de produção
├── Dockerfile.dev        # Imagem de desenvolvimento
└── install.sh/.ps1       # Scripts de instalação
```

## 🐳 Comandos Docker

```bash
# Iniciar aplicação
docker-compose up -d

# Parar aplicação
docker-compose down

# Ver logs
docker-compose logs -f

# Rebuild completo
docker-compose build --no-cache

# Status dos containers
docker-compose ps

# Modo desenvolvimento
docker-compose --profile dev up -d
```

## 🛠️ Desenvolvimento

### Executar em modo desenvolvimento
```bash
npm run dev
```

### Build para produção
```bash
npm run build
npm start
```

### Linting e formatação
```bash
npm run lint
npm run lint:fix
```

## 📊 Monitoramento

- **Health Check**: http://localhost:3000/api/health
- **Logs**: `docker-compose logs -f zapbot`

## 🔄 Atualizações

```bash
# Puxar atualizações
git pull origin main

# Rebuild e restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🆘 Suporte

Se você encontrar algum problema:

1. Verifique os [Issues](https://github.com/laudeirbcarvalho/zapbot/issues) existentes
2. Crie um novo issue com detalhes do problema
3. Inclua logs e informações do ambiente

## 🚀 Deploy

### Docker Hub
```bash
# Build e push para Docker Hub
docker build -t seu-usuario/zapbot .
docker push seu-usuario/zapbot
```

### Vercel/Netlify
O projeto está pronto para deploy em plataformas como Vercel ou Netlify. Configure as variáveis de ambiente na plataforma escolhida.

---

**Desenvolvido com ❤️ usando Next.js 14, TypeScript e Docker**
