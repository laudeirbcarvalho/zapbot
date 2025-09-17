# 🚀 Guia de Deploy do ZapBot no Coolify

Este guia fornece instruções passo a passo para fazer o deploy do ZapBot usando Coolify.

## 📋 Pré-requisitos

- Servidor Linux com Docker instalado
- Coolify instalado e configurado
- Acesso SSH ao servidor
- Domínio configurado (opcional, mas recomendado)

## 🔧 Configuração Inicial

### 1. Preparar o Repositório

Certifique-se de que todos os arquivos Docker estão no repositório:
- `Dockerfile`
- `docker-compose.yml`
- `.dockerignore`
- `docker-entrypoint.sh`
- `.env.example`

### 2. Fazer Push dos Arquivos

```bash
git add .
git commit -m "feat: Adicionar configuração Docker para produção"
git push origin main
```

## 🌐 Configuração no Coolify

### Passo 1: Criar Novo Projeto

1. Acesse o painel do Coolify
2. Clique em **"New Project"**
3. Digite o nome: `zapbot`
4. Clique em **"Create"**

### Passo 2: Adicionar Aplicação

1. Dentro do projeto, clique em **"New Resource"**
2. Selecione **"Application"**
3. Escolha **"Docker Compose"**

### Passo 3: Configurar Repositório

1. **Source Type**: Git Repository
2. **Repository URL**: `https://github.com/seu-usuario/zapbot.git`
3. **Branch**: `main`
4. **Build Pack**: Docker Compose
5. **Docker Compose File**: `docker-compose.yml`

### Passo 4: Configurar Variáveis de Ambiente

Adicione as seguintes variáveis de ambiente:

#### Variáveis Obrigatórias:
```env
# Banco de Dados
DATABASE_URL=postgresql://zapbot:zapbot123@postgres:5432/zapbot
POSTGRES_DB=zapbot
POSTGRES_USER=zapbot
POSTGRES_PASSWORD=SUA_SENHA_SEGURA_AQUI

# NextAuth
NEXTAUTH_SECRET=sua-chave-secreta-super-segura-aqui
NEXTAUTH_URL=https://seu-dominio.com

# Aplicação
NODE_ENV=production
PORT=3000
```

#### Variáveis Opcionais:
```env
# Evolution API (WhatsApp)
EVOLUTION_API_URL=https://sua-evolution-api.com
EVOLUTION_API_KEY=sua-chave-evolution-api

# Redis
REDIS_URL=redis://redis:6379

# Email (se necessário)
SMTP_HOST=seu-smtp-host
SMTP_PORT=587
SMTP_USER=seu-email
SMTP_PASS=sua-senha-email
SMTP_FROM=noreply@seu-dominio.com
```

### Passo 5: Configurar Domínio (Opcional)

1. Na seção **"Domains"**, clique em **"Add Domain"**
2. Digite seu domínio: `zapbot.seu-dominio.com`
3. Ative **"Generate SSL Certificate"**

### Passo 6: Configurar Volumes Persistentes

1. Na seção **"Storages"**, adicione:
   - **Name**: `postgres_data`
   - **Mount Path**: `/var/lib/postgresql/data`
   - **Host Path**: `/opt/coolify/zapbot/postgres`

2. Adicione outro volume:
   - **Name**: `uploads`
   - **Mount Path**: `/app/public/uploads`
   - **Host Path**: `/opt/coolify/zapbot/uploads`

### Passo 7: Deploy

1. Clique em **"Deploy"**
2. Aguarde o processo de build e deploy
3. Monitore os logs para verificar se tudo está funcionando

## 🔍 Verificação do Deploy

### 1. Verificar Logs

```bash
# No servidor, verificar logs do container
docker logs zapbot-app
docker logs zapbot-postgres
```

### 2. Testar Conectividade

```bash
# Testar se a aplicação está respondendo
curl http://localhost:3000
# ou
curl https://seu-dominio.com
```

### 3. Verificar Banco de Dados

```bash
# Conectar ao container do PostgreSQL
docker exec -it zapbot-postgres psql -U zapbot -d zapbot

# Verificar tabelas
\dt
```

## 🛠️ Comandos Úteis

### Reiniciar Aplicação
```bash
# No Coolify, clique em "Restart" ou use:
docker-compose restart zapbot
```

### Ver Logs em Tempo Real
```bash
docker-compose logs -f zapbot
```

### Executar Migrações Manualmente
```bash
docker exec -it zapbot-app npx prisma migrate deploy
```

### Executar Seeds
```bash
docker exec -it zapbot-app node scripts/seed-integrations.js
```

### Backup do Banco de Dados
```bash
docker exec zapbot-postgres pg_dump -U zapbot zapbot > backup_$(date +%Y%m%d_%H%M%S).sql
```

## 🔧 Troubleshooting

### Problema: Aplicação não inicia

**Solução:**
1. Verificar logs: `docker logs zapbot-app`
2. Verificar se o banco está rodando: `docker logs zapbot-postgres`
3. Verificar variáveis de ambiente no Coolify

### Problema: Erro de conexão com banco

**Solução:**
1. Verificar se o PostgreSQL está saudável:
   ```bash
   docker exec zapbot-postgres pg_isready -U zapbot
   ```
2. Verificar a `DATABASE_URL` nas variáveis de ambiente

### Problema: Migrações não executam

**Solução:**
1. Executar manualmente:
   ```bash
   docker exec -it zapbot-app npx prisma migrate deploy
   ```
2. Verificar permissões do banco de dados

### Problema: Uploads não funcionam

**Solução:**
1. Verificar se o volume está montado corretamente
2. Verificar permissões da pasta:
   ```bash
   docker exec -it zapbot-app ls -la /app/public/uploads
   ```

## 📊 Monitoramento

### Métricas Importantes

1. **CPU e Memória**: Monitorar uso dos containers
2. **Espaço em Disco**: Verificar crescimento dos volumes
3. **Logs de Erro**: Monitorar logs da aplicação
4. **Conectividade**: Verificar se a aplicação responde

### Alertas Recomendados

- CPU > 80% por mais de 5 minutos
- Memória > 90% por mais de 2 minutos
- Aplicação não responde por mais de 1 minuto
- Espaço em disco < 10%

## 🔄 Atualizações

### Deploy de Nova Versão

1. Fazer push das alterações para o repositório
2. No Coolify, clicar em **"Deploy"**
3. Aguardar o processo de build e deploy
4. Verificar se tudo está funcionando

### Rollback

1. No Coolify, ir para **"Deployments"**
2. Selecionar uma versão anterior
3. Clicar em **"Redeploy"**

## 📞 Suporte

Se encontrar problemas durante o deploy:

1. Verificar logs detalhados
2. Consultar documentação do Coolify
3. Verificar issues no repositório do projeto
4. Contatar suporte técnico

---

**✅ Deploy Concluído!**

Sua aplicação ZapBot deve estar rodando em: `https://seu-dominio.com`

Acesse o painel administrativo e configure suas integrações!