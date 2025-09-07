# 🚀 Guia de Deploy do ZapBot no Coolify

Este guia fornece instruções completas para fazer o deploy do ZapBot em um servidor usando Coolify.

## 📋 Pré-requisitos

- Servidor VPS Linux (Ubuntu 20.04+ recomendado)
- Coolify instalado e configurado
- Acesso SSH ao servidor
- Domínio configurado (opcional, mas recomendado)
- Banco de dados MySQL configurado

## 🔧 Configuração do Servidor

### 1. Instalação do Coolify

Se ainda não tiver o Coolify instalado:

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

### 2. Configuração do MySQL

Certifique-se de que o MySQL está rodando e acessível:

```bash
# Verificar status do MySQL
sudo systemctl status mysql

# Se necessário, instalar MySQL
sudo apt update
sudo apt install mysql-server

# Configurar MySQL
sudo mysql_secure_installation
```

## 🚀 Deploy no Coolify

### 1. Criar Novo Projeto

1. Acesse o painel do Coolify
2. Clique em "New Resource"
3. Selecione "Application"
4. Escolha "Public Repository"

### 2. Configurar Repositório

- **Repository URL**: `https://github.com/seu-usuario/zapbot.git`
- **Branch**: `main`
- **Build Pack**: `nixpacks` (recomendado) ou `dockerfile`

### 3. Configurações de Build

#### Usando Dockerfile (Recomendado)
- **Build Pack**: `dockerfile`
- **Dockerfile**: `Dockerfile`
- **Port**: `3000`

#### Usando Nixpacks
- **Build Pack**: `nixpacks`
- **Start Command**: `npm start`
- **Port**: `3000`

### 4. Variáveis de Ambiente

Configure as seguintes variáveis no painel do Coolify:

#### Banco de Dados MySQL
```env
DATABASE_URL="mysql://usuario:senha@31.97.83.151:3306/zapbot"
DB_HOST="31.97.83.151"
DB_PORT="3306"
DB_USER="seu_usuario"
DB_PASS="sua_senha"
DB_NAME="zapbot"
```

#### Autenticação NextAuth
```env
NEXTAUTH_SECRET="sua_chave_secreta_muito_segura_aqui"
NEXTAUTH_URL="https://seu-dominio.com"
```

#### Configurações de Email (Gmail)
```env
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="seu-email@gmail.com"
EMAIL_SERVER_PASSWORD="sua_senha_de_app"
EMAIL_FROM="seu-email@gmail.com"
```

#### Configurações da Aplicação
```env
NODE_ENV="production"
PORT="3000"
NEXT_TELEMETRY_DISABLED="1"
```

### 5. Configurações de Domínio

1. No painel do Coolify, vá para "Domains"
2. Adicione seu domínio personalizado
3. Configure SSL automático (Let's Encrypt)

### 6. Deploy

1. Clique em "Deploy"
2. Aguarde o processo de build e deploy
3. Monitore os logs para verificar se tudo está funcionando

## 🔍 Verificação Pós-Deploy

### 1. Testar Conexão com Banco

Acesse: `https://seu-dominio.com/api/database/status`

Resposta esperada:
```json
{
  "status": "connected",
  "database": "MySQL",
  "timestamp": "2024-01-XX..."
}
```

### 2. Testar Autenticação

1. Acesse: `https://seu-dominio.com/login`
2. Tente fazer login com as credenciais padrão:
   - **Email**: `ti@adlux.com.br`
- **Senha**: `197755Jesus*`

### 3. Verificar Logs

No painel do Coolify:
1. Vá para "Logs"
2. Monitore logs de aplicação e build
3. Verifique se não há erros críticos

## 🛠️ Troubleshooting

### Erro de Conexão com Banco

```bash
# Verificar se o MySQL está acessível
mysql -h 31.97.83.151 -u seu_usuario -p

# Verificar firewall
sudo ufw status
sudo ufw allow 3306
```

### Erro de Build

1. Verifique se todas as dependências estão no `package.json`
2. Confirme se o `Dockerfile` está correto
3. Verifique os logs de build no Coolify

### Erro de SSL

1. Certifique-se de que o domínio está apontando para o servidor
2. Aguarde a propagação DNS (até 24h)
3. Force a renovação do certificado no Coolify

### Aplicação não Inicia

1. Verifique as variáveis de ambiente
2. Confirme se a porta 3000 está configurada
3. Verifique os logs da aplicação

## 📊 Monitoramento

### Health Check

O ZapBot inclui um endpoint de health check:
- **URL**: `/api/health`
- **Método**: `GET`
- **Resposta**: Status da aplicação e banco

### Logs Importantes

Monitore estes logs no Coolify:
- Logs de aplicação (erros de runtime)
- Logs de build (erros de compilação)
- Logs de proxy (erros de rede)

## 🔄 Atualizações

### Deploy Automático

1. Configure webhook no GitHub
2. No Coolify, ative "Auto Deploy"
3. Cada push na branch `main` fará deploy automático

### Deploy Manual

1. No painel do Coolify
2. Clique em "Redeploy"
3. Aguarde o processo completar

## 🔐 Segurança

### Recomendações

1. **Altere a senha padrão** do admin imediatamente
2. **Configure firewall** adequadamente
3. **Use HTTPS** sempre (SSL automático do Coolify)
4. **Mantenha backups** regulares do banco
5. **Monitore logs** regularmente

### Backup do Banco

```bash
# Backup automático diário
mysqldump -h 31.97.83.151 -u seu_usuario -p zapbot > backup_$(date +%Y%m%d).sql

# Restaurar backup
mysql -h 31.97.83.151 -u seu_usuario -p zapbot < backup_20240101.sql
```

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs no Coolify
2. Consulte a documentação do projeto
3. Verifique as configurações de rede e firewall
4. Teste a conectividade com o banco de dados

---

**✅ Deploy Concluído!**

Seu ZapBot agora está rodando no Coolify. Acesse `https://seu-dominio.com` para começar a usar!