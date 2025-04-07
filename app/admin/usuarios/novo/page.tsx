'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Loader2, ArrowLeft, Save } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AdminHeader } from '@/components/admin/admin-header'
import { Toaster } from '@/components/ui/sonner'

// Tipo para o novo usuário
type NewUser = {
  name: string
  email: string
  password: string
  confirmPassword: string
  department?: string
  role?: string
  permissions?: {
    viewDashboard?: boolean
    manageTickets?: boolean
    manageUsers?: boolean
    manageQuestions?: boolean
  }
}

export default function NewUserPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  
  const [isCreating, setIsCreating] = useState(false)
  const [newUser, setNewUser] = useState<NewUser>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
    role: 'user',
    permissions: {
      viewDashboard: false,
      manageTickets: false,
      manageUsers: false,
      manageQuestions: false
    }
  })
  
  // Verificar permissão
  const checkPermission = () => {
    if (status === 'unauthenticated') {
      router.push('/admin/login')
      return false
    }
    
    const canManageUsers = session?.user?.permissions?.manageUsers || session?.user?.role === 'admin'
    if (!canManageUsers) {
      toast.error('Acesso negado', {
        description: 'Você não tem permissão para gerenciar usuários'
      })
      router.push('/admin')
      return false
    }
    
    return true
  }
  
  // Função para criar um novo usuário
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!checkPermission()) return
    
    // Validar senhas
    if (newUser.password !== newUser.confirmPassword) {
      toast.error('As senhas não coincidem', {
        description: 'Por favor, verifique se as senhas são idênticas'
      })
      return
    }
    
    // Validar campos obrigatórios
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast.error('Campos obrigatórios', {
        description: 'Por favor, preencha todos os campos obrigatórios'
      })
      return
    }
    
    try {
      setIsCreating(true)
      
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newUser.name,
          email: newUser.email,
          password: newUser.password,
          department: newUser.department,
          role: newUser.role,
          permissions: newUser.permissions
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        toast.error('Erro ao criar usuário', {
          description: data.error || 'Não foi possível criar o usuário'
        })
        return
      }
      
      toast.success('Usuário criado com sucesso')
      // Redirecionar para a lista de usuários após criação bem-sucedida
      setTimeout(() => router.push('/admin/usuarios'), 1500)
    } catch (error) {
      console.error('Erro ao criar usuário:', error)
      toast.error('Erro ao criar usuário', {
        description: 'Ocorreu um erro ao criar o usuário'
      })
    } finally {
      setIsCreating(false)
    }
  }
  
  // Função para voltar à lista de usuários
  const handleGoBack = () => {
    router.push('/admin/usuarios')
  }
  
  // Renderizar enquanto verifica a sessão
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    )
  }
  
  // Verificar permissão antes de renderizar o conteúdo
  if (status === 'authenticated' && !checkPermission()) {
    return null // O redirecionamento já ocorreu em checkPermission
  }
  
  return (
    <div className="container py-10 max-w-5xl">
      <AdminHeader 
        title="Adicionar Novo Usuário" 
        description="Cadastre um novo usuário no sistema"
      />
      
      <form onSubmit={handleCreateUser}>
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
                  <Label htmlFor="name">
                    Nome <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    id="name" 
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    id="email" 
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">
                    Senha <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    id="password" 
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">
                    Confirmar Senha <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    id="confirmPassword" 
                    type="password"
                    value={newUser.confirmPassword}
                    onChange={(e) => setNewUser({ ...newUser, confirmPassword: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Departamento</Label>
                  <Select 
                    value={newUser.department || ''} 
                    onValueChange={(value) => setNewUser({ ...newUser, department: value })}
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
                    value={newUser.role || 'user'} 
                    onValueChange={(value) => setNewUser({ ...newUser, role: value })}
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
                    checked={newUser.permissions?.viewDashboard || false}
                    onCheckedChange={(checked) => 
                      setNewUser({ 
                        ...newUser, 
                        permissions: { 
                          ...newUser.permissions, 
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
                    checked={newUser.permissions?.manageTickets || false}
                    onCheckedChange={(checked) => 
                      setNewUser({ 
                        ...newUser, 
                        permissions: { 
                          ...newUser.permissions, 
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
                    checked={newUser.permissions?.manageUsers || false}
                    onCheckedChange={(checked) => 
                      setNewUser({ 
                        ...newUser, 
                        permissions: { 
                          ...newUser.permissions, 
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
                    checked={newUser.permissions?.manageQuestions || false}
                    onCheckedChange={(checked) => 
                      setNewUser({ 
                        ...newUser, 
                        permissions: { 
                          ...newUser.permissions, 
                          manageQuestions: checked as boolean 
                        } 
                      })
                    }
                  />
                  <Label htmlFor="manageQuestions">Gerenciar perguntas</Label>
                </div>
              </div>
              
              <div className="pt-4 text-sm text-neutral-500">
                <p>Campos marcados com <span className="text-red-500">*</span> são obrigatórios.</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button type="submit" disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Criando usuário...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Criar Usuário
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
      
      <Toaster position="top-right" richColors />
    </div>
  )
} 