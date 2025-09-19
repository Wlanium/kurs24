// 👑 Royal Academy K.I. - NextAuth.js API Route
import NextAuth, { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'

const authOptions: NextAuthOptions = {
  providers: [
    // Google OAuth Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // Email/Password Provider
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        // TODO: Database lookup implementation
        // const user = await getUserByEmail(credentials.email)
        // const isValidPassword = await bcrypt.compare(credentials.password, user.password_hash)

        // Placeholder implementation
        console.log('🔐 Login attempt:', credentials.email)

        return {
          id: '1',
          email: credentials.email,
          name: 'Test User',
          image: null
        }
      }
    })
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        if (account?.provider === 'google') {
          console.log('🔐 Google OAuth sign-in:', user.email)

          // TODO: Store user in database
          // await createOrUpdateUser({
          //   email: user.email,
          //   name: user.name,
          //   google_id: account.providerAccountId,
          //   auth_provider: 'google'
          // })
        }
        return true
      } catch (error) {
        console.error('SignIn callback error:', error)
        return false
      }
    },

    async jwt({ token, user, account, trigger }) {
      const backendUrl = process.env.BACKEND_API_URL || 'https://api.kurs24.io'

      // When user first logs in, get their database user ID
      if (user) {
        token.authProvider = account?.provider || 'credentials'

        // Get the actual database user_id
        try {
          const email = user.email
          if (email) {
            // First check if user exists, if not create them
            const checkResponse = await fetch(`${backendUrl}/api/v1/users/email/${encodeURIComponent(email)}/id`)
            if (checkResponse.ok) {
              const userData = await checkResponse.json()
              token.userId = userData.user_id
              token.dbUserId = userData.user_id // Store numeric database ID
            } else if (checkResponse.status === 404) {
              // User doesn't exist, create them
              const createResponse = await fetch(`${backendUrl}/api/v1/users/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  email: email,
                  name: user.name || 'User',
                  auth_provider: account?.provider || 'google'
                })
              })
              if (createResponse.ok) {
                const newUser = await createResponse.json()
                token.userId = newUser.id
                token.dbUserId = newUser.id
              }
            }
          }
        } catch (error) {
          console.error('Failed to get/create user ID:', error)
          token.userId = user.id // Fallback to provider ID
        }
      }

      // Always fetch current plan using the database user ID
      try {
        const dbUserId = token.dbUserId || token.userId

        if (dbUserId && typeof dbUserId === 'number') {
          const response = await fetch(`${backendUrl}/api/v1/users/${dbUserId}/plan`)
          if (response.ok) {
            const data = await response.json()
            token.currentPlan = data.plan || 'free'
          } else {
            token.currentPlan = 'free'
          }
        }
      } catch (error) {
        console.error('Failed to fetch user plan:', error)
        token.currentPlan = 'free'
      }

      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string
        session.user.dbUserId = token.dbUserId as number // Database user ID
        session.user.authProvider = token.authProvider as string
        session.user.currentPlan = token.currentPlan as string
      }
      return session
    }
  },

  pages: {
    signIn: '/auth/login',
    error: '/auth/error'
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }