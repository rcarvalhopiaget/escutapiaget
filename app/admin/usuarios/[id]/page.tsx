'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Loader2, ArrowLeft, Save } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AdminHeader } from '@/components/admin/admin-header'

// Tipo para representar um usuário
type User = {
  _id: string
  name: string
  email: string
  department?: string
  role?: string
  permissions?: {
    viewDashboard?: boolean
    manageTickets?: boolean
    manageUsers?: boolean
    manageQuestions?: boolean
  }
}

export default function UserDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string
  const { data: session, status } = useSession()
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  
  // Carregar dados do usuário
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login')
      return
    }
    
    if (status === 'authenticated') {
      // Verificar permissões
      const canManageUsers = session?.user?.permissions?.manageUsers || session?.user?.role === 'admin'
      if (!canManageUsers) {
        toast.error('Acesso negado', {
          description: 'Você não tem permissão para gerenciar usuários'
        })
        router.push('/admin')
        return
      }
      
      fetchUserDetails()
    }
  }, [status, router, session, userId])
  
  // Função para buscar detalhes do usuário
  const fetchUserDetails = async () => {
    try {
      setIsLoading(true)
      
      const response = await fetch(`/api/admin/users/${userId}`)
      const data = await response.json()
      
      if (!response.ok) {
        toast.error('Erro ao carregar usuário', {
          description: data.error || 'Não foi possível carregar os dados do usuário'
        })
        return
      }
      
      setUser(data.user)
    } catch (error) {
      console.error('Erro ao buscar detalhes do usuário:', error)
      toast.error('Erro ao carregar usuário', {
        description: 'Ocorreu um erro ao carregar os dados do usuário'
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // Função para atualizar um usuário
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) return
    
    try {
      setIsSaving(true)
      
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: user.name,
          email: user.email,
          department: user.department,
          role: user.role,
          permissions: user.permissions
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        toast.error('Erro ao atualizar usuário', {
          description: data.error || 'Não foi possível atualizar o usuário'
        })
        return
      }
      
      toast.success('Usuário atualizado com sucesso')
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error)
      toast.error('Erro ao atualizar usuário', {
        description: 'Ocorreu um erro ao atualizar o usuário'
      })
    } finally {
      setIsSaving(false)
    }
  }
  
  // Função para voltar à lista de usuários
  const handleGoBack = () => {
    router.push('/admin/usuarios')
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    )
  }
  
  if (!user) {
    return (
      <div className="container py-10 max-w-5xl">
        <AdminHeader 
          title="Usuário não encontrado" 
          description="O usuário solicitado não foi encontrado no sistema"
        />
        <Button onClick={handleGoBack} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para lista de usuários
        </Button>
      </div>
    )
  }
  
  return (
    <div className="container py-10 max-w-5xl">
      <AdminHeader 
        title="Detalhes do Usuário" 
        description="Visualizar e editar informações do usuário"
      />
      
      <form onSubmit={handleUpdateUser}>
        <div className="space-y-6">
          <Button 
            type="button" 
            onClick={handleGoBack} 
            variant="outline"
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para lista de usuários
          </Button>
          
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input 
                    id="name" 
                    value={user.name}
                    onChange={(e) => setUser({ ...user, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email"
                    value={user.email}
                    onChange={(e) => setUser({ ...user, email: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Departamento</Label>
                  <Select 
                    value={user.department || ''} 
                    onValueChange={(value) => setUser({ ...user, department: value })}
                  >
                    <SelectTrigger id="department">
                      <SelectValue placeholder="Selecione um departamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diretoria">Diretoria</SelectItem>
                      <SelectItem value="juridico">Jurídico</SelectItem>
                      <SelectItem value="pedagogico">Pedagógico</SelectItem>
                      <SelectItem value="administrativo">Administrativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Função</Label>
                  <Select 
                    value={user.role || ''} 
                    onValueChange={(value) => setUser({ ...user, role: value })}
                  >
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Selecione uma função" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Usuário Regular</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Permissões</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="viewDashboard" 
                    checked={user.permissions?.viewDashboard || false}
                    onCheckedChange={(checked) => 
                      setUser({ 
                        ...user, 
                        permissions: { 
                          ...user.permissions, 
                          viewDashboard: checked as boolean 
                        } 
                      })
                    }
                  />
                  <Label htmlFor="viewDashboard">Ver painel de controle</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="manageTickets" 
                    checked={user.permissions?.manageTickets || false}
                    onCheckedChange={(checked) => 
                      setUser({ 
                        ...user, 
                        permissions: { 
                          ...user.permissions, 
                          manageTickets: checked as boolean 
                        } 
                      })
                    }
                  />
                  <Label htmlFor="manageTickets">Gerenciar chamados</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="manageUsers" 
                    checked={user.permissions?.manageUsers || false}
                    onCheckedChange={(checked) => 
                      setUser({ 
                        ...user, 
                        permissions: { 
                          ...user.permissions, 
                          manageUsers: checked as boolean 
                        } 
                      })
                    }
                  />
                  <Label htmlFor="manageUsers">Gerenciar usuários</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="manageQuestions" 
                    checked={user.permissions?.manageQuestions || false}
                    onCheckedChange={(checked) => 
                      setUser({ 
                        ...user, 
                        permissions: { 
                          ...user.permissions, 
                          manageQuestions: checked as boolean 
                        } 
                      })
                    }
                  />
                  <Label htmlFor="manageQuestions">Gerenciar perguntas</Label>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  )
} 