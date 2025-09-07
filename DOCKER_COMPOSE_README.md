# 🐳 ZapBot - Guia Completo Docker Compose

Este guia fornece instruções completas para executar o ZapBot usando Docker Compose com todos os serviços necessários.

## 📋 O que está incluído

- **ZapBot**: Aplicação principal Next.js
- **MySQL**: Banco de dados
- **phpMyAdmin**: Interface web para gerenciar o MySQL (opcional)
- **Nginx**: Proxy reverso com SSL e otimizações (opcional)

## 🚀 Início Rápido

### 1. Preparar o ambiente

```bash
# Clone o repositório (se ainda não fez)
git clone <seu-repositorio>
cd zapbot

# Copie o arquivo de exemplo
cp .env.example .env
```

### 2. Configurar variáveis de ambiente

Edite o arquivo `.env` e configure as seguintes variáveis essenciais:

```env
# Banco de dados (mantenha as configurações padrão para Docker)
MYSQL_ROOT_PASSWORD=zapbot_root_2024
MYSQL_DATABASE=zapbot_db
MYSQL_USER=zapbot_user
MYSQL_PASSWORD=zapbot_pass_2024
DATABASE_URL="mysql://zapbot_user:zapbot_pass_2024@mysql:3306/zapbot_db"

# NextAuth (OBRIGATÓRIO - gere uma chave segura)
NEXTAUTH_SECRET=sua_chave_secreta_muito_segura_aqui
NEXTAUTH_URL=http://localhost:3000

# Email (para recuperação de senha)
EMAIL_SERVER_USER=seu_email@gmail.com
EMAIL_SERVER_PASSWORD=sua_senha_de_app_gmail
EMAIL_FROM=seu_email@gmail.com
```

### 3. Executar com Docker Compose

```bash
# Iniciar todos os serviços
docker-compose up -d

# Verificar se os serviços estão rodando
docker-compose ps

# Ver logs em tempo real
docker-compose logs -f
```

### 4. Acessar a aplicação

- **ZapBot**: http://localhost:3000
- **phpMyAdmin**: http://localhost:8080
  - Servidor: `mysql`
  - Usuário: `zapbot_user`
  - Senha: `zapbot_pass_2024`

## 📁 Estrutura dos Arquivos

```
zapbot/
├── docker-compose.yml     # Configuração principal
├── Dockerfile            # Build da aplicação
├── nginx.conf           # Configuração do Nginx
├── .env.example         # Exemplo de variáveis
├── .env                 # Suas configurações (criar)
└── DOCKER_COMPOSE_README.md
```

## 🔧 Configurações Avançadas

### Cenários de Uso

#### 1. Desenvolvimento (Básico)
```bash
# Apenas ZapBot + MySQL
docker-compose up zapbot mysql
```

#### 2. Desenvolvimento com phpMyAdmin
```bash
# ZapBot + MySQL + phpMyAdmin
docker-compose up zapbot mysql phpmyadmin
```

#### 3. Produção Completa
```bash
# Todos os serviços incluindo Nginx
docker-compose up -d
```

### Personalizar Portas

No arquivo `.env`, você pode alterar as portas:

```env
# Porta do phpMyAdmin (padrão: 8080)
PMA_PORT=8080

# Portas do Nginx (padrão: 80 e 443)
NGINX_HTTP_PORT=80
NGINX_HTTPS_PORT=443
```

## 🛠️ Comandos Úteis

### Gerenciamento dos Serviços

```bash
# Parar todos os serviços
docker-compose down

# Parar e remover volumes (CUIDADO: apaga dados do banco)
docker-compose down -v

# Rebuild da aplicação
docker-compose build zapbot

# Restart de um serviço específico
docker-compose restart zapbot

# Ver logs de um serviço específico
docker-compose logs -f zapbot
```

### Banco de Dados

```bash
# Backup do banco
docker-compose exec mysql mysqldump -u zapbot_user -p zapbot_db > backup.sql

# Restaurar backup
docker-compose exec -T mysql mysql -u zapbot_user -p zapbot_db < backup.sql

# Acessar MySQL via linha de comando
docker-compose exec mysql mysql -u zapbot_user -p zapbot_db
```

### Aplicação

```bash
# Executar migrações do Prisma
docker-compose exec zapbot npx prisma migrate deploy

# Gerar cliente Prisma
docker-compose exec zapbot npx prisma generate

# Acessar shell da aplicação
docker-compose exec zapbot sh
```

## 🔒 Configuração SSL (Nginx)

Para usar HTTPS em produção:

### 1. Certificados Let's Encrypt

```bash
# Criar diretório para certificados
mkdir -p ./ssl

# Usar certbot para gerar certificados
docker run --rm -v "$PWD/ssl:/etc/letsencrypt" \
  certbot/certbot certonly --standalone \
  -d seu-dominio.com
```

### 2. Certificados Próprios

```bash
# Gerar certificado auto-assinado (desenvolvimento)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ./ssl/key.pem \
  -out ./ssl/cert.pem
```

### 3. Atualizar nginx.conf

Edite o arquivo `nginx.conf` e ajuste os caminhos dos certificados:

```nginx
ssl_certificate /etc/nginx/ssl/cert.pem;
ssl_certificate_key /etc/nginx/ssl/key.pem;
```

## 📊 Monitoramento

### Health Checks

```bash
# Verificar saúde dos serviços
docker-compose ps

# Testar endpoint de saúde
curl http://localhost/health
```

### Logs

```bash
# Logs de todos os serviços
docker-compose logs

# Logs em tempo real
docker-compose logs -f

# Logs de um serviço específico
docker-compose logs nginx
```

## 🚨 Troubleshooting

### Problemas Comuns

#### 1. Erro de conexão com banco
```bash
# Verificar se o MySQL está rodando
docker-compose ps mysql

# Ver logs do MySQL
docker-compose logs mysql

# Testar conexão
docker-compose exec zapbot npx prisma db push
```

#### 2. Porta já em uso
```bash
# Verificar portas em uso
netstat -tulpn | grep :3000

# Alterar porta no .env
PORT=3001
```

#### 3. Problemas de permissão
```bash
# Rebuild com --no-cache
docker-compose build --no-cache

# Limpar volumes órfãos
docker volume prune
```

### Reset Completo

```bash
# CUIDADO: Remove tudo (dados, imagens, volumes)
docker-compose down -v --rmi all
docker system prune -a
docker-compose up -d
```

## 🔐 Segurança em Produção

### Checklist de Segurança

- [ ] Alterar todas as senhas padrão
- [ ] Configurar HTTPS com certificados válidos
- [ ] Configurar firewall (apenas portas 80, 443)
- [ ] Usar senhas fortes para banco de dados
- [ ] Configurar backup automático
- [ ] Monitorar logs de segurança
- [ ] Atualizar regularmente as imagens Docker

### Variáveis Sensíveis

```env
# Use senhas fortes e únicas
MYSQL_ROOT_PASSWORD=senha_muito_forte_e_unica
MYSQL_PASSWORD=outra_senha_forte_e_unica
NEXTAUTH_SECRET=chave_secreta_de_32_caracteres_ou_mais
```

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs: `docker-compose logs`
2. Consulte a documentação do projeto
3. Abra uma issue no repositório

---

**Nota**: Este setup é otimizado para facilidade de uso. Para ambientes de produção de alta escala, considere usar Kubernetes ou Docker Swarm.