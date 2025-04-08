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

  useEffect(() => {
    // Se a verificação de autenticação terminou e não há sessão, redireciona para login
    if (status === 'unauthenticated') {
      router.replace('/admin/login')
      return
    }
    
    // Se está autenticado, mas não tem a role necessária, redireciona para página de acesso negado
    if (status === 'authenticated' && session?.user?.role !== requiredRole) {
      router.replace('/admin/unauthorized')
      return
    }
    
    // Se foi especificada uma permissão e o usuário não a possui, redireciona para página de acesso negado
    if (
      status === 'authenticated' && 
      requiredPermission && 
      !session?.user?.permissions?.[requiredPermission as keyof typeof permissionMap]
    ) {
      router.replace('/admin/unauthorized')
      return
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

  // Se acesso negado, será redirecionado no useEffect
  // Se autenticado e tem permissão, mostra o conteúdo
  return <>{children}</>
} 