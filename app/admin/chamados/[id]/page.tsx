'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Loader2, ChevronLeft, Clock, Calendar, User, Mail, MessageSquare, FileText } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Toaster } from '@/components/ui/sonner'

import { Ticket } from '@/app/types/ticket'
import { TicketTimeline } from '@/app/components/ui/ticket-timeline'

// Mapeia tipos de chamado para nomes mais amigáveis e cores
const typeMap: Record<string, { label: string, color: string }> = {
  'reclamacao': { label: 'Reclamação', color: '#f97316' },
  'denuncia': { label: 'Denúncia', color: '#ef4444' },
  'sugestao': { label: 'Sugestão', color: '#22c55e' },
  'duvida': { label: 'Dúvida', color: '#3b82f6' },
  'privacidade': { label: 'Privacidade', color: '#8b5cf6' }
}

// Mapeia status para cores e nomes mais amigáveis
const statusMap: Record<string, { label: string, color: string, bgColor: string }> = {
  'aberto': { label: 'Aberto', color: '#0369a1', bgColor: '#e0f2fe' },
  'em_analise': { label: 'Em Análise', color: '#854d0e', bgColor: '#fef9c3' },
  'respondido': { label: 'Respondido', color: '#166534', bgColor: '#dcfce7' },
  'encaminhado': { label: 'Encaminhado', color: '#581c87', bgColor: '#f3e8ff' },
  'resolvido': { label: 'Resolvido', color: '#475569', bgColor: '#f1f5f9' }
}

// Opções de status para o select
const statusOptions = [
  { value: 'aberto', label: 'Aberto' },
  { value: 'em_analise', label: 'Em Análise' },
  { value: 'respondido', label: 'Respondido' },
  { value: 'encaminhado', label: 'Encaminhado' },
  { value: 'resolvido', label: 'Resolvido' }
]

