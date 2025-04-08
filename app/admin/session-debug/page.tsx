'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function SessionDebugPage() {
  const { data: session, status, update } = useSession()
  const [isUpdating, setIsUpdating] = useState(false)
  const [cookiesInfo, setCookiesInfo] = useState<string>('')

  // Função para verificar cookies
  function checkCookies() {
    const allCookies = document.cookie
    setCookiesInfo(allCookies)
  }

  // Função para forçar atualização da sessão
  async function forceSessionUpdate() {
    setIsUpdating(true)
    try {
      await update()
      console.log('Sessão atualizada')
    } catch (error) {
      console.error('Erro ao atualizar sessão:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-4xl bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Depuração de Sessão</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Status da Sessão */}
          <div className="bg-blue-50 p-4 rounded-md">
            <h2 className="font-semibold text-xl mb-2">Status da Sessão</h2>
            <p><strong>Status:</strong> {status}</p>
            {status === 'loading' && (
              <div className="flex items-center mt-2">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Carregando...</span>
              </div>
            )}
          </div>

          {/* Dados da sessão */}
          <div className="bg-green-50 p-4 rounded-md">
            <h2 className="font-semibold text-xl mb-2">Dados da Sessão</h2>
            {status === 'authenticated' ? (
              <pre className="bg-black text-green-400 p-4 rounded-md overflow-auto text-sm">
                {JSON.stringify(session, null, 2)}
              </pre>
            ) : (
              <p>Nenhuma sessão autenticada disponível</p>
            )}
          </div>

          {/* Cookies */}
          <div className="bg-yellow-50 p-4 rounded-md">
            <h2 className="font-semibold text-xl mb-2">Cookies do Navegador</h2>
            <Button 
              variant="outline"
              onClick={checkCookies}
              className="mb-2"
            >
              Verificar Cookies
            </Button>
            
            {cookiesInfo && (
              <div className="bg-black text-yellow-400 p-4 rounded-md overflow-auto text-sm">
                <p className="whitespace-pre-wrap">{cookiesInfo}</p>
              </div>
            )}
          </div>

          {/* Ações */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={forceSessionUpdate}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Atualizando...
                </>
              ) : (
                'Forçar Atualização da Sessão'
              )}
            </Button>

            <Button 
              variant="secondary"
              onClick={() => window.location.href = '/admin/dashboard'}
            >
              Tentar Acessar Dashboard
            </Button>

            <Button 
              variant="outline"
              onClick={() => window.location.href = '/admin/login'}
            >
              Voltar para Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 