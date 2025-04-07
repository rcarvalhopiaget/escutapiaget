'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Loader2, PlusCircle, Users } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Toaster } from '@/components/ui/sonner'
import { DataTable } from '@/components/ui/data-table'
import { toast } from 'sonner'
import { AdminHeader } from '@/components/admin/admin-header'

import { userColumns, UserData } from './columns'

export default function UsersPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(true)
  const [users, setUsers] = useState<UserData[]>([])
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login')
    }
  }, [status, router])
  
  // Verificar permissões
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      if (session.user.permissions && !session.user.permissions.manageUsers) {
        toast.error('Acesso negado', {
          description: 'Você não tem permissão para gerenciar usuários'
        })
        router.push('/admin')
      }
    }
  }, [status, session, router])

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      
      // Filtros baseados na aba ativa
      let url = '/api/admin/users'
      if (activeTab !== 'all') {
        url += `?department=${activeTab}`
      }
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (!response.ok) {
        toast.error('Erro ao carregar usuários', {
          description: data.error || 'Não foi possível carregar os usuários'
        })
        return
      }
      
      setUsers(data.users || [])
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
      toast.error('Erro ao carregar usuários', {
        description: 'Ocorreu um erro ao carregar os usuários'
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'authenticated') {
      fetchUsers()
    }
  }, [activeTab, status])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  const handleAddUser = () => {
    router.push('/admin/usuarios/novo')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    )
  }

  return (
    <div className="container py-10 max-w-7xl">
      <AdminHeader 
        title="Gerenciamento de Usuários" 
        description="Gerencie os usuários do sistema e suas permissões"
      />
      
      <div className="flex justify-end space-x-2 mb-6">
        <Button onClick={handleAddUser}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      <Tabs defaultValue="all" onValueChange={handleTabChange}>
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="all">
              Todos
              <Badge variant="outline" className="ml-2">
                {users.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="diretoria">
              Diretoria
              <Badge variant="outline" className="ml-2">
                {users.filter(u => u.department === 'diretoria').length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="juridico">
              Jurídico
              <Badge variant="outline" className="ml-2">
                {users.filter(u => u.department === 'juridico').length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="pedagogico">
              Pedagógico
              <Badge variant="outline" className="ml-2">
                {users.filter(u => u.department === 'pedagogico').length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="administrativo">
              Administrativo
              <Badge variant="outline" className="ml-2">
                {users.filter(u => u.department === 'administrativo').length}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="mt-4">
          <div className="rounded-md border">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
                <span className="ml-2 text-neutral-500">Carregando usuários...</span>
              </div>
            ) : (
              <DataTable
                columns={userColumns}
                data={users}
                searchColumn="name"
                searchPlaceholder="Buscar por nome..."
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="diretoria" className="mt-4">
          <div className="rounded-md border">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
                <span className="ml-2 text-neutral-500">Carregando usuários...</span>
              </div>
            ) : (
              <DataTable
                columns={userColumns}
                data={users.filter(u => u.department === 'diretoria')}
                searchColumn="name"
                searchPlaceholder="Buscar por nome..."
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="juridico" className="mt-4">
          <div className="rounded-md border">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
                <span className="ml-2 text-neutral-500">Carregando usuários...</span>
              </div>
            ) : (
              <DataTable
                columns={userColumns}
                data={users.filter(u => u.department === 'juridico')}
                searchColumn="name"
                searchPlaceholder="Buscar por nome..."
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="pedagogico" className="mt-4">
          <div className="rounded-md border">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
                <span className="ml-2 text-neutral-500">Carregando usuários...</span>
              </div>
            ) : (
              <DataTable
                columns={userColumns}
                data={users.filter(u => u.department === 'pedagogico')}
                searchColumn="name"
                searchPlaceholder="Buscar por nome..."
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="administrativo" className="mt-4">
          <div className="rounded-md border">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
                <span className="ml-2 text-neutral-500">Carregando usuários...</span>
              </div>
            ) : (
              <DataTable
                columns={userColumns}
                data={users.filter(u => u.department === 'administrativo')}
                searchColumn="name"
                searchPlaceholder="Buscar por nome..."
              />
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      <Toaster position="top-right" richColors />
    </div>
  )
} 