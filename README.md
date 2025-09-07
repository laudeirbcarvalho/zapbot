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

### Arquivo .env

O arquivo `.env` na raiz do projeto contém todas as configurações necessárias. **Este é o único arquivo que precisa ser configurado para o funcionamento completo da aplicação.**

```env
# ===========================================
# CONFIGURAÇÕES DO BANCO DE DADOS MYSQL
# ===========================================
# URL completa de conexão com o banco MySQL
DATABASE_URL="mysql://usuario:senha@host:porta/nome_do_banco"

# Configurações individuais do banco (usadas como backup)
DB_HOST="seu_host_mysql"          # Ex: localhost, 31.97.83.151
DB_PORT="3306"                     # Porta padrão do MySQL
DB_USER="seu_usuario"             # Usuário do banco
DB_PASS="sua_senha"               # Senha do banco
DB_NAME="nome_do_banco"           # Nome do banco de dados

# ===========================================
# CONFIGURAÇÕES DE AUTENTICAÇÃO (NextAuth)
# ===========================================
NEXTAUTH_URL="http://localhost:3000"  # URL da aplicação
NEXTAUTH_SECRET="sua_chave_secreta"   # Chave secreta para JWT

# ===========================================
# CONFIGURAÇÕES DE EMAIL (Recuperação de Senha)
# ===========================================
# Configurações do servidor SMTP
EMAIL_SERVER_HOST="smtp.gmail.com"    # Servidor SMTP
EMAIL_SERVER_PORT="587"               # Porta SMTP (587 para TLS)
EMAIL_SERVER_USER="seu_email@gmail.com"  # Email remetente
EMAIL_SERVER_PASSWORD="sua_senha_app"    # Senha do app (Gmail)
EMAIL_FROM="seu_email@gmail.com"         # Email de origem

# ===========================================
# CONFIGURAÇÕES DA APLICAÇÃO
# ===========================================
NODE_ENV="production"
PORT="3000"
```

### 📧 Configuração de Email (Gmail)

Para configurar o envio de emails de recuperação de senha:

1. **Ative a verificação em 2 etapas** na sua conta Google
2. **Gere uma senha de app**:
   - Acesse: https://myaccount.google.com/apppasswords
   - Selecione "Email" e "Outro (nome personalizado)"
   - Digite "ZapBot" e clique em "Gerar"
   - Use a senha gerada em `EMAIL_SERVER_PASSWORD`

3. **Configure as variáveis no .env**:
```env
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="seuemail@gmail.com"
EMAIL_SERVER_PASSWORD="abcd efgh ijkl mnop"  # Senha de app de 16 dígitos
EMAIL_FROM="seuemail@gmail.com"
```

### 🗄️ Configuração do Banco MySQL

**Exemplo de configuração completa:**

```env
# Para banco local
DATABASE_URL="mysql://root:minhasenha@localhost:3306/zapbot"
DB_HOST="localhost"
DB_USER="root"
DB_PASS="minhasenha"
DB_NAME="zapbot"

# Para banco remoto
DATABASE_URL="mysql://usuario:senha123@31.97.83.151:3306/meubanc"
DB_HOST="31.97.83.151"
DB_USER="usuario"
DB_PASS="senha123"
DB_NAME="meubanco"
```

**⚠️ Importante:** Após alterar as configurações do banco de dados, reinicie a aplicação para que as mudanças tenham efeito.

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

### Coolify (Recomendado)

O ZapBot está otimizado para deploy no Coolify com configuração automática:

```bash
# Executar script de preparação
chmod +x deploy-coolify.sh
./deploy-coolify.sh
```

**Arquivos de configuração incluídos:**
- `COOLIFY_DEPLOY_GUIDE.md` - Guia completo de instalação
- `coolify.json` - Configuração automática do Coolify
- `.env.coolify` - Exemplo de variáveis de ambiente
- `deploy-coolify.sh` - Script de preparação automática

**Passos rápidos:**
1. Configure as variáveis de ambiente (veja `.env.coolify`)
2. Crie nova aplicação no Coolify
3. Conecte o repositório Git
4. Configure as variáveis no painel
5. Deploy automático!

📖 **[Guia Completo de Deploy no Coolify](./COOLIFY_DEPLOY_GUIDE.md)**

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
