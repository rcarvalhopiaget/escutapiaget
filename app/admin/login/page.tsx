'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn, useSession } from 'next-auth/react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

// Schema de validação do formulário de login
const loginSchema = z.object({
  email: z.string().email({
    message: 'Digite um e-mail válido'
  }),
  password: z.string().min(6, {
    message: 'A senha deve ter pelo menos 6 caracteres'
  })
})

type LoginFormValues = z.infer<typeof loginSchema>

// Componente de formulário de login otimizado
function LoginForm() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('from') || searchParams.get('callbackUrl') || '/admin/dashboard'
  const [isLoading, setIsLoading] = useState(false)

  // Configuração do formulário com React Hook Form e validação Zod
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  })

  // Efeito de redirecionamento quando já estiver autenticado
  if (status === 'authenticated' && session?.user?.role === 'admin') {
    router.replace(callbackUrl)
    return <LoadingState message="Redirecionando..." />
  }

  // Função de submit do formulário
  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true)
    
    try {
      // Tentativa de login usando credenciais
      const result = await signIn('credentials', {
        redirect: false,
        email: data.email,
        password: data.password,
        callbackUrl
      })
      
      // Tratamento de erros
      if (result?.error) {
        toast.error('Erro ao fazer login', {
          description: 'Credenciais inválidas. Verifique seu e-mail e senha.'
        })
      } else if (result?.ok) {
        toast.success('Login bem-sucedido!', {
          description: 'Você será redirecionado em instantes.'
        })
        
        // Atualiza o estado da sessão
        router.refresh()
        
        // Forçar o redirecionamento após um breve intervalo
        setTimeout(() => {
          router.replace(callbackUrl)
        }, 1000)
      }
    } catch (error) {
      console.error('Erro no processo de login:', error)
      toast.error('Erro ao fazer login', {
        description: 'Ocorreu um erro inesperado. Tente novamente mais tarde.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">Painel Administrativo</h1>
        <p className="text-neutral-600">Acesso restrito à equipe autorizada</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">E-mail</label>
          <Input 
            placeholder="seu-email@exemplo.com" 
            {...register('email')} 
            autoComplete="email"
          />
          {errors.email && (
            <p className="text-sm font-medium text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Senha</label>
          <Input 
            type="password" 
            placeholder="••••••••" 
            {...register('password')} 
            autoComplete="current-password"
          />
          {errors.password && (
            <p className="text-sm font-medium text-red-500">{errors.password.message}</p>
          )}
        </div>

        <Button 
          type="submit" 
          className="w-full" 
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Entrando...
            </>
          ) : (
            'Entrar'
          )}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-neutral-500">
          Esqueceu a senha? Entre em contato com o administrador do sistema.
        </p>
        <p className="text-sm text-neutral-500 mt-2">
          <Button variant="link" className="p-0 h-auto" onClick={() => router.push('/admin/setup')}>
            Configuração inicial do sistema
          </Button>
        </p>
        <p className="text-sm text-neutral-500 mt-2">
          <Button variant="link" className="p-0 h-auto" onClick={() => router.push('/admin/criar-admin')}>
            Criar usuário admin
          </Button>
        </p>
      </div>
    </div>
  )
}

// Componente de estado de carregamento
function LoadingState({ message = 'Carregando...' }) {
  return (
    <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md text-center">
      <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-500" />
      <p className="mt-4 text-neutral-600">{message}</p>
    </div>
  )
}

// Componente principal da página de login
export default function LoginPage() {
  const { status } = useSession()
  const isLoading = status === 'loading'

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-50">
      {isLoading ? <LoadingState /> : <LoginForm />}
      <Toaster position="top-right" />
    </div>
  )
} 