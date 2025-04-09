'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, useSession, getCsrfToken } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function LoginDebugPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [email, setEmail] = useState('admin@piaget.com.br')
  const [password, setPassword] = useState('admin123')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [sessionData, setSessionData] = useState<any>(null)
  const [cookiesInfo, setCookiesInfo] = useState<string>('')
  const [csrfToken, setCsrfToken] = useState<string | null>(null)

  useEffect(() => {
    // Quando a sessão mudar, atualizar os dados de sessão
    setSessionData(session)
    
    // Obter o CSRF token
    async function fetchCsrfToken() {
      const token = await getCsrfToken()
      setCsrfToken(token || null)
    }
    
    fetchCsrfToken()
  }, [session])

  async function handleLogin() {
    setIsLoading(true)
    setResult(null)
    
    try {
      console.log(`Tentando login com: ${email}`)
      
      const response = await signIn('credentials', {
        redirect: false,
        email: email,
        password: password
      })
      
      console.log('Resposta do login:', response)
      setResult(response)
      
      if (response?.error) {
        toast.error('Erro ao fazer login', {
          description: `Erro: ${response.error}`
        })
        return
      }
      
      toast.success('Login bem-sucedido!', {
        description: 'Sessão iniciada'
      })
      
      // Atualizar dados da sessão após login bem-sucedido
      // Não redirecionamos automaticamente para poder ver os dados
      
    } catch (error) {
      console.error('Erro ao fazer login:', error)
      setResult(error)
      
      toast.error('Erro inesperado', {
        description: `${error}`
      })
    } finally {
      setIsLoading(false)
    }
  }

  function forceRedirect() {
    // Usar window.location.href para forçar recarregamento completo da página
    // Isso garante que os cookies sejam aplicados corretamente para o middleware
    window.location.href = '/admin'
  }
  
  function checkCookies() {
    const allCookies = document.cookie
    setCookiesInfo(allCookies)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Login Debug</h1>
        
        <div className="bg-blue-100 p-3 rounded mb-4 text-sm">
          <p><strong>Status da sessão:</strong> {status}</p>
          {csrfToken && <p><strong>CSRF Token:</strong> {csrfToken.substring(0, 10)}...</p>}
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm mb-1">Senha</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <Button 
            className="w-full" 
            onClick={handleLogin}
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
          
          {result && result.ok && (
            <Button 
              variant="secondary"
              className="w-full mt-2" 
              onClick={forceRedirect}
            >
              Forçar Redirecionamento para /admin
            </Button>
          )}
          
          <Button 
            variant="outline"
            className="w-full mt-2" 
            onClick={checkCookies}
          >
            Verificar Cookies
          </Button>
        </div>
        
        {cookiesInfo && (
          <div className="mt-4 p-4 bg-gray-100 rounded overflow-auto max-h-60">
            <h3 className="font-bold mb-2">Cookies:</h3>
            <pre className="text-xs break-all">{cookiesInfo || 'Nenhum cookie encontrado'}</pre>
          </div>
        )}
        
        {result && (
          <div className="mt-6 p-4 bg-gray-100 rounded overflow-auto max-h-60">
            <h3 className="font-bold mb-2">Resposta do login:</h3>
            <pre className="text-xs">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
        
        {sessionData && (
          <div className="mt-4 p-4 bg-gray-100 rounded overflow-auto max-h-60">
            <h3 className="font-bold mb-2">Dados da Sessão:</h3>
            <pre className="text-xs">{JSON.stringify(sessionData, null, 2)}</pre>
          </div>
        )}
      </div>
      
      <Toaster position="top-right" />
    </div>
  )
} 