import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      userType: string
      isSuperAdmin: boolean
    }
  }

  interface User {
    id: string
    name?: string | null
    email?: string | null
    userType: string
    isSuperAdmin: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    userType: string
    isSuperAdmin: boolean
  }
}