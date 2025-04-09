'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn, useSession, signOut } from 'next-auth/react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import { AlertCircle, Loader2, LogOut } from 'lucide-react'

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
  const [isLooping, setIsLooping] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [justLoggedIn, setJustLoggedIn] = useState(false)
  const [loopCount, setLoopCount] = useState(0)
  const [showLoopMessage, setShowLoopMessage] = useState(false)

  // Configuração do formulário com React Hook Form e validação Zod
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  })

  // Limpar qualquer marca de loop no carregamento inicial se tiver reset=true na URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const resetParam = searchParams.get('reset')
      if (resetParam === 'true') {
        console.log('[LoginForm] Parâmetro reset detectado. Limpando estado de loops.')
        localStorage.removeItem('login_loop_detected')
      }
      
      // Limpar quaisquer flags de estado
      localStorage.removeItem('redirectAttempts')
      setIsReady(true)
    }
  }, [searchParams])

  // Detectar possíveis loops de redirecionamento
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = window.location.href
      const from = searchParams.get('from')
      const timestamp = searchParams.get('t')
      
      console.log('[LoginForm] URL atual:', url)
      console.log('[LoginForm] Parâmetro from:', from)
      console.log('[LoginForm] Timestamp:', timestamp)
      
      // Checar se estamos em um possível loop apenas se não estivermos após um login bem sucedido
      if (!justLoggedIn && from === '/admin/dashboard') {
        // Verificar se temos marcas de tempo recentes (últimos 30 segundos)
        if (timestamp) {
          const currentTime = Date.now()
          const urlTime = parseInt(timestamp)
          
          if (!isNaN(urlTime) && currentTime - urlTime < 30000) {
            console.log('[LoginForm] Possível loop de redirecionamento detectado!')
            setIsLooping(true)
            
            toast.error('Loop de redirecionamento detectado', {
              description: 'O sistema detectou um possível loop. Tente fazer logout e login novamente.'
            })
          }
        }
      }
    }
  }, [searchParams, justLoggedIn])

  // Função para forçar logout e resetar o estado
  const handleForcedLogout = async () => {
    try {
      console.log('[LoginForm] Iniciando logout forçado para quebrar o loop')
      localStorage.removeItem('login_loop_detected')
      
      // Remover todos os cookies relacionados à sessão
      document.cookie.split(';').forEach(cookie => {
        const [name] = cookie.trim().split('=')
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
      })
      
      // Forçar logout via NextAuth
      await signOut({ redirect: false })
      
      // Recarregar a página após breve delay
      setTimeout(() => {
        window.location.href = '/admin/login?reset=true'
      }, 500)
      
    } catch (error) {
      console.error('[LoginForm] Erro ao forçar logout:', error)
      
      // Como último recurso, limpar a sessão e recarregar
      localStorage.clear()
      window.location.href = '/admin/login?clean=true'
    }
  }

  // Função para redirecionar ao dashboard com parâmetro de acesso
  const redirectToDashboard = useCallback(() => {
    console.log("Redirecionando para o dashboard após login...");
    // Usamos access=auth para evitar que o middleware bloqueie o acesso
    router.push('/admin/dashboard?access=auth&t=' + Date.now());
  }, [router]);

  // Gerenciamento do estado de autenticação
  useEffect(() => {
    if (status === 'loading') return;
    
    console.log(`Status de autenticação: ${status}`);
    
    if (status === 'authenticated' && session) {
      setIsLoading(false);
      setJustLoggedIn(true);
      console.log("Login bem-sucedido:", session);
      redirectToDashboard();
    }
  }, [status, session, redirectToDashboard]);

  // Detector de loops de redirecionamento
  useEffect(() => {
    // Se acabou de fazer login, não considerar loop
    if (justLoggedIn) {
      return;
    }

    const fromParam = new URLSearchParams(window.location.search).get('from');
    console.log(`Detectando loop. From: ${fromParam}, Count: ${loopCount}`);

    if (fromParam && (fromParam.includes('dashboard') || fromParam === '/admin')) {
      setLoopCount(prev => prev + 1);
    }

    if (loopCount >= 2) {
      setShowLoopMessage(true);
      console.warn("Detectado possível loop de redirecionamento!");
    }
  }, [loopCount, justLoggedIn]);

  // Resetar estado de "acabou de fazer login" após redirecionamento
  useEffect(() => {
    if (justLoggedIn) {
      const timer = setTimeout(() => {
        setJustLoggedIn(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [justLoggedIn]);

  // Função de submit do formulário
  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true)
    
    try {
      console.log('[LoginForm] Tentando login com:', data.email)
      
      // Usar URL hardcoded para evitar problemas com callbackUrl
      const result = await signIn('credentials', {
        redirect: false,
        email: data.email,
        password: data.password
      })
      
      console.log('[LoginForm] Resultado do login:', result)
      
      if (result?.error) {
        console.error('[LoginForm] Erro de login:', result.error)
        toast.error('Erro ao fazer login', {
          description: 'Credenciais inválidas. Verifique seu e-mail e senha.'
        })
      } else if (result?.ok) {
        console.log('[LoginForm] Login bem-sucedido')
        toast.success('Login bem-sucedido!', {
          description: 'Redirecionando para o painel administrativo...'
        })
        
        // Marcar que acabamos de fazer login com sucesso
        setJustLoggedIn(true)
        
        // Forçar atualização da sessão
        router.refresh()
      }
    } catch (error) {
      console.error('[LoginForm] Erro no processo de login:', error)
      toast.error('Erro ao fazer login', {
        description: 'Ocorreu um erro inesperado. Tente novamente mais tarde.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Se está redirecionando, mostra o estado de carregamento
  if (redirecting) {
    return <LoadingState message="Redirecionando para o painel administrativo..." />
  }

  return (
    <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
      {isLooping && (
        <div className="mb-6 p-4 border border-red-200 bg-red-50 rounded-md flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-800">Problema de redirecionamento detectado</h3>
            <p className="text-sm text-red-700 mt-1">
              O sistema detectou um possível loop de redirecionamento. Isso pode ocorrer quando há problemas com a sessão.
            </p>
            <Button 
              variant="destructive" 
              size="sm" 
              className="mt-3 w-full"
              onClick={handleForcedLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Forçar Logout e Limpar Cookies
            </Button>
          </div>
        </div>
      )}
      
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
        
        {/* Botão grande para navegação manual */}
        {status === 'authenticated' && session?.user?.role === 'admin' && (
          <div className="mt-6 border-t pt-4">
            <p className="text-sm font-medium text-gray-700 mb-3">
              Navegação Manual para o Dashboard:
            </p>
            <Button 
              variant="default" 
              size="lg" 
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={redirectToDashboard}
            >
              Acessar Dashboard Admin
            </Button>
          </div>
        )}
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