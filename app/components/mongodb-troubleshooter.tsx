'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card'
import { Loader2, AlertCircle, CheckCircle, RefreshCw, Database } from 'lucide-react'
import { toast } from 'sonner'

type DiagnosticData = {
  timestamp: string
  environment: {
    NODE_ENV: string
    DATABASE_URL: string
    isDefined: boolean
  }
  connection: {
    state: string
    readyState: number
  }
  test: {
    result: string
    error: any
  }
  database: {
    collections: string[]
    questionCount: number
  }
}

export function MongoDBTroubleshooter() {
  const [isLoading, setIsLoading] = useState(true)
  const [diagnosticData, setDiagnosticData] = useState<DiagnosticData | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const runDiagnostic = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/debug/mongodb?_t=' + Date.now(), {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        }
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao executar diagnóstico')
      }
      
      setDiagnosticData(data)
    } catch (err) {
      console.error('Erro ao executar diagnóstico:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      toast.error('Falha ao verificar conexão', {
        description: err instanceof Error ? err.message : 'Erro desconhecido'
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  useEffect(() => {
    runDiagnostic()
  }, [])
  
  const getStatusColor = () => {
    if (!diagnosticData) return 'bg-gray-200'
    
    const isConnected = diagnosticData.connection.readyState === 1
    const hasQuestions = diagnosticData.database.questionCount > 0
    
    if (isConnected && hasQuestions) return 'bg-green-100 border-green-300'
    if (isConnected) return 'bg-yellow-100 border-yellow-300'
    return 'bg-red-100 border-red-300'
  }
  
  const getStatusIcon = () => {
    if (isLoading) return <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
    if (!diagnosticData) return <AlertCircle className="h-8 w-8 text-red-500" />
    
    const isConnected = diagnosticData.connection.readyState === 1
    const hasQuestions = diagnosticData.database.questionCount > 0
    
    if (isConnected && hasQuestions) return <CheckCircle className="h-8 w-8 text-green-500" />
    if (isConnected) return <AlertCircle className="h-8 w-8 text-yellow-500" />
    return <AlertCircle className="h-8 w-8 text-red-500" />
  }
  
  const getStatusMessage = () => {
    if (isLoading) return 'Verificando conexão...'
    if (!diagnosticData) return 'Não foi possível obter informações de diagnóstico'
    
    const isConnected = diagnosticData.connection.readyState === 1
    const hasQuestions = diagnosticData.database.questionCount > 0
    
    if (isConnected && hasQuestions) {
      return `Conexão OK. ${diagnosticData.database.questionCount} perguntas encontradas.`
    }
    if (isConnected) {
      return 'Conectado ao MongoDB, mas nenhuma pergunta encontrada.'
    }
    return `Problema na conexão. Estado: ${diagnosticData.connection.state}`
  }
  
  return (
    <Card className={`shadow-md border ${getStatusColor()}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Diagnóstico do MongoDB
        </CardTitle>
        <CardDescription>
          Verifica a conexão com o banco de dados
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center py-4">
          {getStatusIcon()}
          <p className="ml-3 text-lg font-medium">{getStatusMessage()}</p>
        </div>
        
        {diagnosticData && (
          <div className="text-sm space-y-2">
            <div className="bg-white p-3 rounded-md border">
              <h3 className="font-medium mb-1">Informações da Conexão</h3>
              <p>Estado: <span className="font-mono">{diagnosticData.connection.state}</span></p>
              <p>Ambiente: <span className="font-mono">{diagnosticData.environment.NODE_ENV}</span></p>
              <p>URI definida: <span className="font-mono">{diagnosticData.environment.isDefined ? 'Sim' : 'Não'}</span></p>
            </div>
            
            <div className="bg-white p-3 rounded-md border">
              <h3 className="font-medium mb-1">Informações do Banco</h3>
              <p>Coleções: <span className="font-mono">{diagnosticData.database.collections.length > 0 
                ? diagnosticData.database.collections.join(', ') 
                : 'Nenhuma coleção encontrada'}</span></p>
              <p>Perguntas: <span className="font-mono">{diagnosticData.database.questionCount}</span></p>
            </div>
            
            {diagnosticData.test.error && (
              <div className="bg-red-50 p-3 rounded-md border border-red-200">
                <h3 className="font-medium mb-1 text-red-700">Detalhes do Erro</h3>
                <p className="text-red-600 font-mono text-xs break-all">
                  {diagnosticData.test.error.message || JSON.stringify(diagnosticData.test.error)}
                </p>
              </div>
            )}
          </div>
        )}
        
        {error && (
          <div className="bg-red-100 p-3 rounded-md text-red-700 text-sm">
            <AlertCircle className="h-4 w-4 inline-block mr-1" />
            {error}
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={runDiagnostic} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Verificando...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Verificar novamente
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
} 