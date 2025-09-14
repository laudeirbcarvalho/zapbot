# 🗄️ Guia Completo: Acessando o Banco de Dados com Prisma

## 📋 Configuração Inicial

### 1. Variável de Ambiente
O Prisma usa a variável `DATABASE_URL` para conectar ao banco. Configure no arquivo `.env`:

```bash
# Para MySQL (padrão do projeto)
DATABASE_URL="mysql://zapbot_user:zapbot_pass_2024@localhost:3306/zapbot"

# Para PostgreSQL
DATABASE_URL="postgresql://usuario:senha@localhost:5432/zapbot"
```

### 2. Comandos Essenciais

```bash
# Gerar cliente Prisma (após mudanças no schema)
npx prisma generate

# Aplicar migrações
npx prisma migrate dev

# Visualizar dados no Prisma Studio
npx prisma studio

# Fazer push do schema (desenvolvimento)
npx prisma db push

# Reset completo do banco (CUIDADO!)
npx prisma migrate reset
```

## 🔧 Como Usar no Código

### 1. Importação Básica (Scripts Node.js)

```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Sempre desconectar no final
async function exemplo() {
  try {
    const usuarios = await prisma.user.findMany();
    console.log(usuarios);
  } finally {
    await prisma.$disconnect();
  }
}
```

### 2. Importação no Next.js (Singleton)

```typescript
// Use sempre: import { prisma } from '@/lib/prisma';
import { prisma } from '@/lib/prisma';

// Em API Routes
export async function GET() {
  const usuarios = await prisma.user.findMany();
  return NextResponse.json(usuarios);
}
```

## 📊 Operações Básicas

### Buscar Dados

```javascript
// Todos os registros
const usuarios = await prisma.user.findMany();

// Por ID
const usuario = await prisma.user.findUnique({
  where: { id: 'uuid-aqui' }
});

// Com filtros
const admins = await prisma.user.findMany({
  where: {
    userType: 'ADMIN',
    isActive: true
  }
});

// Com relacionamentos
const usuarioCompleto = await prisma.user.findUnique({
  where: { id: 'uuid-aqui' },
  include: {
    attendances: true,
    createdLeads: true,
    whatsappInstances: true
  }
});

// Primeiro registro que atende critério
const primeiroAdmin = await prisma.user.findFirst({
  where: { userType: 'ADMIN' }
});
```

### Criar Dados

```javascript
// Criar usuário
const novoUsuario = await prisma.user.create({
  data: {
    name: 'João Silva',
    email: 'joao@exemplo.com',
    password: 'hash-da-senha',
    userType: 'MANAGER',
    isActive: true
  }
});

// Criar com relacionamento
const lead = await prisma.lead.create({
  data: {
    name: 'Cliente Teste',
    email: 'cliente@teste.com',
    phone: '11999999999',
    userId: 'id-do-usuario'
  }
});
```

### Atualizar Dados

```javascript
// Atualizar por ID
const usuarioAtualizado = await prisma.user.update({
  where: { id: 'uuid-aqui' },
  data: {
    name: 'Novo Nome',
    isActive: false
  }
});

// Atualizar múltiplos
const { count } = await prisma.user.updateMany({
  where: { userType: 'MANAGER' },
  data: { isActive: true }
});
console.log(`${count} usuários atualizados`);
```

### Deletar Dados

```javascript
// Deletar por ID
const usuarioDeletado = await prisma.user.delete({
  where: { id: 'uuid-aqui' }
});

// Deletar múltiplos
const { count } = await prisma.user.deleteMany({
  where: { isActive: false }
});
console.log(`${count} usuários deletados`);
```

### Upsert (Criar ou Atualizar)

```javascript
const usuario = await prisma.user.upsert({
  where: { email: 'joao@exemplo.com' },
  update: {
    name: 'João Silva Atualizado'
  },
  create: {
    name: 'João Silva',
    email: 'joao@exemplo.com',
    password: 'hash-senha',
    userType: 'MANAGER'
  }
});
```

## 📈 Operações Avançadas

### Contar Registros

```javascript
// Total
const totalUsuarios = await prisma.user.count();

// Com filtros
const adminsAtivos = await prisma.user.count({
  where: {
    userType: 'ADMIN',
    isActive: true
  }
});
```

### Agregações

```javascript
// Agrupar e contar
const estatisticas = await prisma.user.groupBy({
  by: ['userType'],
  _count: {
    id: true
  }
});
```

### Queries Raw (SQL Direto)

```javascript
// Query raw
const resultado = await prisma.$queryRaw`
  SELECT COUNT(*) as total 
  FROM "User" 
  WHERE "userType" = 'ADMIN'
`;

// Execute raw (para INSERT, UPDATE, DELETE)
const linhasAfetadas = await prisma.$executeRaw`
  UPDATE "User" 
  SET "isActive" = true 
  WHERE "userType" = 'MANAGER'
`;
```

### Transações

```javascript
const resultado = await prisma.$transaction(async (tx) => {
  // Criar usuário
  const usuario = await tx.user.create({
    data: {
      name: 'Maria Silva',
      email: 'maria@exemplo.com',
      password: 'hash-senha',
      userType: 'MANAGER'
    }
  });

  // Criar lead associado
  const lead = await tx.lead.create({
    data: {
      name: 'Lead da Maria',
      email: 'lead@exemplo.com',
      phone: '11888888888',
      userId: usuario.id
    }
  });

  return { usuario, lead };
});
```

## 🎯 Exemplos Específicos do Projeto

### Gerenciar Usuários

```javascript
// Listar todos os usuários
const usuarios = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    email: true,
    userType: true,
    isSuperAdmin: true,
    isActive: true
  }
});

// Buscar administradores
const admins = await prisma.user.findMany({
  where: {
    userType: 'ADMIN',
    isActive: true
  }
});

// Criar super admin
const superAdmin = await prisma.user.create({
  data: {
    name: 'Super Admin',
    email: 'admin@sistema.com',
    password: await bcrypt.hash('senha123', 10),
    userType: 'ADMIN',
    isSuperAdmin: true,
    isActive: true
  }
});
```

### Gerenciar Leads

```javascript
// Listar leads com usuário
const leads = await prisma.lead.findMany({
  include: {
    user: {
      select: {
        name: true,
        email: true
      }
    },
    column: true
  }
});

// Criar lead
const novoLead = await prisma.lead.create({
  data: {
    name: 'Cliente Potencial',
    email: 'cliente@email.com',
    phone: '11999999999',
    userId: 'id-do-usuario',
    columnId: 'id-da-coluna'
  }
});
```

### Gerenciar Instâncias WhatsApp

```javascript
// Listar instâncias do usuário
const instancias = await prisma.whatsAppInstance.findMany({
  where: {
    userId: 'id-do-usuario'
  }
});

// Criar nova instância
const instancia = await prisma.whatsAppInstance.create({
  data: {
    name: 'WhatsApp Business',
    instanceId: 'instance-123',
    status: 'disconnected',
    userId: 'id-do-usuario',
    channel: 'whatsapp',
    token: 'token-gerado'
  }
});
```

## 🚨 Boas Práticas

1. **Sempre use a instância singleton** em Next.js: `import { prisma } from '@/lib/prisma'`
2. **Desconecte em scripts**: `await prisma.$disconnect()`
3. **Use transações** para operações relacionadas
4. **Trate erros** adequadamente
5. **Use select/include** para otimizar queries
6. **Valide dados** antes de inserir

## 🔧 Scripts Úteis do Projeto

```bash
# Listar usuários
node list-users.js

# Criar super admin
node create-super-admin.js

# Inserir dados de teste
node scripts/seed-test-data.js

# Criar integrações padrão
node scripts/seed-integrations.js
```

## 🐛 Troubleshooting

### Erro de Conexão
```bash
# Verificar se o banco está rodando
npx prisma db pull

# Testar conexão
node -e "const {PrismaClient} = require('@prisma/client'); const p = new PrismaClient(); p.\$connect().then(() => console.log('OK')).catch(console.error)"
```

### Regenerar Cliente
```bash
# Após mudanças no schema
npx prisma generate
```

### Reset Completo
```bash
# CUIDADO: Apaga todos os dados!
npx prisma migrate reset
npx prisma db push
node scripts/seed-test-data.js
```

---

**💡 Dica**: Use o Prisma Studio (`npx prisma studio`) para visualizar e editar dados graficamente!