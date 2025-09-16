# 🤖 ZapBot - Dashboard de Leads

Um sistema completo de gerenciamento de leads com interface Kanban intuitiva, desenvolvido com Next.js 14 e TypeScript.

## ✨ Funcionalidades

- 📊 **Dashboard Kanban**: Visualização e gerenciamento de leads em colunas personalizáveis
- 🔄 **Sincronização Dinâmica**: Atualizações automáticas entre componentes
- 📝 **Formulário de Leads**: Cadastro e edição de leads com validação
- 🎨 **Interface Moderna**: Design responsivo e intuitivo
- 🚀 **Fácil Instalação**: Configuração simples e rápida
- 🔧 **TypeScript**: Tipagem forte para maior confiabilidade

## 🚀 Instalação Rápida

## 🛠️ Pré-requisitos

- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- [PostgreSQL](https://www.postgresql.org/) (versão 12 ou superior)
- [Git](https://git-scm.com/)

## 🚀 Instalação

### Windows

```powershell
# Clone o repositório
git clone https://github.com/seu-usuario/zapbot.git
cd zapbot

# Instale as dependências
npm install

# Configure o banco de dados PostgreSQL
# Crie um banco chamado 'zapbot'

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações

# Execute as migrações
npx prisma generate
npx prisma migrate deploy

# Inicie a aplicação
npm run dev
```

### Linux/macOS

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/zapbot.git
cd zapbot

# Instale as dependências
npm install

# Configure o banco de dados PostgreSQL
# Crie um banco chamado 'zapbot'

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações

# Execute as migrações
npx prisma generate
npx prisma migrate deploy

# Inicie a aplicação
npm run dev
```

Acesse: http://localhost:3000

## 🔧 Configuração

### Arquivo .env

O arquivo `.env` na raiz do projeto contém todas as configurações necessárias:

```env
# Configuração do Banco de Dados PostgreSQL
DATABASE_URL="postgresql://postgres:sua_senha@localhost:5432/zapbot?schema=public"

# Configuração JWT
JWT_SECRET="seu_jwt_secret_muito_seguro_aqui"
NEXTAUTH_SECRET="seu_nextauth_secret_muito_seguro_aqui"
NEXTAUTH_URL="http://localhost:3000"

# Configuração da Aplicação
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Configuração de Upload
UPLOAD_DIR="./public/uploads"

# Configuração de Email (opcional)
SMTP_HOST="seu_smtp_host"
SMTP_PORT="587"
SMTP_USER="seu_email"
SMTP_PASS="sua_senha_email"
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

### 🗄️ Configuração do Banco PostgreSQL

**Exemplo de configuração completa:**

```env
# Para banco local
DATABASE_URL="postgresql://postgres:minhasenha@localhost:5432/zapbot?schema=public"

# Para banco remoto
DATABASE_URL="postgresql://usuario:senha123@servidor.com:5432/zapbot?schema=public"
```

**⚠️ Importante:** Após alterar as configurações do banco de dados, execute as migrações:

```bash
npx prisma generate
npx prisma migrate deploy
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
│   │   ├── auth/          # Autenticação
│   │   ├── users/         # Gerenciamento de usuários
│   │   ├── attendants/    # Gerenciamento de atendentes
│   │   └── leads/         # Gerenciamento de leads
│   ├── dashboard/         # Páginas do dashboard
│   │   ├── usuarios/      # Gerenciamento de usuários
│   │   ├── atendentes/    # Gerenciamento de atendentes
│   │   ├── leads/         # Gerenciamento de leads
│   │   └── documentos/    # Documentação do sistema
│   ├── components/        # Componentes reutilizáveis
│   └── lib/              # Utilitários e configurações
├── prisma/               # Schema e migrações do banco
├── public/               # Arquivos estáticos
└── scripts/              # Scripts de configuração
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

### Comandos do Prisma
```bash
# Gerar cliente Prisma
npx prisma generate

# Executar migrações
npx prisma migrate deploy

# Visualizar banco de dados
npx prisma studio

# Reset do banco (desenvolvimento)
npx prisma migrate reset
```

## 📊 Monitoramento

- **Health Check**: http://localhost:3000/api/health
- **Prisma Studio**: http://localhost:5555 (quando executado)

## 🔄 Atualizações

```bash
# Puxar atualizações
git pull origin main

# Instalar novas dependências
npm install

# Executar migrações
npx prisma migrate deploy

# Reiniciar aplicação
npm run dev
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

1. Verifique os [Issues](https://github.com/seu-usuario/zapbot/issues) existentes
2. Crie um novo issue com detalhes do problema
3. Inclua logs e informações do ambiente

---

**Desenvolvido com ❤️ usando Next.js 14, TypeScript e PostgreSQL**
