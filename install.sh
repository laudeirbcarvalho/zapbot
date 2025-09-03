#!/bin/bash

# Script de instalação do ZapBot
# Automatiza o processo de setup da aplicação

set -e

echo "🚀 Iniciando instalação do ZapBot..."

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não encontrado. Por favor, instale o Docker primeiro."
    echo "   Visite: https://docs.docker.com/get-docker/"
    exit 1
fi

# Verificar se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não encontrado. Por favor, instale o Docker Compose primeiro."
    echo "   Visite: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker e Docker Compose encontrados!"

# Criar arquivo .env se não existir
if [ ! -f .env ]; then
    echo "📝 Criando arquivo .env..."
    cat > .env << EOL
# Configurações da aplicação
NODE_ENV=production
PORT=3000

# Adicione suas variáveis de ambiente aqui
# DATABASE_URL=
# API_KEY=
EOL
    echo "✅ Arquivo .env criado! Configure suas variáveis de ambiente."
else
    echo "✅ Arquivo .env já existe."
fi

# Build da imagem Docker
echo "🔨 Construindo imagem Docker..."
docker-compose build

# Iniciar os serviços
echo "🚀 Iniciando serviços..."
docker-compose up -d

# Aguardar a aplicação ficar pronta
echo "⏳ Aguardando aplicação ficar pronta..."
sleep 10

# Verificar se a aplicação está rodando
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ ZapBot instalado e rodando com sucesso!"
    echo "🌐 Acesse: http://localhost:3000"
    echo "📊 Health Check: http://localhost:3000/api/health"
else
    echo "⚠️  Aplicação pode estar ainda inicializando..."
    echo "🔍 Verifique os logs com: docker-compose logs -f"
fi

echo ""
echo "📋 Comandos úteis:"
echo "   Parar:     docker-compose down"
echo "   Logs:      docker-compose logs -f"
echo "   Rebuild:   docker-compose build --no-cache"
echo "   Status:    docker-compose ps"
echo ""
echo "🎉 Instalação concluída!"