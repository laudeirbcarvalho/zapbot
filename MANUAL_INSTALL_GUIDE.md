# 📋 Guia de Instalação Manual do ZapBot no Servidor

Este guia fornece instruções passo a passo para instalar o ZapBot manualmente em um servidor Linux.

## 🔧 Pré-requisitos

- Servidor Linux (Ubuntu 20.04+ recomendado)
- Acesso root ou sudo
- Conexão com internet
- Domínio configurado (opcional)

## 📝 Passo a Passo Completo

### 1. Preparar o Servidor

```bash
# Atualizar o sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependências básicas
sudo apt install -y curl wget git unzip software-properties-common
```

### 2. Instalar Node.js

```bash
# Instalar Node.js 18.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalação
node --version
npm --version
```

### 3. Instalar MySQL

```bash
# Instalar MySQL Server
sudo apt install -y mysql-server

# Configurar MySQL
sudo mysql_secure_installation

# Entrar no MySQL como root
sudo mysql -u root -p
```

**No MySQL, execute:**

```sql
-- Criar banco de dados
CREATE DATABASE zapbot_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Criar usuário
CREATE USER 'zapbot_user'@'localhost' IDENTIFIED BY 'sua_senha_forte_aqui';

-- Conceder permissões
GRANT ALL PRIVILEGES ON zapbot_db.* TO 'zapbot_user'@'localhost';
FLUSH PRIVILEGES;

-- Sair
EXIT;
```

### 4. Clonar/Colar Arquivos do Projeto

**Opção A: Via Git (Recomendado)**

```bash
# Criar diretório para a aplicação
sudo mkdir -p /var/www/zapbot
cd /var/www/zapbot

# Clonar repositório
sudo git clone https://github.com/seu-usuario/zapbot.git .

# Definir permissões
sudo chown -R $USER:$USER /var/www/zapbot
```

**Opção B: Upload Manual**

```bash
# Criar diretório
sudo mkdir -p /var/www/zapbot

# Fazer upload dos arquivos via SCP/SFTP
# scp -r ./zapbot/* usuario@servidor:/var/www/zapbot/

# Definir permissões
sudo chown -R $USER:$USER /var/www/zapbot
cd /var/www/zapbot
```

### 5. Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar configurações
nano .env
```

**Configure no arquivo .env:**

```env
# Banco de dados
DATABASE_URL="mysql://zapbot_user:sua_senha_forte_aqui@localhost:3306/zapbot_db"
DB_HOST=localhost
DB_PORT=3306
DB_USER=zapbot_user
DB_PASS=sua_senha_forte_aqui
DB_NAME=zapbot_db

# NextAuth (gere uma chave segura)
NEXTAUTH_SECRET="sua_chave_secreta_de_32_caracteres_ou_mais"
NEXTAUTH_URL="http://seu-dominio.com"

# Email (Gmail)
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=seu-email@gmail.com
EMAIL_SERVER_PASSWORD=sua_senha_de_app_gmail
EMAIL_FROM=seu-email@gmail.com

# Aplicação
NODE_ENV=production
PORT=3000
NEXT_TELEMETRY_DISABLED=1
```

### 6. Instalar Dependências do Projeto

```bash
# Instalar dependências
npm install

# Instalar PM2 globalmente (gerenciador de processos)
sudo npm install -g pm2
```

### 7. Configurar Banco de Dados

```bash
# Gerar cliente Prisma
npx prisma generate

# Executar migrações
npx prisma migrate deploy

# (Opcional) Executar seeds
npm run seed
```

### 8. Build da Aplicação

```bash
# Fazer build de produção
npm run build

# Testar se funciona
npm start
```

### 9. Configurar PM2 (Gerenciador de Processos)

```bash
# Criar arquivo de configuração do PM2
nano ecosystem.config.js
```

**Conteúdo do ecosystem.config.js:**

```javascript
module.exports = {
  apps: [{
    name: 'zapbot',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/zapbot',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/zapbot/error.log',
    out_file: '/var/log/zapbot/out.log',
    log_file: '/var/log/zapbot/combined.log'
  }]
};
```

```bash
# Criar diretório de logs
sudo mkdir -p /var/log/zapbot
sudo chown -R $USER:$USER /var/log/zapbot

# Iniciar aplicação com PM2
pm2 start ecosystem.config.js

# Configurar PM2 para iniciar no boot
pm2 startup
pm2 save
```

### 10. Instalar e Configurar Nginx

```bash
# Instalar Nginx
sudo apt install -y nginx

# Criar configuração do site
sudo nano /etc/nginx/sites-available/zapbot
```

**Configuração do Nginx:**

```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;
    
    # Redirecionar para HTTPS (após configurar SSL)
    # return 301 https://$server_name$request_uri;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Arquivos estáticos
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Logs
    access_log /var/log/nginx/zapbot_access.log;
    error_log /var/log/nginx/zapbot_error.log;
}
```

```bash
# Ativar site
sudo ln -s /etc/nginx/sites-available/zapbot /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx

