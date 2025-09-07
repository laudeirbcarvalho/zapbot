# Script de instalação do ZapBot para Windows
# Automatiza o processo de setup da aplicação

Write-Host "🚀 Iniciando instalação do ZapBot..." -ForegroundColor Green

# Verificar se Docker está instalado
try {
    docker --version | Out-Null
    Write-Host "✅ Docker encontrado!" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker não encontrado. Por favor, instale o Docker Desktop primeiro." -ForegroundColor Red
    Write-Host "   Visite: https://docs.docker.com/desktop/windows/" -ForegroundColor Yellow
    exit 1
}

# Verificar se Docker Compose está disponível
try {
    docker-compose --version | Out-Null
    Write-Host "✅ Docker Compose encontrado!" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose não encontrado." -ForegroundColor Red
    exit 1
}

# Criar arquivo .env se não existir
if (-not (Test-Path ".env")) {
    Write-Host "📝 Criando arquivo .env..." -ForegroundColor Yellow
    @"
# Configurações da aplicação
NODE_ENV=production
PORT=3000

# Adicione suas variáveis de ambiente aqui
# DATABASE_URL=
# API_KEY=
"@ | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "✅ Arquivo .env criado! Configure suas variáveis de ambiente." -ForegroundColor Green
} else {
    Write-Host "✅ Arquivo .env já existe." -ForegroundColor Green
}

# Build da imagem Docker
Write-Host "🔨 Construindo imagem Docker..." -ForegroundColor Yellow
docker-compose build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao construir a imagem Docker." -ForegroundColor Red
    exit 1
}

# Iniciar os serviços
Write-Host "🚀 Iniciando serviços..." -ForegroundColor Yellow
docker-compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao iniciar os serviços." -ForegroundColor Red
    exit 1
}

# Aguardar a aplicação ficar pronta
Write-Host "⏳ Aguardando aplicação ficar pronta..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Verificar se a aplicação está rodando
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ ZapBot instalado e rodando com sucesso!" -ForegroundColor Green
        Write-Host "🌐 Acesse: http://localhost:3000" -ForegroundColor Cyan
        Write-Host "📊 Health Check: http://localhost:3000/api/health" -ForegroundColor Cyan
    }
} catch {
    Write-Host "⚠️  Aplicação pode estar ainda inicializando..." -ForegroundColor Yellow
    Write-Host "🔍 Verifique os logs com: docker-compose logs -f" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📋 Comandos úteis:" -ForegroundColor Cyan
Write-Host "   Parar:     docker-compose down" -ForegroundColor White
Write-Host "   Logs:      docker-compose logs -f" -ForegroundColor White
Write-Host "   Rebuild:   docker-compose build --no-cache" -ForegroundColor White
Write-Host "   Status:    docker-compose ps" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Instalação concluída!" -ForegroundColor Green