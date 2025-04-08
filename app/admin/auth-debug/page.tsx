'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { AdminHeader } from '@/components/admin/admin-header'

export default function AuthDebugPage() {
  const { data: session, status } = useSession()
  const [serverInfo, setServerInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cookieValue, setCookieValue] = useState<string>('')

  // Função para buscar informações do servidor
  const fetchServerDebugInfo = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/auth/debug')
      const data = await response.json()
      
      if (response.ok) {
        setServerInfo(data)
      } else {
        setError(data.error || 'Falha ao buscar informações do servidor')
      }
    } catch (err) {
      setError('Erro ao comunicar com o servidor: ' + (err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  // Buscar informações na montagem do componente
  useEffect(() => {
    fetchServerDebugInfo()
  }, [])

  // Adicionando effect para capturar os cookies após a montagem
  useEffect(() => {
    setCookieValue(document.cookie)
  }, [])

  return (
    <div className="container py-10 max-w-5xl">
      <AdminHeader 
        title="Debug de Autenticação" 
        description="Informações detalhadas sobre a sessão atual e configurações de autenticação"
      />

      {/* Informações do cliente (browser) */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Informações do Cliente (Browser)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Status da sessão:</h3>
              <p className="text-sm mt-1">{status}</p>
            </div>

            <div>
              <h3 className="font-medium">Sessão atual:</h3>
              <pre className="text-sm mt-1 p-4 bg-neutral-100 rounded-md overflow-auto max-h-40">
                {JSON.stringify(session, null, 2)}
              </pre>
            </div>

            <div>
              <h3 className="font-medium">Cookies do navegador:</h3>
              <pre className="text-sm mt-1 p-4 bg-neutral-100 rounded-md overflow-auto max-h-40">
                {cookieValue ? cookieValue : 'Nenhum cookie encontrado ou acessível'}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações do servidor */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Informações do Servidor</CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchServerDebugInfo}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Carregando...
              </>
            ) : (
              'Recarregar'
            )}
          </Button>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-red-500">{error}</div>
          ) : isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
            </div>
          ) : serverInfo ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Horário do servidor:</h3>
                <p className="text-sm mt-1">{serverInfo.serverTime}</p>
              </div>

              <div>
                <h3 className="font-medium">Autenticado (servidor):</h3>
                <p className="text-sm mt-1">{serverInfo.authenticated ? 'Sim' : 'Não'}</p>
              </div>

              <div>
                <h3 className="font-medium">Sessão (servidor):</h3>
                <pre className="text-sm mt-1 p-4 bg-neutral-100 rounded-md overflow-auto max-h-40">
                  {JSON.stringify(serverInfo.session, null, 2)}
                </pre>
              </div>

              <div>
                <h3 className="font-medium">Provedores de autenticação:</h3>
                <ul className="text-sm mt-1 list-disc pl-5">
                  {serverInfo.authProviders?.map((provider: string) => (
                    <li key={provider}>{provider}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-medium">Estratégia de sessão:</h3>
                <p className="text-sm mt-1">{serverInfo.sessionStrategy}</p>
              </div>

              <div>
                <h3 className="font-medium">Debug ativado:</h3>
                <p className="text-sm mt-1">{serverInfo.debug ? 'Sim' : 'Não'}</p>
              </div>

              <div>
                <h3 className="font-medium">Páginas configuradas:</h3>
                <pre className="text-sm mt-1 p-4 bg-neutral-100 rounded-md overflow-auto max-h-40">
                  {JSON.stringify(serverInfo.nextAuthPages, null, 2)}
                </pre>
              </div>

              <div>
                <h3 className="font-medium">Informações do servidor:</h3>
                <pre className="text-sm mt-1 p-4 bg-neutral-100 rounded-md overflow-auto max-h-40">
                  {JSON.stringify(serverInfo.serverInfo, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="text-neutral-500">Nenhuma informação disponível</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 