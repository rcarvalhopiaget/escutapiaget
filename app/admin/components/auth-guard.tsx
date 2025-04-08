'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

/**
 * Componente de guarda para proteger rotas administrativas
 * Verifica se o usuário está autenticado e tem a role necessária
 */
export default function AuthGuard({
  children,
  requiredRole = 'admin',
  requiredPermission,
}: {
  children: React.ReactNode
  requiredRole?: 'admin' | 'manager' | 'staff' | 'director'
  requiredPermission?: keyof typeof permissionMap
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // Mapeamento de permissões para verificação
  const permissionMap = {
    viewTickets: 'viewTickets',
    respondTickets: 'respondTickets',
    editTickets: 'editTickets',
    deleteTickets: 'deleteTickets',
    manageUsers: 'manageUsers',
    viewDashboard: 'viewDashboard',
    viewAllDepartments: 'viewAllDepartments',
  } as const

  // Função para verificar autenticação e permissões
  useEffect(() => {
    console.log('[AuthGuard] Status da sessão:', status);
    console.log('[AuthGuard] Sessão:', session);
    console.log('[AuthGuard] Role necessária:', requiredRole);
    console.log('[AuthGuard] Permissão necessária:', requiredPermission);
    
    // Se a verificação de autenticação terminou e não há sessão, redireciona para login
    if (status === 'unauthenticated') {
      console.log('[AuthGuard] Usuário não autenticado. Redirecionando para login.');
      // Usar window.location para evitar problemas com o router do Next.js
      window.location.href = '/admin/login';
      return;
    }
    
    // Se está autenticado, mas não tem a role necessária, redireciona para página de acesso negado
    if (status === 'authenticated' && session?.user?.role !== requiredRole) {
      console.log('[AuthGuard] Usuário autenticado, mas sem a role necessária:', {
        userRole: session?.user?.role,
        requiredRole
      });
      window.location.href = '/admin/unauthorized';
      return;
    }
    
    // Se foi especificada uma permissão e o usuário não a possui, redireciona para página de acesso negado
    if (
      status === 'authenticated' && 
      requiredPermission && 
      !session?.user?.permissions?.[requiredPermission as keyof typeof permissionMap]
    ) {
      console.log('[AuthGuard] Usuário sem a permissão necessária:', {
        userPermissions: session?.user?.permissions,
        requiredPermission
      });
      window.location.href = '/admin/unauthorized';
      return;
    }
    
    if (status === 'authenticated') {
      console.log('[AuthGuard] Acesso permitido: usuário autenticado com role e permissões corretas');
    }
  }, [status, session, router, requiredRole, requiredPermission])

  // Enquanto verifica a autenticação, mostra um loader
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  // Se status for authenticated, mostra o conteúdo
  // (qualquer redirecionamento necessário já foi tratado no useEffect)
  return <>{children}</>
} 