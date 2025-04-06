'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email({
    message: 'Digite um e-mail válido'
  }),
  password: z.string().min(6, {
    message: 'A senha deve ter pelo menos 6 caracteres'
  })
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true)
    
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: data.email,
        password: data.password
      })
      
      if (result?.error) {
        toast.error('Erro ao fazer login', {
          description: 'Credenciais inválidas. Verifique seu e-mail e senha.'
        })
        return
      }
      
      // Login bem-sucedido, redirecionar para o painel
      router.push('/admin')
      
    } catch (error) {
      console.error('Erro inesperado:', error)
      toast.error('Erro ao fazer login', {
        description: 'Ocorreu um erro inesperado. Tente novamente mais tarde.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-50">
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
        </div>
      </div>
      
      <Toaster position="top-right" />
    </div>
  )
} 