export default function TicketDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusLoading, setStatusLoading] = useState(false)
  const [responseLoading, setResponseLoading] = useState(false)
  const [response, setResponse] = useState('')
  const [internalComments, setInternalComments] = useState('')
  const [currentStatus, setCurrentStatus] = useState<string>('')

  useEffect(() => {
    async function loadTicket() {
      try {
        setLoading(true)
        const response = await fetch(`/api/admin/tickets/${params.id}`)
        
        if (!response.ok) {
          toast.error('Erro ao carregar chamado')
          return
        }
        
        const data = await response.json()
        
        if (!data.success) {
          toast.error(data.error || 'Chamado não encontrado')
          return
        }
        
        setTicket(data.ticket)
        setCurrentStatus(data.ticket.status)
      } catch (error) {
        console.error('Erro ao carregar detalhes do chamado:', error)
        toast.error('Erro ao carregar detalhes do chamado')
      } finally {
        setLoading(false)
      }
    }
    
    loadTicket()
  }, [params.id])

  const handleStatusChange = async (status: string) => {
    if (!ticket || status === ticket.status) return
    
    try {
      setStatusLoading(true)
      const response = await fetch(`/api/admin/tickets/${ticket.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          status, 
          internalComments 
        })
      })
      
      const data = await response.json()
      
      if (!data.success) {
        toast.error(data.error || 'Erro ao atualizar status')
        return
      }
      
      toast.success('Status atualizado com sucesso')
      setTicket({
        ...ticket,
        status
      })
      setCurrentStatus(status)
      setInternalComments('')
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      toast.error('Erro ao atualizar status')
    } finally {
      setStatusLoading(false)
    }
  }

  const handleResponseSubmit = async () => {
    if (!ticket || !response) return
    
    try {
      setResponseLoading(true)
      const result = await fetch(`/api/admin/tickets/${ticket.id}/response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ response })
      })
      
      const data = await result.json()
      
      if (!data.success) {
        toast.error(data.error || 'Erro ao enviar resposta')
        return
      }
      
      toast.success('Resposta enviada com sucesso')
      setTicket({
        ...ticket,
        status: 'respondido',
        response,
        responseDate: new Date().toISOString()
      })
      setCurrentStatus('respondido')
      setResponse('')
    } catch (error) {
      console.error('Erro ao enviar resposta:', error)
      toast.error('Erro ao enviar resposta')
    } finally {
      setResponseLoading(false)
    }
  }

  const formatMessageContent = (message: string) => {
    if (!message) return ''
    
    // Verifica se é uma resposta de formulário dinâmico
    if (message.startsWith('Respostas do formulário:')) {
      try {
        // Tenta extrair as respostas como JSON
        const jsonStartIndex = message.indexOf('{')
        if (jsonStartIndex !== -1) {
          const jsonStr = message.substring(jsonStartIndex)
          const formData = JSON.parse(jsonStr)
          
          return (
            <div className="space-y-3">
              <p className="font-medium">Respostas do formulário:</p>
              {Object.entries(formData).map(([question, answer], index) => (
                <div key={index} className="pl-4 border-l-2 border-neutral-200">
                  <p className="font-medium text-neutral-700">{question}</p>
                  <p className="text-neutral-600">{String(answer)}</p>
                </div>
              ))}
            </div>
          )
        }
      } catch (error) {
        // Se falhar em parsear o JSON, exibe como texto normal
        console.error('Erro ao parsear respostas do formulário:', error)
      }
    }
    
    // Caso contrário, retorna a mensagem normal com quebras de linha
    return (
      <div className="whitespace-pre-wrap">{message}</div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-neutral-600">Carregando detalhes do chamado...</p>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <p className="text-neutral-600 mb-4">Chamado não encontrado</p>
        <Button onClick={() => router.push('/admin/chamados')}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Voltar para a lista
        </Button>
      </div>
    )
  }

  const typeInfo = typeMap[ticket.type] || { label: ticket.type, color: '#3b82f6' }
  const statusInfo = statusMap[ticket.status] || { label: ticket.status, color: '#3b82f6', bgColor: '#e0f2fe' }
  const createdAt = new Date(ticket.createdAt)
  const formattedDate = createdAt.toLocaleDateString('pt-BR')
  const timeAgo = formatDistanceToNow(createdAt, { addSuffix: true, locale: ptBR })

  return (
    <div className="container py-10 max-w-5xl">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => router.push('/admin/chamados')} className="mr-4">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Detalhes do Chamado</h1>
          <p className="text-neutral-600 mt-1">
            Visualize e responda ao chamado
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="overflow-hidden">
            <div className="h-2" style={{ backgroundColor: typeInfo.color }}></div>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  Protocolo: <span className="text-primary ml-2">{ticket.protocol}</span>
                </CardTitle>
                <CardDescription className="mt-2 flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  <span className="mr-3">{timeAgo}</span>
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>{formattedDate}</span>
                </CardDescription>
              </div>
              
              <div 
                className="px-3 py-1 rounded-md text-sm font-medium"
                style={{ 
                  backgroundColor: statusInfo.bgColor,
                  color: statusInfo.color
                }}
              >
                {statusInfo.label}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="flex flex-col space-y-1">
                <div className="flex items-center mb-2">
                  <div 
                    className="px-3 py-1 rounded-md text-sm font-medium w-fit"
                    style={{ 
                      backgroundColor: `${typeInfo.color}20`,
                      color: typeInfo.color
                    }}
                  >
                    {typeInfo.label}
                  </div>
                </div>
                
                {ticket.category && (
                  <div className="flex items-center text-sm text-neutral-600">
                    <span className="font-medium mr-2">Categoria:</span>
                    <span>{ticket.category}</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start">
                  <User className="h-4 w-4 mr-2 mt-1 text-neutral-500" />
                  <div>
                    <p className="text-sm text-neutral-600 font-medium">Nome</p>
                    <p>{ticket.name || 'Não informado'}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Mail className="h-4 w-4 mr-2 mt-1 text-neutral-500" />
                  <div>
                    <p className="text-sm text-neutral-600 font-medium">Email</p>
                    <p>{ticket.email || 'Não informado'}</p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <div className="flex items-start">
                  <MessageSquare className="h-4 w-4 mr-2 mt-1 text-neutral-500" />
                  <div className="flex-1">
                    <p className="text-sm text-neutral-600 font-medium mb-2">Mensagem</p>
                    <div className="bg-neutral-50 rounded-md p-4 text-neutral-700">
                      {formatMessageContent(ticket.message || '')}
                    </div>
                  </div>
                </div>
              </div>
              
              {ticket.response && (
                <div className="space-y-3 mt-6">
                  <Separator />
                  <div className="flex items-start">
                    <FileText className="h-4 w-4 mr-2 mt-1 text-green-600" />
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <p className="text-sm text-green-700 font-medium">Resposta</p>
                        {ticket.responseDate && (
                          <p className="text-xs text-neutral-500 ml-2">
                            ({new Date(ticket.responseDate).toLocaleDateString('pt-BR')} às {new Date(ticket.responseDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})
                          </p>
                        )}
                      </div>
                      <div className="bg-green-50 border-l-2 border-green-500 rounded-md p-4 text-neutral-700">
                        <div className="whitespace-pre-wrap">{ticket.response}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Seção de Resposta */}
          {!ticket.response && ticket.status !== 'resolvido' && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Responder ao Chamado</CardTitle>
                <CardDescription>
                  Responda ao chamado do usuário. A resposta será enviada por email.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Digite sua resposta..."
                  className="min-h-[150px]"
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                />
              </CardContent>
              <CardFooter className="flex justify-between">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="default" disabled={!response || responseLoading}>
                      {responseLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Enviar Resposta
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar envio de resposta</AlertDialogTitle>
                      <AlertDialogDescription>
                        A resposta será enviada ao usuário por email e o status do chamado será alterado para &quot;Respondido&quot;.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleResponseSubmit}>Confirmar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          )}
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Gerenciamento do Chamado</CardTitle>
              <CardDescription>
                Acompanhe o progresso e gerencie o chamado
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Timeline de progresso do chamado */}
              <TicketTimeline 
                currentStatus={ticket.status}
                statusHistory={ticket.statusHistory}
                createdAt={ticket.createdAt}
                resolvedAt={ticket.status === 'resolvido' ? ticket.updatedAt : undefined}
              />
              
              <Separator className="my-6" />
              
              {/* Controles para atualizar o status */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Atualizar status</label>
                  <Select
                    value={currentStatus}
                    onValueChange={setCurrentStatus}
                    disabled={statusLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {currentStatus !== ticket.status && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Comentário interno</label>
                    <Textarea
                      placeholder="Comentário interno sobre a mudança de status (opcional)"
                      className="min-h-[100px]"
                      value={internalComments}
                      onChange={(e) => setInternalComments(e.target.value)}
                    />
                  </div>
                )}
                
                <Button 
                  onClick={() => handleStatusChange(currentStatus)}
                  disabled={statusLoading || currentStatus === ticket.status}
                  className="w-full"
                >
                  {statusLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Atualizar Status
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Toaster position="top-right" richColors />
    </div>
  )
} 