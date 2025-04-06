import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// Verifica se o usuário atual tem a role de admin
export async function verifyAdminRole(): Promise<boolean> {
  try {
    console.log('[Auth] Verificando autorização de administrador')
    
    // Obter a sessão atual
    const session = await getServerSession(authOptions)
    
    // Verificar se o usuário está autenticado
    if (!session || !session.user) {
      console.log('[Auth] Usuário não autenticado')
      return false
    }
    
    // Verificar se o usuário tem a role "admin"
    // @ts-ignore - O TypeScript não sabe que adicionamos a propriedade role ao usuário
    const userRole = session.user.role
    
    console.log(`[Auth] Role do usuário: ${userRole}`)
    console.log(`[Auth] É administrador? ${userRole === 'admin'}`)
    
    return userRole === 'admin'
  } catch (error) {
    console.error('[Auth] Erro ao verificar permissão de administrador:', error)
    return false
  }
}

// Verifica se o usuário atual está autenticado
export async function isUserAuthenticated(): Promise<boolean> {
  try {
    // Obter a sessão atual
    const session = await getServerSession(authOptions)
    
    // Verificar se o usuário está autenticado
    return !!session?.user
  } catch (error) {
    console.error('[Auth] Erro ao verificar autenticação:', error)
    return false
  }
} 