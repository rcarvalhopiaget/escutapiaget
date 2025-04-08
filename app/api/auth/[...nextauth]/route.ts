import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from "next-auth/providers/google"
import dbConnect from '@/lib/mongodb'
import User from '@/lib/models/user'
import { IUser } from '@/lib/models/user'

/**
 * Extensão dos tipos do NextAuth para incluir campos personalizados
 */
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

/**
 * Detecta a URL base da aplicação para produção ou desenvolvimento
 */
function getBaseUrl() {
  // Verificar se NEXTAUTH_URL está definido
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }
  
  // Verificar ambiente de produção (Railway, Vercel, etc)
  if (process.env.RAILWAY_STATIC_URL) {
    return `https://${process.env.RAILWAY_STATIC_URL}`;
  }
  
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Em desenvolvimento, usar localhost
  return 'http://localhost:3000';
}

/**
 * Configuração do NextAuth para autenticação
 */
export const authOptions: NextAuthOptions = {
  providers: [
    // Provedor de autenticação Google
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    
    // Provedor de autenticação com credenciais (email/senha)
    CredentialsProvider({
      name: 'Credenciais',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' }
      },
      async authorize(credentials, req) {
        // Verifica se as credenciais foram fornecidas
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Conecta ao banco de dados
          await dbConnect()
        } catch (error) {
          console.error('Falha ao conectar com o MongoDB:', error)
          return null
        }

        try {
          // Busca o usuário pelo email
          const user = await User.findOne({ email: credentials.email }).select('+password')
          
          if (!user) {
            return null
          }
          
          // Verifica se a senha está correta
          const isPasswordMatch = await user.comparePassword(credentials.password)
          
          if (!isPasswordMatch) {
            return null
          }
          
          // Retorna os dados do usuário para a sessão
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
            permissions: user.permissions
          }
        } catch (error) {
          console.error('Erro durante autenticação:', error)
          return null
        }
      }
    })
  ],
  
  // Configuração da sessão
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 horas
  },
  
  // Callbacks para personalizar o comportamento da autenticação
  callbacks: {
    // Callback executado no momento do login
    async signIn({ user, account, profile, email, credentials }) {
      // Para autenticação com Google
      if (account?.provider === 'google') {
        try {
          await dbConnect();
          
          // Verifica se o usuário já existe no banco de dados
          let dbUser = await User.findOne({ email: user.email });
          
          if (!dbUser) {
            // Cria um novo usuário com permissões padrão
            dbUser = await User.create({
              name: user.name,
              email: user.email,
              role: 'staff',
              department: 'Geral',
              permissions: {
                viewTickets: true,
                respondTickets: true,
                viewDashboard: true,
              }
            });
          } else {
            // Atualiza as propriedades do objeto user com as informações do banco
            user.role = dbUser.role;
            user.id = dbUser._id.toString();
            user.department = dbUser.department;
            user.permissions = dbUser.permissions;
          }
          
          return true;
        } catch (error) {
          console.error('Erro ao processar usuário Google:', error);
          return true; // Ainda permite login mesmo com erro
        }
      }
      
      return true; // Para outros provedores
    },
    
    // Callback para personalizar o token JWT
    async jwt({ token, user }) {
      // Adiciona informações personalizadas ao token
      if (user) {
        token.id = user.id
        token.role = user.role
        token.department = user.department
        token.permissions = user.permissions
      }
      
      return token
    },
    
    // Callback para personalizar a sessão
    async session({ session, token }) {
      // Transfere as informações do token para a sessão
      if (session.user && token) {
        session.user = {
          ...session.user,
          id: token.id as string,
          role: token.role as string | null,
          department: token.department as string | null,
          permissions: token.permissions,
        };
      }
      
      return session
    },
    
    // Callback para personalização de URLs de redirecionamento
    async redirect({ url, baseUrl }) {
      // Log para debug da URL de redirecionamento
      console.log('[NextAuth] Redirect callback:', { url, baseUrl });
      
      // Se a URL já for completa (com domínio), verificar se é do mesmo domínio
      if (url.startsWith('http')) {
        // Extrair o domínio da URL
        const urlObj = new URL(url);
        const baseUrlObj = new URL(baseUrl);
        
        // Se os domínios forem diferentes, redirecionar para o dashboard por segurança
        if (urlObj.origin !== baseUrlObj.origin) {
          console.log('[NextAuth] Domínios diferentes, redirecionando para o dashboard');
          return `${baseUrl}/admin/dashboard`;
        }
        
        // Se o redirecionamento for para a página de login, redirecionar para o dashboard
        if (url.includes('/admin/login') || url === `${baseUrl}/admin`) {
          console.log('[NextAuth] Evitando redirecionamento para login, indo para dashboard');
          return `${baseUrl}/admin/dashboard`;
        }
        
        // Caso contrário, manter a URL original
        return url;
      }
      
      // Se a URL for relativa e for para a página de login, redirecionar para o dashboard
      if (url.startsWith('/admin/login') || url === '/admin') {
        console.log('[NextAuth] URL relativa para login, redirecionando para dashboard');
        return `${baseUrl}/admin/dashboard`;
      }
      
      // Se for uma URL relativa, prefixar com a URL base
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      
      // Se não começar com '/', é uma URL relativa que precisa ser prefixada com '/'
      return `${baseUrl}/${url}`;
    }
  },
  
  // Configuração das páginas personalizadas
  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
    signOut: '/',
  },
  
  // Configuração dos cookies
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
  
  // Chave secreta para criptografia
  secret: process.env.NEXTAUTH_SECRET || 'um-segredo-temporario-para-desenvolvimento-local',
  
  // Modo de depuração
  debug: process.env.NODE_ENV === 'development',
}

// Definir a URL base para o NextAuth
if (process.env.NEXTAUTH_URL) {
  console.log(`[NextAuth] Usando NEXTAUTH_URL configurado: ${process.env.NEXTAUTH_URL}`);
} else {
  // Se não estiver definido, definir com base no ambiente
  const baseUrl = getBaseUrl();
  console.log(`[NextAuth] NEXTAUTH_URL não configurado, usando URL base detectada: ${baseUrl}`);
  if (typeof process !== 'undefined' && process.env) {
    process.env.NEXTAUTH_URL = baseUrl;
  }
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }