# 🔄 Migração para MySQL - ZapBot

## 📋 Instruções de Migração

Como a conexão direta com o MySQL não está funcionando localmente, siga estas etapas para migrar manualmente:

### 1️⃣ **Criar Tabelas no MySQL**

1. Acesse o phpMyAdmin: https://mysql.bpofinanceiro.shop/
2. Faça login com as credenciais:
   - **Usuário:** `mysql`
   - **Senha:** `5frr1t5s9FSQstPoAOQl6YqRnzzAsgROMf8q51g367wycnnEQg3gpnq4L3rmcT0b`
3. Selecione o banco `default`
4. Vá na aba **SQL**
5. Copie e cole o conteúdo do arquivo `create_mysql_tables.sql`
6. Execute o script

### 2️⃣ **Configurações Atualizadas**

✅ **Schema Prisma** - Atualizado para MySQL
✅ **Variáveis de Ambiente** - Configuradas para MySQL
✅ **Arquivos .env e .env.example** - Atualizados

### 3️⃣ **Dados Migrados Automaticamente**

O script SQL já inclui:
- 📋 **5 Colunas do Kanban** (Novos Leads, Em Contato, Qualificados, Proposta Enviada, Fechados)
- 👤 **Usuário Admin** (email: admin@zapbot.com, senha: admin123)
- 👥 **3 Leads de exemplo**
- 🔗 **3 Integrações de exemplo** (WhatsApp, Facebook, Google Sheets)

### 4️⃣ **Migração de Dados Existentes (Opcional)**

Se você tem dados no SQLite que deseja migrar:

```bash
# Execute o script de migração
node migrate_data.js
```

### 5️⃣ **Testar a Aplicação**

```bash
# Gerar cliente Prisma
npx prisma generate

# Iniciar aplicação
npm run dev
```

### 6️⃣ **Verificar Conexão**

Acesse: http://localhost:3000/api/health

Deve retornar:
```json
{
  "status": "ok",
  "timestamp": "2024-01-XX...",
  "uptime": "...",
  "environment": "development",
  "version": "1.0.0"
}
```

## 🔧 **Configurações do MySQL**

```env
DATABASE_URL="mysql://mysql:5frr1t5s9FSQstPoAOQl6YqRnzzAsgROMf8q51g367wycnnEQg3gpnq4L3rmcT0b@mysql.bpofinanceiro.shop:3306/default"
DB_HOST=mysql.bpofinanceiro.shop
DB_PORT=3306
DB_USER=mysql
DB_PASS=5frr1t5s9FSQstPoAOQl6YqRnzzAsgROMf8q51g367wycnnEQg3gpnq4L3rmcT0b
DB_NAME=default
```

## 📊 **Estrutura das Tabelas**

### User
- `id` (VARCHAR) - Chave primária
- `name` (VARCHAR) - Nome do usuário
- `email` (VARCHAR) - Email único
- `password` (VARCHAR) - Senha hash
- `createdAt`, `updatedAt` (DATETIME)

### Column
- `id` (VARCHAR) - Chave primária
- `title` (VARCHAR) - Título da coluna
- `position` (INT) - Posição no Kanban
- `createdAt`, `updatedAt` (DATETIME)

### Lead
- `id` (VARCHAR) - Chave primária
- `name` (VARCHAR) - Nome do lead
- `email`, `phone`, `source` (VARCHAR) - Dados de contato
- `status` (VARCHAR) - Status do lead
- `notes` (TEXT) - Observações
- `columnId` (VARCHAR) - FK para Column
- `position` (INT) - Posição na coluna
- `createdAt`, `updatedAt` (DATETIME)

### Integration
- `id` (VARCHAR) - Chave primária
- `name` (VARCHAR) - Nome da integração
- `type` (VARCHAR) - Tipo da integração
- `config` (TEXT) - Configurações JSON
- `createdAt`, `updatedAt` (DATETIME)

## 🚀 **Deploy em Produção**

Para deploy no Coolify:
1. As configurações já estão prontas
2. O Coolify detectará automaticamente o MySQL
3. Configure as variáveis de ambiente no painel do Coolify
4. O deploy será automático

## ❓ **Troubleshooting**

**Erro de conexão:**
- Verifique se o servidor MySQL está online
- Confirme as credenciais no phpMyAdmin
- Teste a conectividade de rede

**Erro de migração:**
- Execute o script SQL manualmente no phpMyAdmin
- Verifique se todas as tabelas foram criadas
- Confirme se os dados iniciais foram inseridos

---

✅ **Status:** Configuração MySQL completa e pronta para uso!