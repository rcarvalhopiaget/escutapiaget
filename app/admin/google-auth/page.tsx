'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

export default function GoogleAuthPage() {
  const [authUrl, setAuthUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchAuthUrl() {
      try {
        setIsLoading(true)
        const response = await fetch('/api/auth/google/url')
        const data = await response.json()

        if (response.ok && data.url) {
          setAuthUrl(data.url)
        } else {
          setError(data.error || 'Erro ao obter URL de autenticação')
        }
      } catch (err) {
        console.error("Erro ao buscar URL de autenticação:", err)
        setError("Falha na comunicação com o servidor. Tente novamente mais tarde.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchAuthUrl()
  }, [])

  const handleAuthorize = () => {
    if (authUrl) {
      window.location.href = authUrl
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Autorizar Google Drive</CardTitle>
          <CardDescription>
            Conecte sua conta do Google Drive para permitir o armazenamento de anexos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Clique no botão abaixo para permitir que o aplicativo Escuta Piaget
              acesse seu Google Drive para salvar anexos de chamados.
              Você só precisa fazer isso uma vez para obter o token necessário.
            </p>
            
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {isLoading ? (
              <Button disabled className="w-full">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Carregando...
              </Button>
            ) : (
              <Button 
                onClick={handleAuthorize} 
                disabled={!authUrl || !!error}
                className="w-full"
              >
                Autorizar Acesso ao Google Drive
              </Button>
            )}
            
            {authUrl && (
              <div className="mt-4 text-xs text-gray-400 break-all p-2 bg-gray-50 rounded">
                <p className="font-semibold mb-1">URL de autorização:</p>
                <code className="text-[10px]">{authUrl}</code>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 