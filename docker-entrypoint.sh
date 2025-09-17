#!/bin/sh

# Script de inicialização para ZapBot
echo "🚀 Iniciando ZapBot..."

# Aguardar o banco de dados estar disponível
echo "⏳ Aguardando banco de dados..."
until npx prisma db push --accept-data-loss 2>/dev/null; do
  echo "⏳ Banco de dados não está pronto - aguardando..."
  sleep 2
done

echo "✅ Banco de dados conectado!"

# Executar migrações
echo "🔄 Executando migrações do banco de dados..."
npx prisma migrate deploy

# Gerar cliente Prisma
echo "🔧 Gerando cliente Prisma..."
npx prisma generate

# Executar seeds se necessário
echo "🌱 Executando seeds..."
if [ -f "scripts/seed-all-defaults.js" ]; then
  node scripts/seed-all-defaults.js
else
  echo "⚠️  Arquivo de seed não encontrado, pulando..."
fi

# Executar seed de integrações
if [ -f "scripts/seed-integrations.js" ]; then
  node scripts/seed-integrations.js
else
  echo "⚠️  Seed de integrações não encontrado, pulando..."
fi

# Executar seed de departamentos
if [ -f "scripts/seed-departments.js" ]; then
  node scripts/seed-departments.js
else
  echo "⚠️  Seed de departamentos não encontrado, pulando..."
fi

# Executar seed de posições
if [ -f "scripts/seed-positions.js" ]; then
  node scripts/seed-positions.js
else
  echo "⚠️  Seed de posições não encontrado, pulando..."
fi

# Executar seed de funções
if [ -f "scripts/seed-functions.js" ]; then
  node scripts/seed-functions.js
else
  echo "⚠️  Seed de funções não encontrado, pulando..."
fi

echo "✅ Inicialização concluída!"
echo "🌐 Iniciando servidor na porta 3000..."

# Iniciar a aplicação
exec node server.js