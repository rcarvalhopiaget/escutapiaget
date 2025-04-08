'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { AdminHeader } from '@/components/admin/admin-header'
import AuthGuard from '../components/auth-guard'

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)

  // Verificação de autenticação com garantia adicional
  useEffect(() => {
    console.log('[Dashboard] Status de autenticação:', status)
    console.log('[Dashboard] Dados da sessão:', session)
    
    // Só continue após o status de autenticação ser determinado
    if (status === 'loading') {
      return
    }
    
    // Se não estiver autenticado, redirecione para o login
    if (status === 'unauthenticated') {
      console.log('[Dashboard] Usuário não autenticado. Redirecionando para login...')
      router.push('/admin/login')
      return
    }
    
    // Verificar se o usuário tem papel admin
    if (session?.user?.role !== 'admin') {
      console.log('[Dashboard] Usuário não é admin. Redirecionando para página não autorizada...')
      router.push('/admin/unauthorized')
      return
    }
    
    // Se chegou aqui, o usuário está autenticado e autorizado
    console.log('[Dashboard] Usuário autenticado e autorizado:', session?.user)
    setAuthChecked(true)
    
    // Simular carregamento dos dados do dashboard
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [status, session, router])
  
  // Se ainda está verificando a autenticação, mostre um loader
  if (!authChecked || status === 'loading') {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin h-12 w-12 mx-auto text-primary" />
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  // Se não estiver autenticado como admin, o useEffect vai redirecionar
  // Este render nunca deve acontecer, mas é bom ter como garantia
  if (status !== 'authenticated' || session?.user?.role !== 'admin') {
    return null
  }

  // Layout e conteúdo do dashboard usando componentes existentes
  return (
    <AuthGuard requiredRole="admin" requiredPermission="viewDashboard">
      <div className="container py-10 max-w-7xl">
        <AdminHeader 
          title="Dashboard" 
          description="Visualize dados e métricas do sistema de ouvidoria"
        />
        
        {isLoading ? (
          <div className="py-20 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-neutral-400" />
            <p className="mt-4 text-neutral-500">Carregando dados...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Tickets Recentes</CardTitle>
                <CardDescription>Últimos chamados registrados</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Dados dos tickets carregados com sucesso.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Sessão autenticada e verificada.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas</CardTitle>
                <CardDescription>Visão geral do sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Estatísticas do sistema carregadas.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Usuário: {session.user?.name || 'Admin'}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AuthGuard>
  )
} 