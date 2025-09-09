@echo off
echo ========================================
echo     ZapBot - Configuracao do Banco
echo ========================================
echo.

REM Verificar se Docker esta instalado
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker nao encontrado!
    echo.
    echo Para instalar o Docker:
    echo 1. Acesse: https://www.docker.com/products/docker-desktop/
    echo 2. Baixe e instale o Docker Desktop para Windows
    echo 3. Reinicie o computador
    echo 4. Execute este script novamente
    echo.
    pause
    exit /b 1
)

echo ✅ Docker encontrado!
echo.

REM Verificar se Docker esta rodando
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker nao esta rodando!
    echo.
    echo Por favor:
    echo 1. Inicie o Docker Desktop
    echo 2. Aguarde ate que esteja completamente carregado
    echo 3. Execute este script novamente
    echo.
    pause
    exit /b 1
)

echo ✅ Docker esta rodando!
echo.

REM Parar containers existentes
echo 🔄 Parando containers existentes...
docker-compose down >nul 2>&1

REM Iniciar MySQL
echo 🚀 Iniciando banco MySQL...
docker-compose up -d mysql

if %errorlevel% neq 0 (
    echo ❌ Erro ao iniciar MySQL!
    pause
    exit /b 1
)

echo ✅ MySQL iniciado com sucesso!
echo.

REM Aguardar MySQL ficar pronto
echo ⏳ Aguardando MySQL ficar pronto...
timeout /t 30 /nobreak >nul

REM Gerar cliente Prisma
echo 🔧 Gerando cliente Prisma...
npx prisma generate

if %errorlevel% neq 0 (
    echo ❌ Erro ao gerar cliente Prisma!
    pause
    exit /b 1
)

REM Executar migracoes
echo 📊 Executando migracoes do banco...
npx prisma migrate dev --name init

if %errorlevel% neq 0 (
    echo ❌ Erro ao executar migracoes!
    echo.
    echo Tentando fazer push do schema...
    npx prisma db push
    
    if %errorlevel% neq 0 (
        echo ❌ Erro ao fazer push do schema!
        pause
        exit /b 1
    )
)

REM Inserir dados ficticios
echo 🌱 Inserindo dados ficticios...
node scripts/seed-test-data.js

if %errorlevel% neq 0 (
    echo ❌ Erro ao inserir dados ficticios!
    pause
    exit /b 1
)

echo.
echo 🎉 Configuracao concluida com sucesso!
echo.
echo 📋 Informacoes do banco:
echo - Host: localhost
echo - Porta: 3306
echo - Banco: zapbot
echo - Usuario: zapbot_user
echo - Senha: zapbot_pass_2024
echo.
echo 🔑 Usuarios criados:
echo - Super Admin: admin@zapbot.com (senha: 123456)
echo - Admin 1: admin1@empresa.com (senha: 123456)
echo - Admin 2: admin2@empresa.com (senha: 123456)
echo - Gerente 1: gerente1@empresa.com (senha: 123456)
echo - Gerente 2: gerente2@empresa.com (senha: 123456)
echo.
echo ✅ O banco MySQL esta rodando e pronto para uso!
echo.
pause
