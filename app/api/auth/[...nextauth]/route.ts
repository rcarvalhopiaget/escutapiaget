import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import dbConnect from '@/lib/mongodb'
import User from '@/lib/models/user'
import { IUser } from '@/lib/models/user'

// Ampliando a typagem para incluir novos campos
declare module "next-auth" {
  interface User {
    id: string
    name?: string | null
    email?: string | null
    role: string | null
    department: string | null
    permissions?: {
      viewTickets?: boolean
      respondTickets?: boolean
      editTickets?: boolean
      deleteTickets?: boolean
      manageUsers?: boolean
      viewDashboard?: boolean
      viewAllDepartments?: boolean
    }
  }

  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      role?: string | null
      department?: string | null
      permissions?: {
        viewTickets?: boolean
        respondTickets?: boolean
        editTickets?: boolean
        deleteTickets?: boolean
        manageUsers?: boolean
        viewDashboard?: boolean
        viewAllDepartments?: boolean
      }
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string | null
    department: string | null
    permissions?: {
      viewTickets?: boolean
      respondTickets?: boolean
      editTickets?: boolean
      deleteTickets?: boolean
      manageUsers?: boolean
      viewDashboard?: boolean
      viewAllDepartments?: boolean
    }
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credenciais',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          await dbConnect()
        } catch (error) {
          console.error('Falha ao conectar com o MongoDB:', error)
          // Se estivermos em desenvolvimento, permitir um login de teste
          if (process.env.NODE_ENV === 'development') {
            if (credentials.email === 'admin@example.com' && credentials.password === 'password') {
              return {
                id: '1',
                name: 'Admin (Desenvolvimento)',
                email: 'admin@example.com',
                role: 'admin',
                department: 'diretoria',
                permissions: {
                  viewTickets: true,
                  respondTickets: true,
                  editTickets: true,
                  deleteTickets: true,
                  manageUsers: true,
                  viewDashboard: true,
                  viewAllDepartments: true
                }
              }
            }
          }
          return null
        }

        try {
          // Explicitamente seleciona o campo password
          const user = await User.findOne({ email: credentials.email }).select('+password')
          
          if (!user) {
            // Para desenvolvimento, permitir um login de teste se a tabela estiver vazia
            if (process.env.NODE_ENV === 'development') {
              const userCount = await User.countDocuments({})
              if (userCount === 0 && credentials.email === 'admin@example.com' && credentials.password === 'password') {
                return {
                  id: '1',
                  name: 'Admin (Desenvolvimento)',
                  email: 'admin@example.com',
                  role: 'admin',
                  department: 'diretoria',
                  permissions: {
                    viewTickets: true,
                    respondTickets: true,
                    editTickets: true,
                    deleteTickets: true,
                    manageUsers: true,
                    viewDashboard: true,
                    viewAllDepartments: true
                  }
                }
              }
            }
            return null
          }
          
          const isPasswordMatch = await user.comparePassword(credentials.password)
          
          if (!isPasswordMatch) {
            return null
          }
          
          // Retorna objeto sem o campo password
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
            permissions: user.permissions
          }
        } catch (error) {
          console.error('Erro na autenticação:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 horas
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.department = user.department
        token.permissions = user.permissions
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string | null
        session.user.department = token.department as string | null
        session.user.permissions = token.permissions
      }
      return session
    }
  },
  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
    signOut: '/',
  },
  secret: process.env.NEXTAUTH_SECRET || 'um-segredo-temporario-para-desenvolvimento-local',
  debug: process.env.NODE_ENV === 'development',
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST } 