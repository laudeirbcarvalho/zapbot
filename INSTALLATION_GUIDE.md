# 📋 Guia Completo de Instalação - ZapBot

## 🎯 Pré-requisitos

### Sistema Operacional
- Windows 10/11, macOS ou Linux
- Mínimo 4GB RAM
- 2GB espaço livre em disco

### Software Necessário

#### 1. Node.js (versão 18 ou superior)
**Windows:**
- Baixe em: https://nodejs.org/
- Execute o instalador e siga as instruções
- Verifique: `node --version` e `npm --version`

**Linux/macOS:**
```bash
# Via Node Version Manager (recomendado)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

#### 2. PostgreSQL (versão 14 ou superior)
**Windows:**
- Baixe em: https://www.postgresql.org/download/windows/
- Durante instalação, defina senha para usuário 'postgres'
- Anote: host=localhost, porta=5432

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

#### 3. Git
- Windows: https://git-scm.com/download/win
- Linux: `sudo apt install git`
- macOS: `brew install git`

## 🚀 Instalação do ZapBot

### Passo 1: Clone o Repositório
```bash
git clone <URL_DO_REPOSITORIO>
cd zapbot-1
```

### Passo 2: Instale as Dependências
```bash
npm install
```

### Passo 3: Configure o Banco de Dados PostgreSQL

#### 3.1 Crie o Banco de Dados
```sql
-- Conecte ao PostgreSQL como superusuário
psql -U postgres

-- Crie o banco de dados
CREATE DATABASE zapbot;

-- Crie um usuário específico (opcional)
CREATE USER zapbot_user WITH PASSWORD 'sua_senha_segura';
GRANT ALL PRIVILEGES ON DATABASE zapbot TO zapbot_user;

-- Saia do psql
\q
```

#### 3.2 Configure as Variáveis de Ambiente
Crie o arquivo `.env` na raiz do projeto:

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

### Passo 4: Execute as Migrações do Banco
```bash
# Gere o cliente Prisma
npx prisma generate

# Execute as migrações
npx prisma migrate deploy

# (Opcional) Visualize o banco de dados
npx prisma studio
```

### Passo 5: Crie o Usuário SuperAdmin
Crie um arquivo temporário `create-admin.js`:

```javascript
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createSuperAdmin() {
  try {
    // Verifica se já existe um SuperAdmin
    const existingAdmin = await prisma.user.findFirst({
      where: { type: 'SUPERADMIN' }
    });

    if (existingAdmin) {
      console.log('SuperAdmin já existe:', existingAdmin.email);
      return;
    }

    // Cria o hash da senha
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Cria o SuperAdmin
    const superAdmin = await prisma.user.create({
      data: {
        name: 'Super Administrador',
        email: 'admin@zapbot.com',
        password: hashedPassword,
        type: 'SUPERADMIN',
        isActive: true
      }
    });

    console.log('SuperAdmin criado com sucesso!');
    console.log('Email:', superAdmin.email);
    console.log('Senha: admin123');
    console.log('ID:', superAdmin.id);
  } catch (error) {
    console.error('Erro ao criar SuperAdmin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
```

Execute o script:
```bash
node create-admin.js
```

**⚠️ IMPORTANTE:** Delete o arquivo `create-admin.js` após a execução por segurança.

### Passo 6: Inicie a Aplicação

#### Desenvolvimento
```bash
npm run dev
```

#### Produção
```bash
npm run build
npm start
```

## 🔐 Primeiro Acesso

1. Acesse: `http://localhost:3000/login`
2. Use as credenciais:
   - **Email:** admin@zapbot.com
   - **Senha:** admin123

**⚠️ ALTERE A SENHA PADRÃO IMEDIATAMENTE APÓS O PRIMEIRO LOGIN!**

## 🛠️ Comandos Úteis

```bash
# Verificar status do banco
npx prisma db pull

# Reset completo do banco (CUIDADO!)
npx prisma migrate reset

# Backup do banco
pg_dump -U postgres zapbot > backup.sql

# Restaurar backup
psql -U postgres zapbot < backup.sql

# Ver logs da aplicação
npm run dev -- --verbose
```



## 🔧 Solução de Problemas

### Erro de Conexão com PostgreSQL
```bash
# Verifique se o PostgreSQL está rodando
sudo systemctl status postgresql  # Linux
net start postgresql-x64-14       # Windows

# Teste a conexão
psql -U postgres -h localhost -p 5432
```

### Erro de Permissões
```bash
# Linux/macOS
sudo chown -R $USER:$USER .
chmod +x scripts/*

# Windows (PowerShell como Admin)
Set-ExecutionPolicy RemoteSigned
```

### Porta 3000 em Uso
```bash
# Encontre o processo
netstat -ano | findstr :3000  # Windows
lsof -i :3000                 # Linux/macOS

# Mate o processo ou use outra porta
set PORT=3001 && npm run dev
```

## 📞 Suporte

Em caso de problemas:
1. Verifique os logs: `npm run dev`
2. Consulte a documentação: `README.md`
3. Verifique as issues no repositório

## 🔄 Atualizações

```bash
# Atualize o código
git pull origin main

# Atualize dependências
npm install

# Execute novas migrações
npx prisma migrate deploy

# Reinicie a aplicação
npm run dev
```

---

**✅ Instalação Concluída!** O ZapBot está pronto para uso.