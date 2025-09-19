import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      dbUserId?: number
      name?: string | null
      email?: string | null
      image?: string | null
      authProvider?: string
      currentPlan?: string
    }
  }

  interface User {
    id: string
    dbUserId?: number
    name?: string | null
    email?: string | null
    image?: string | null
    authProvider?: string
    currentPlan?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string
    dbUserId?: number
    authProvider?: string
    currentPlan?: string
  }
}