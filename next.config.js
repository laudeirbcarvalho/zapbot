/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuração para build standalone (necessário para Docker)
  output: 'standalone',
  
  // Configurações de imagem
  images: {
    domains: ['localhost'],
  },
  
  // Configurações experimentais
  experimental: {
    // Otimizações para produção
    optimizeCss: true,
  },
  
  // Configurações de compilação
  compiler: {
    // Remove console.log em produção
    removeConsole: process.env.NODE_ENV === 'production',
  },
}

module.exports = nextConfig