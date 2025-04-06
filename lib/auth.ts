import { Session } from "next-auth";

// Define a role de administrador
const ADMIN_ROLE = 'admin';

/**
 * Verifica se a sessão do usuário pertence a um administrador.
 * 
 * @param session A sessão do NextAuth (pode ser null ou undefined).
 * @returns true se o usuário for admin, false caso contrário.
 */
export function isAdmin(session: Session | null | undefined): boolean {
  console.log('[Auth] Verificando autorização de administrador');
  
  // Se não houver sessão ou usuário na sessão, não é admin
  if (!session) {
    console.log('[Auth] Sem sessão, acesso negado');
    return false;
  }
  
  if (!session.user) {
    console.log('[Auth] Sessão sem usuário, acesso negado');
    return false;
  }

  const userRole = (session.user as any)?.role;
  console.log('[Auth] Role do usuário:', userRole);
  
  // Verifica se o usuário tem a propriedade 'role' e se ela é igual a ADMIN_ROLE
  const isUserAdmin = userRole === ADMIN_ROLE;
  console.log('[Auth] É administrador?', isUserAdmin);
  
  return isUserAdmin;
}

// Você pode adicionar outras funções relacionadas à autorização aqui, se necessário. 