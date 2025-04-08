'use client'

import { useState, useEffect } from 'react'
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
  const [redirecting, setRedirecting] = useState(false)
  const [redirectAttempts, setRedirectAttempts] = useState(0)
  const [isReady, setIsReady] = useState(false)

  // Configuração do formulário com React Hook Form e validação Zod
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  })

  // Inicialização do componente
  useEffect(() => {
    // Limpar o estado de redirecionamento anterior
    if (typeof window !== 'undefined') {
      const redirectSessionId = localStorage.getItem('redirectSessionId');
      const timestamp = Date.now();
      
      // Se não houver sessão ou se a sessão for muito antiga (mais de 5 minutos), criar nova
      if (!redirectSessionId || (timestamp - parseInt(redirectSessionId)) > 300000) {
        localStorage.setItem('redirectSessionId', timestamp.toString());
        localStorage.setItem('redirectAttempts', '0');
      }
      
      setIsReady(true);
    }
  }, []);

  // Efeito para lidar com o redirecionamento quando já autenticado
  useEffect(() => {
    if (!isReady) return; // Aguardar até que a verificação inicial esteja concluída
    
    console.log('[LoginForm] Status:', status);
    console.log('[LoginForm] Session:', session);
    
    // Verificar se está na origem do redirecionamento (evitar redirecionamento circular)
    const isFromRedirect = callbackUrl.includes('/admin/login') || callbackUrl === '/admin' || callbackUrl === '/admin/';
    if (isFromRedirect) {
      console.log('[LoginForm] Evitando redirecionamento circular:', callbackUrl);
      const safeCallbackUrl = '/admin/dashboard';
      console.log('[LoginForm] Usando URL segura:', safeCallbackUrl);
      
      if (status === 'authenticated' && session?.user?.role === 'admin') {
        window.location.href = safeCallbackUrl;
      }
      return;
    }
    
    // Obter contagem de tentativas de redirecionamento do localStorage
    let attempts = 0;
    if (typeof window !== 'undefined') {
      const storedAttempts = localStorage.getItem('redirectAttempts');
      attempts = storedAttempts ? parseInt(storedAttempts) : 0;
      console.log('[LoginForm] Tentativas anteriores de redirecionamento:', attempts);
    }
    
    if (status === 'authenticated' && session?.user?.role === 'admin' && !redirecting) {
      // Evitar tentativas infinitas de redirecionamento
      if (attempts >= 3) {
        console.log('[LoginForm] Muitas tentativas de redirecionamento, abortando');
        toast.error('Erro no redirecionamento', {
          description: 'Não foi possível redirecionar para o dashboard. Por favor, tente navegar manualmente.'
        });
        return;
      }
      
      // Incrementar e armazenar contagem de tentativas
      attempts++;
      if (typeof window !== 'undefined') {
        localStorage.setItem('redirectAttempts', attempts.toString());
      }
      
      console.log('[LoginForm] Usuário autenticado como admin. Redirecionando para:', callbackUrl);
      setRedirecting(true);
      
      // Adicionar timestamp à URL para evitar o caching do navegador
      const urlWithTimestamp = `${callbackUrl}${callbackUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
      
      // Usar window.location para forçar um redirecionamento completo
      // Isso evita problemas com o router do Next.js
      window.location.href = urlWithTimestamp;
    }
  }, [status, session, callbackUrl, router, redirecting, isReady]);

  // Função de submit do formulário
  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true)
    
    try {
      console.log('[LoginForm] Tentando login com:', data.email);
      
      // Tentativa de login usando credenciais
      const result = await signIn('credentials', {
        redirect: false,
        email: data.email,
        password: data.password,
        callbackUrl
      })
      
      console.log('[LoginForm] Resultado do login:', result);
      
      // Tratamento de erros
      if (result?.error) {
        console.error('[LoginForm] Erro de login:', result.error);
        toast.error('Erro ao fazer login', {
          description: 'Credenciais inválidas. Verifique seu e-mail e senha.'
        })
      } else if (result?.ok) {
        console.log('[LoginForm] Login bem-sucedido');
        toast.success('Login bem-sucedido!', {
          description: 'Você será redirecionado em instantes.'
        })
        
        // Resetar contagem de tentativas após login bem-sucedido
        if (typeof window !== 'undefined') {
          localStorage.setItem('redirectAttempts', '0');
        }
        
        // Atualiza o estado da sessão
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
    return <LoadingState message="Redirecionando para o dashboard..." />
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
        
        {/* Link de redirecionamento manual como fallback */}
        {status === 'authenticated' && session?.user?.role === 'admin' && (
          <p className="text-sm text-neutral-500 mt-4 border-t pt-4">
            <span className="block mb-2">Se o redirecionamento automático não funcionar:</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                // Resetar contagem antes de tentar navegar manualmente
                if (typeof window !== 'undefined') {
                  localStorage.setItem('redirectAttempts', '0');
                }
                window.location.href = '/admin/dashboard';
              }}
            >
              Ir para o Dashboard Manualmente
            </Button>
          </p>
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