# Habilitar Nginx no boot
sudo systemctl enable nginx
```

### 11. Configurar SSL com Let's Encrypt (Opcional)

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obter certificado SSL
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com

# Configurar renovação automática
sudo crontab -e
```

**Adicionar ao crontab:**

```bash
0 12 * * * /usr/bin/certbot renew --quiet
```

### 12. Configurar Firewall

```bash
# Instalar UFW
sudo apt install -y ufw

# Configurar regras básicas
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Permitir SSH
sudo ufw allow ssh

# Permitir HTTP e HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Ativar firewall
sudo ufw enable

# Verificar status
sudo ufw status
```

### 13. Configurar Backup Automático

```bash
# Criar script de backup
sudo nano /usr/local/bin/backup-zapbot.sh
```

**Conteúdo do script:**

```bash
#!/bin/bash

# Configurações
BACKUP_DIR="/var/backups/zapbot"
DATE=$(date +"%Y%m%d_%H%M%S")
DB_NAME="zapbot_db"
DB_USER="zapbot_user"
DB_PASS="sua_senha_forte_aqui"
APP_DIR="/var/www/zapbot"

# Criar diretório de backup
mkdir -p $BACKUP_DIR

# Backup do banco de dados
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# Backup dos arquivos da aplicação
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz -C $APP_DIR .

# Remover backups antigos (manter apenas 7 dias)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup concluído: $DATE"
```

```bash
# Tornar executável
sudo chmod +x /usr/local/bin/backup-zapbot.sh

# Configurar backup automático (diário às 2h)
sudo crontab -e
```

**Adicionar ao crontab:**

```bash
0 2 * * * /usr/local/bin/backup-zapbot.sh >> /var/log/zapbot-backup.log 2>&1
```

## ✅ Verificação Final

### 1. Testar Serviços

```bash
# Verificar status do MySQL
sudo systemctl status mysql

# Verificar status do Nginx
sudo systemctl status nginx

# Verificar aplicação PM2
pm2 status

# Verificar logs
pm2 logs zapbot
```

### 2. Testar Aplicação

```bash
# Testar conexão local
curl http://localhost:3000

# Testar via domínio
curl http://seu-dominio.com
```

### 3. Acessos

- **Aplicação**: http://seu-dominio.com
- **Logs da aplicação**: `pm2 logs zapbot`
- **Logs do Nginx**: `/var/log/nginx/zapbot_*.log`
- **Logs do sistema**: `/var/log/syslog`

## 🔧 Comandos de Manutenção

### Gerenciar Aplicação

```bash
# Parar aplicação
pm2 stop zapbot

# Iniciar aplicação
pm2 start zapbot

# Reiniciar aplicação
pm2 restart zapbot

# Ver logs em tempo real
pm2 logs zapbot --lines 100

# Monitorar recursos
pm2 monit
```

### Atualizar Aplicação

```bash
# Ir para diretório da aplicação
cd /var/www/zapbot

# Fazer backup antes da atualização
sudo /usr/local/bin/backup-zapbot.sh

# Puxar atualizações
git pull origin main

# Instalar novas dependências
npm install

# Executar migrações (se houver)
npx prisma migrate deploy

# Rebuild
npm run build

# Reiniciar aplicação
pm2 restart zapbot
```

### Monitoramento

```bash
# Verificar uso de recursos
htop

# Verificar espaço em disco
df -h

# Verificar logs de erro
tail -f /var/log/nginx/zapbot_error.log
tail -f /var/log/zapbot/error.log
```

## 🚨 Troubleshooting

### Problemas Comuns

#### 1. Aplicação não inicia

```bash
# Verificar logs
pm2 logs zapbot

# Verificar configuração
cat .env

# Testar conexão com banco
npx prisma db push
```

#### 2. Erro de conexão com banco

```bash
# Verificar se MySQL está rodando
sudo systemctl status mysql

# Testar conexão
mysql -u zapbot_user -p zapbot_db

# Verificar configurações no .env
```

#### 3. Nginx não funciona

```bash
# Verificar configuração
sudo nginx -t

# Ver logs de erro
sudo tail -f /var/log/nginx/error.log

# Reiniciar serviço
sudo systemctl restart nginx
```

## 📞 Suporte

Se encontrar problemas durante a instalação:

1. Verifique os logs de cada serviço
2. Consulte a documentação oficial
3. Abra uma issue no repositório do projeto

---

**Nota**: Este guia assume um ambiente de produção. Para desenvolvimento, você pode pular algumas etapas como SSL e firewall.