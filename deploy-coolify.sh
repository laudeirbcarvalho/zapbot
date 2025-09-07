#!/bin/bash

# Script de Deploy Automatizado para Coolify
# ZapBot - Sistema de Automação WhatsApp

set -e

echo "🚀 Iniciando deploy do ZapBot no Coolify..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    log_error "Este script deve ser executado no diretório raiz do projeto ZapBot"
    exit 1
fi

log_info "Verificando arquivos necessários..."

# Verificar arquivos essenciais
required_files=("Dockerfile" "package.json" "next.config.js" ".env.example")
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        log_error "Arquivo necessário não encontrado: $file"
        exit 1
    fi
done

log_success "Todos os arquivos necessários encontrados"

# Verificar se o .env existe
if [ ! -f ".env" ]; then
    log_warning "Arquivo .env não encontrado"
    log_info "Copiando .env.example para .env..."
    cp .env.example .env
    log_warning "IMPORTANTE: Configure as variáveis de ambiente no arquivo .env antes do deploy!"
fi

# Verificar configuração do next.config.js
log_info "Verificando configuração do Next.js..."
if grep -q "output: 'standalone'" next.config.js; then
    log_success "Configuração standalone encontrada no next.config.js"
else
    log_error "Configuração 'output: standalone' não encontrada no next.config.js"
    log_info "Adicionando configuração standalone..."
    
    # Backup do arquivo original
    cp next.config.js next.config.js.backup
    
    # Adicionar configuração standalone se não existir
    sed -i '/const nextConfig = {/a\  output: "standalone",' next.config.js
    
    log_success "Configuração standalone adicionada"
fi

# Verificar dependências
log_info "Verificando dependências..."
if [ ! -d "node_modules" ]; then
    log_info "Instalando dependências..."
    npm install
    log_success "Dependências instaladas"
else
    log_success "Dependências já instaladas"
fi

# Testar build local
log_info "Testando build da aplicação..."
if npm run build; then
    log_success "Build realizado com sucesso"
else
    log_error "Falha no build da aplicação"
    exit 1
fi

# Verificar se o Prisma está configurado
if [ -f "prisma/schema.prisma" ]; then
    log_info "Gerando cliente Prisma..."
    npx prisma generate
    log_success "Cliente Prisma gerado"
fi

# Criar arquivo de configuração para Coolify se não existir
if [ ! -f "coolify.json" ]; then
    log_info "Criando arquivo de configuração do Coolify..."
    cat > coolify.json << 'EOF'
{
  "name": "ZapBot",
  "description": "Sistema de automação e gestão de leads com WhatsApp",
  "type": "application",
  "build": {
    "buildpack": "dockerfile",
    "dockerfile": "Dockerfile",
    "context": "."
  },
  "deploy": {
    "port": 3000,
    "healthcheck": {
      "path": "/api/health",
      "port": 3000,
      "interval": 30,
      "timeout": 10,
      "retries": 3
    }
  },
  "environment": {
    "NODE_ENV": "production",
    "PORT": "3000",
    "NEXT_TELEMETRY_DISABLED": "1"
  }
}
EOF
    log_success "Arquivo coolify.json criado"
fi

# Verificar se o repositório Git está limpo
if git status --porcelain | grep -q .; then
    log_warning "Existem alterações não commitadas no repositório"
    log_info "Commitando alterações..."
    
    git add .
    git commit -m "feat: Preparação para deploy no Coolify
    
    - Configuração standalone do Next.js
    - Arquivo de configuração do Coolify
    - Scripts de deploy automatizado"
    
    log_success "Alterações commitadas"
fi

# Push para o repositório
log_info "Enviando alterações para o repositório..."
if git push; then
    log_success "Alterações enviadas para o repositório"
else
    log_warning "Falha ao enviar alterações. Verifique a configuração do Git."
fi

echo ""
log_success "🎉 Preparação para deploy concluída!"
echo ""
log_info "Próximos passos:"
echo "1. Acesse o painel do Coolify"
echo "2. Crie uma nova aplicação"
echo "3. Configure o repositório Git"
echo "4. Configure as variáveis de ambiente:"
echo "   - DATABASE_URL"
echo "   - NEXTAUTH_SECRET"
echo "   - NEXTAUTH_URL"
echo "   - DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME"
echo "   - EMAIL_* (opcional)"
echo "5. Inicie o deploy"
echo ""
log_info "📖 Consulte o arquivo COOLIFY_DEPLOY_GUIDE.md para instruções detalhadas"
echo ""
log_success "✨ ZapBot pronto para deploy no Coolify!"