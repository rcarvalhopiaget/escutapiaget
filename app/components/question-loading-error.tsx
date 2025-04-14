'use client'

import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCcw } from "lucide-react"
import { useState } from "react"

interface QuestionLoadingErrorProps {
  message: string
  onRetry: () => void
}

export function QuestionLoadingError({ message, onRetry }: QuestionLoadingErrorProps) {
  const [isRetrying, setIsRetrying] = useState(false)
  
  const handleRetry = async () => {
    setIsRetrying(true)
    try {
      await onRetry()
    } finally {
      setIsRetrying(false)
    }
  }
  
  return (
    <div className="bg-red-50 border border-red-100 rounded-lg p-6 text-center">
      <div className="flex justify-center mb-4">
        <AlertCircle className="h-10 w-10 text-red-500" />
      </div>
      
      <h3 className="text-lg font-semibold text-red-700 mb-2">
        Não foi possível carregar o formulário
      </h3>
      
      <p className="text-red-600 mb-4">
        {message}
      </p>
      
      <div className="flex flex-col gap-4">
        <Button 
          variant="outline" 
          className="border-red-200 hover:bg-red-100"
          onClick={handleRetry}
          disabled={isRetrying}
        >
          {isRetrying ? (
            <>
              <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
              Tentando novamente...
            </>
          ) : (
            <>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Tentar novamente
            </>
          )}
        </Button>
        
        <Button 
          variant="link" 
          className="text-red-700"
          asChild
        >
          <a href="/chamados">Voltar para Chamados</a>
        </Button>
      </div>
    </div>
  )
} 