'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Toaster } from '@/components/ui/sonner'
import { Loader2 } from 'lucide-react'

// Esquema de validação
const setupSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword']
})

type SetupFormValues = z.infer<typeof setupSchema>

export default function SetupPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [usersExist, setUsersExist] = useState(false)
  
  const { register, handleSubmit, formState: { errors } } = useForm<SetupFormValues>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  })
  
  // Verificar se já existem usuários
  const checkExistingUsers = async () => {
    try {
      const response = await fetch('/api/admin/setup')
      const data = await response.json()
      
      if (response.status === 200 && data.message === 'Usuário administrador já existe.') {
        setUsersExist(true)
      }
    } catch (error) {
      console.error('Erro ao verificar usuários existentes:', error)
    }
  }
  
  // Chamar a verificação ao carregar a página
  useEffect(() => {
    checkExistingUsers()
  }, [])
  
  const onSubmit = async (data: SetupFormValues) => {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          role: 'admin',
          department: 'diretoria'
        })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar usuário administrador')
      }
      
      toast.success('Usuário administrador criado com sucesso', {
        description: 'Você será redirecionado para a página de login.'
      })
      
      // Redirecionar para o login após alguns segundos
      setTimeout(() => {
        router.push('/admin/login')
      }, 3000)
    } catch (error: any) {
      console.error('Erro na configuração:', error)
      toast.error('Erro ao criar usuário administrador', {
        description: error.message || 'Verifique os logs para mais detalhes'
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  if (usersExist) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Configuração já realizada</CardTitle>
            <CardDescription>
              O sistema já possui um usuário administrador.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-neutral-600 mb-4">
              Já existe um usuário administrador cadastrado no sistema. 
              Use a página de login para acessar o painel administrativo.
            </p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => router.push('/admin/login')}>
              Ir para o Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-50">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Configuração Inicial</CardTitle>
            <CardDescription>
              Crie o primeiro usuário administrador para acessar o sistema
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input 
                  id="name" 
                  placeholder="Nome do administrador" 
                  {...register('name')} 
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="email@exemplo.com" 
                  {...register('email')} 
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="******" 
                  {...register('password')} 
                />
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <Input 
                  id="confirmPassword" 
                  type="password" 
                  placeholder="******" 
                  {...register('confirmPassword')} 
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
                )}
              </div>
            </CardContent>
            
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  'Criar Usuário Administrador'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
      
      <Toaster position="top-right" richColors />
    </div>
  )
} 