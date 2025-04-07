import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from "next-auth/providers/google"
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
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    CredentialsProvider({
      name: 'Credenciais',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' }
      },
      async authorize(credentials, req) {
        console.log('[Authorize] ------------------- INÍCIO DO PROCESSO DE AUTENTICAÇÃO -------------------');
        console.log('[Authorize] Tentativa de login recebida:', { email: credentials?.email });
        
        if (!credentials?.email || !credentials?.password) {
          console.log('[Authorize] ERRO: Credenciais ausentes.');
          return null
        }

        try {
          console.log('[Authorize] Conectando ao DB...');
          await dbConnect()
          console.log('[Authorize] Conexão DB estabelecida.');
        } catch (error) {
          console.error('[Authorize] ERRO: Falha ao conectar com o MongoDB:', error)
          // ... (fallback dev omitido)
          return null
        }

        try {
          console.log(`[Authorize] Buscando usuário: ${credentials.email}`);
          const user = await User.findOne({ email: credentials.email }).select('+password')
          
          if (!user) {
            console.log(`[Authorize] ERRO: Usuário ${credentials.email} não encontrado.`);
            return null
          }
          
          console.log(`[Authorize] Usuário encontrado:`, { 
            id: user._id.toString(),
            email: user.email,
            role: user.role,
            department: user.department
          });
          
          console.log(`[Authorize] Comparando senha...`);
          const isPasswordMatch = await user.comparePassword(credentials.password)
          console.log(`[Authorize] Senha corresponde? ${isPasswordMatch}`);
          
          if (!isPasswordMatch) {
            console.log(`[Authorize] ERRO: Senha inválida para ${user.email}.`);
            return null
          }
          
          console.log(`[Authorize] Autenticação bem-sucedida para ${user.email}. Retornando dados do usuário.`);
          const userData = {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
            permissions: user.permissions
          };
          
          console.log('[Authorize] Dados de usuário retornados:', userData);
          console.log('[Authorize] ------------------- FIM DO PROCESSO DE AUTENTICAÇÃO -------------------');
          
          return userData;
        } catch (error) {
          console.error('[Authorize] ERRO durante busca/comparação de senha:', error)
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
    async signIn({ user, account, profile }) {
      console.log('[SignIn] ------------------- INÍCIO DO CALLBACK SIGNIN -------------------');
      console.log('[SignIn] Provider:', account?.provider);
      console.log('[SignIn] User:', user);
      
      if (account?.provider === 'google') {
        console.log('[GoogleSignIn] Usuário autenticado via Google:', user.email);
        
        try {
          await dbConnect();
          
          // Verifica se o usuário já existe no banco de dados
          let dbUser = await User.findOne({ email: user.email });
          
          if (!dbUser) {
            console.log('[GoogleSignIn] Usuário não encontrado no banco. Criando novo usuário.');
            // Se o usuário não existir, cria um novo com permissões padrão
            dbUser = await User.create({
              name: user.name,
              email: user.email,
              // Por padrão, usuários do Google serão "staff" - modifique conforme necessário
              role: 'staff',
              department: 'Geral',
              permissions: {
                viewTickets: true,
                respondTickets: true,
                viewDashboard: true,
                // Outras permissões podem ser adicionadas conforme necessário
              }
            });
            console.log('[GoogleSignIn] Novo usuário criado:', dbUser.email);
          } else {
            console.log('[GoogleSignIn] Usuário encontrado no banco:', dbUser.email);
            
            // Atualiza as propriedades do objeto user com as informações do banco
            user.role = dbUser.role;
            user.id = dbUser._id.toString();
            user.department = dbUser.department;
            user.permissions = dbUser.permissions;
          }
          
          console.log('[SignIn] ------------------- FIM DO CALLBACK SIGNIN -------------------');
          return true;
        } catch (error) {
          console.error('[GoogleSignIn] Erro ao processar usuário Google:', error);
          return true; // Ainda permite login mesmo com erro, mas sem permissões extras
        }
      }
      
      console.log('[SignIn] ------------------- FIM DO CALLBACK SIGNIN -------------------');
      return true; // Mantém o fluxo normal para outros provedores
    },
    async jwt({ token, user }) {
      console.log('[JWT] ------------------- INÍCIO DO CALLBACK JWT -------------------');
      console.log('[JWT] Token:', { 
        sub: token.sub,
        name: token.name,
        email: token.email,
        role: token.role,
        id: token.id
      });
      console.log('[JWT] User exists:', !!user);
      
      if (user) {
        console.log('[JWT] Atualizando token com dados do usuário:', { 
          id: user.id, 
          role: user.role,
          department: user.department,
          permissions: user.permissions
        });
        token.id = user.id
        token.role = user.role
        token.department = user.department
        token.permissions = user.permissions
      }
      
      console.log('[JWT] Token atualizado:', { 
        sub: token.sub,
        name: token.name,
        email: token.email,
        role: token.role,
        id: token.id,
        department: token.department
      });
      console.log('[JWT] ------------------- FIM DO CALLBACK JWT -------------------');
      
      return token
    },
    async session({ session, token }) {
      console.log('[Session] ------------------- INÍCIO DO CALLBACK SESSION -------------------');
      console.log('[Session] Original session:', { 
        user: {
          name: session.user?.name,
          email: session.user?.email
        }
      });
      console.log('[Session] Token:', { 
        sub: token.sub,
        name: token.name,
        email: token.email,
        role: token.role,
        id: token.id
      });
      
      if (session.user && token) {
        console.log('[Session] Atualizando sessão com dados do token');
        session.user.id = token.id as string
        session.user.role = token.role as string | null
        session.user.department = token.department as string | null
        session.user.permissions = token.permissions
      }
      
      console.log('[Session] Sessão atualizada:', { 
        user: {
          id: session.user?.id,
          name: session.user?.name,
          email: session.user?.email,
          role: session.user?.role,
          department: session.user?.department
        }
      });
      console.log('[Session] ------------------- FIM DO CALLBACK SESSION -------------------');
      
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