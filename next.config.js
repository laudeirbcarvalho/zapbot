/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@prisma/client', 'bcrypt'],
  images: {
    domains: ['localhost'],
    unoptimized: true
  }
}

module.exports = nextConfig