'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { toast, Toaster } from 'sonner'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CriarAdminPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const router = useRouter()

  const criarAdmin = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/auth/admin/create', {
        method: 'POST',
      })
      
      const data = await response.json()
      setResult(data)
      
      if (data.success) {
        toast.success('Administrador criado com sucesso!', {
          description: 'Use as credenciais fornecidas para fazer login.'
        })
      } else if (data.message && data.credentials) {
        toast.info(data.message, {
          description: 'Use as credenciais fornecidas para fazer login.'
        })
      } else if (data.error) {
        toast.error('Erro ao criar administrador', {
          description: data.error || data.details
        })
      }
      
    } catch (error) {
      toast.error('Erro ao processar requisição', {
        description: String(error)
      })
      console.error('Erro ao criar admin:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  const irParaLogin = () => {
    router.push('/admin/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">Criar Usuário Administrador</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">
            Esta página permite criar um usuário administrador padrão com as seguintes credenciais:
          </p>
          <div className="bg-gray-100 p-4 rounded-md mb-4">
            <p className="font-medium">Email: admin@escolapiaget.com.br</p>
            <p className="font-medium">Senha: admin123</p>
          </div>
          
          {result && (
            <div className={`mt-4 p-4 rounded-md ${result.success ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
              <p className="font-medium">{result.message}</p>
              {result.credentials && (
                <div className="mt-2">
                  <p>Use estas credenciais para login:</p>
                  <p>Email: {result.credentials.email}</p>
                  <p>Senha: {result.credentials.password}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline"
            onClick={irParaLogin}
          >
            Ir para Login
          </Button>
          
          <Button 
            onClick={criarAdmin}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              'Criar Administrador'
            )}
          </Button>
        </CardFooter>
      </Card>
      
      <Toaster position="top-right" />
    </div>
  )
} 