/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  serverExternalPackages: ['@prisma/client', 'bcrypt'],
  images: {
    domains: ['localhost'],
    unoptimized: true
  }
}

module.exports = nextConfig