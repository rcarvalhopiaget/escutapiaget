'use client'

import { useState } from 'react'
import { QuestionForm } from '../question-form'
import { QuestionFormData } from '../question-form'
import { toast } from 'sonner'

export default function TesteFormularioPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Função que será passada para o QuestionForm
  const handleSubmit = async (data: QuestionFormData) => {
    setIsSubmitting(true)
    console.log("=== TESTE: handleSubmit chamado com ===", data)
    
    // Simular processamento assíncrono
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Simular sucesso
    toast.success("Formulário processado com sucesso!")
    setIsSubmitting(false)
  }
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Teste de Formulário</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="mb-4 text-gray-700">
          Esta página testa a implementação do QuestionForm com os parâmetros corretos.
        </p>
        
        <div className="mt-8">
          <QuestionForm
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  )
} 