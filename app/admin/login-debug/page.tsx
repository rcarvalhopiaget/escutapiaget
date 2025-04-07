'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function LoginDebugPage() {
  const router = useRouter()
  const [email, setEmail] = useState('admin@escolapiaget.com.br')
  const [password, setPassword] = useState('admin123')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

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
        description: 'Redirecionando para o painel...'
      })
      
      // Redirecionar após 2 segundos para poder ver a mensagem
      setTimeout(() => {
        router.push('/admin')
      }, 2000)
      
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Login Debug</h1>
        
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
        </div>
        
        {result && (
          <div className="mt-6 p-4 bg-gray-100 rounded overflow-auto max-h-60">
            <h3 className="font-bold mb-2">Resposta:</h3>
            <pre className="text-xs">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </div>
      
      <Toaster position="top-right" />
    </div>
  )
} 