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
      async authorize(credentials, req) {
        console.log('[Authorize] Tentativa de login recebida:', { email: credentials?.email });
        
        if (!credentials?.email || !credentials?.password) {
          console.log('[Authorize] Credenciais ausentes.');
          return null
        }

        try {
          console.log('[Authorize] Conectando ao DB...');
          await dbConnect()
          console.log('[Authorize] Conexão DB estabelecida.');
        } catch (error) {
          console.error('[Authorize] Falha ao conectar com o MongoDB:', error)
          // ... (fallback dev omitido)
          return null
        }

        try {
          console.log(`[Authorize] Buscando usuário: ${credentials.email}`);
          const user = await User.findOne({ email: credentials.email }).select('+password')
          
          if (!user) {
            console.log(`[Authorize] Usuário ${credentials.email} não encontrado.`);
             // ... (fallback dev omitido)
            return null
          }
          
          console.log(`[Authorize] Usuário encontrado: ${user.email}. Comparando senha...`);
          const isPasswordMatch = await user.comparePassword(credentials.password)
          console.log(`[Authorize] Senha corresponde? ${isPasswordMatch}`);
          
          if (!isPasswordMatch) {
             console.log(`[Authorize] Senha inválida para ${user.email}.`);
            return null
          }
          
          console.log(`[Authorize] Autenticação bem-sucedida para ${user.email}. Retornando dados do usuário.`);
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
            permissions: user.permissions
          }
        } catch (error) {
          console.error('[Authorize] Erro durante busca/comparação de senha:', error)
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
      console.log('[NextAuth] Callback JWT:', { 
        tokenExists: !!token, 
        userExists: !!user 
      });
      
      if (user) {
        console.log('[NextAuth] Atualizando token com dados do usuário:', { 
          id: user.id, 
          role: user.role 
        });
        token.id = user.id
        token.role = user.role
        token.department = user.department
        token.permissions = user.permissions
      }
      return token
    },
    async session({ session, token }) {
      console.log('[NextAuth] Callback Session:', { 
        sessionExists: !!session, 
        tokenExists: !!token 
      });
      
      if (session.user && token) {
        console.log('[NextAuth] Atualizando sessão com dados do token');
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
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      }
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      }
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      }
    }
  },
  secret: process.env.NEXTAUTH_SECRET || 'um-segredo-temporario-para-desenvolvimento-local',
  debug: true, // Ativando debug para rastrear problemas de autenticação
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST } 