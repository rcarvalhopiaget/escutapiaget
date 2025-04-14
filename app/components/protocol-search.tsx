'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Search } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Toaster } from '@/components/ui/sonner'

// Schema para validação do formato do protocolo
const protocolSchema = z.object({
  protocol: z
    .string()
    .min(1, { message: 'O protocolo é obrigatório' })
    .regex(/^\d{6}-\d{6}$/, {
      message: 'O protocolo deve estar no formato DDMMAA-NNNNNN (ex: 250406-110851)'
    })
})

type ProtocolFormValues = z.infer<typeof protocolSchema>

export function ProtocolSearch() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const { register, handleSubmit, formState: { errors } } = useForm<ProtocolFormValues>({
    resolver: zodResolver(protocolSchema),
    defaultValues: {
      protocol: ''
    }
  })

  async function onSubmit(data: ProtocolFormValues) {
    setIsLoading(true)
    setError('')

    try {
      // Chamar a API para buscar o protocolo
      const response = await fetch(`/api/ticket/protocol?protocol=${data.protocol}`)
      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Protocolo não encontrado')
        toast.error('Erro ao buscar protocolo', {
          description: result.error || 'Protocolo não encontrado'
        })
        return
      }

      // Se encontrou o chamado, redirecionar para a página de detalhes
      if (result.success && result.ticket) {
        toast.success('Protocolo encontrado', {
          description: 'Redirecionando para os detalhes do chamado'
        })
        
        // Redirecionar para a página de detalhes do protocolo
        router.push(`/chamados/protocolo?protocolo=${data.protocol}`)
      }
    } catch (error) {
      console.error('Erro ao buscar protocolo:', error)
      setError('Não foi possível conectar ao servidor. Tente novamente.')
      toast.error('Erro de conexão', {
        description: 'Não foi possível conectar ao servidor. Tente novamente.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <div className="flex space-x-2">
            <Input
              placeholder="Digite o protocolo (ex: 250406-110851)"
              className="flex-1"
              {...register('protocol')}
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                  <span>Buscando...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4" />
                  <span>Buscar</span>
                </div>
              )}
            </Button>
          </div>
          
          {errors.protocol && (
            <p className="text-sm font-medium text-red-500">
              {errors.protocol.message}
            </p>
          )}
          
          {error && (
            <p className="text-sm font-medium text-red-500">
              {error}
            </p>
          )}
        </div>
      </form>
      
      <p className="text-xs text-neutral-500 mt-2 text-center">
        Informe o número do protocolo para consultar o status do seu chamado
      </p>
      
      <Toaster position="top-right" richColors />
    </div>
  )
} 