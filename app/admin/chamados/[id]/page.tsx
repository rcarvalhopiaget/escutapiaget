'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ChevronLeft, Save, Trash2, Loader2, Info } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Toaster } from '@/components/ui/sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { Ticket, TicketStatus, TicketType } from '@/app/types/ticket'

// A função principal agora serve como wrapper
export default function TicketEditPageWrapper({ params }: { params: any }) {
  // Em um componente cliente, não usamos use() diretamente
  // Em vez disso, vamos passar params como prop para o componente interno
  return <TicketEditPage paramsId={params?.id} />
}

// Componente interno separado que recebe o ID como string
function TicketEditPage({ paramsId }: { paramsId: string }) {
  const router = useRouter()
  const ticketId = paramsId || 'novo'
  const isNewTicket = ticketId === 'novo'
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const [ticket, setTicket] = useState<Ticket>({
    id: '',
    protocol: '',
    type: TicketType.DUVIDA,
    category: '',
    status: TicketStatus.ABERTO,
    name: '',
    email: '',
    message: '',
    response: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  useEffect(() => {
    if (isNewTicket) {
      // Gerar novo protocolo para novos tickets
      const date = new Date()
      const day = date.getDate().toString().padStart(2, '0')
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const year = date.getFullYear().toString().substring(2)
      const hours = date.getHours().toString().padStart(2, '0')
      const minutes = date.getMinutes().toString().padStart(2, '0')
      const seconds = date.getSeconds().toString().padStart(2, '0')
      
      const protocol = `${day}${month}${year}-${hours}${minutes}${seconds}`
      
      setTicket(prev => ({
        ...prev,
        protocol
      }))
      
      setIsLoading(false)
      return
    }
    
    // Buscar dados do chamado existente
    const fetchTicket = async () => {
      try {
        const response = await fetch(`/api/admin/tickets/${ticketId}`)
        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.error || 'Erro ao carregar chamado')
        }
        
        setTicket(data.ticket)
      } catch (error) {
        console.error('Erro ao carregar chamado:', error)
        toast.error('Erro ao carregar chamado', {
          description: 'Não foi possível obter os dados do chamado'
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchTicket()
  }, [ticketId, isNewTicket])

  const handleChange = (
    field: keyof Ticket,
    value: string | TicketType | TicketStatus
  ) => {
    setTicket(prev => {
      // Se o campo sendo alterado é a resposta e está sendo preenchido
      if (field === 'response' && 
          typeof value === 'string' && 
          value.trim() !== '' && 
          prev.status !== TicketStatus.ENCAMINHADO) {
        // Atualiza automaticamente o status para respondido
        return { ...prev, [field]: value, status: TicketStatus.RESPONDIDO }
      }
      return { ...prev, [field]: value }
    })
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      
      // Validar os campos obrigatórios
      if (!ticket.protocol || !ticket.type || !ticket.status || !ticket.message) {
        toast.error('Preencha todos os campos obrigatórios')
        return
      }
      
      // Definir a URL e método com base em novo chamado ou edição
      const url = isNewTicket 
        ? '/api/admin/tickets' 
        : `/api/admin/tickets/${ticketId}`
      
      const method = isNewTicket ? 'POST' : 'PUT'
      
      // Enviar solicitação
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ticket)
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao salvar chamado')
      }
      
      toast.success(
        isNewTicket ? 'Chamado criado com sucesso' : 'Chamado atualizado com sucesso'
      )
      
      // Redirecionar para a lista de chamados após um tempo
      setTimeout(() => {
        router.push('/admin')
      }, 1500)
    } catch (error) {
      console.error('Erro ao salvar chamado:', error)
      toast.error('Erro ao salvar chamado')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      
      const response = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao excluir chamado')
      }
      
      toast.success('Chamado excluído com sucesso')
      
      // Redirecionar para a lista de chamados após um tempo
      setTimeout(() => {
        router.push('/admin')
      }, 1500)
    } catch (error) {
      console.error('Erro ao excluir chamado:', error)
      toast.error('Erro ao excluir chamado')
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const handleCancel = () => {
    router.push('/admin')
  }

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-10 flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
        <span className="ml-2 text-neutral-500">Carregando chamado...</span>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-6">
        <Button variant="ghost" onClick={handleCancel}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Voltar para chamados
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{isNewTicket ? 'Novo Chamado' : 'Editar Chamado'}</CardTitle>
          <CardDescription>
            {isNewTicket
              ? 'Preencha os campos para criar um novo chamado'
              : `Editando chamado com protocolo ${ticket.protocol}`}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="protocol">Protocolo</Label>
              <Input
                id="protocol"
                value={ticket.protocol}
                onChange={(e) => handleChange('protocol', e.target.value)}
                disabled={!isNewTicket}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select
                value={ticket.type}
                onValueChange={(value) => handleChange('type', value as TicketType)}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Selecione um tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="reclamacao" value={TicketType.RECLAMACAO}>Reclamação</SelectItem>
                  <SelectItem key="denuncia" value={TicketType.DENUNCIA}>Denúncia</SelectItem>
                  <SelectItem key="sugestao" value={TicketType.SUGESTAO}>Sugestão</SelectItem>
                  <SelectItem key="duvida" value={TicketType.DUVIDA}>Dúvida</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Input
                id="category"
                value={ticket.category || ''}
                onChange={(e) => handleChange('category', e.target.value)}
                placeholder="Ex: atendimento, ensino, etc."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={ticket.status}
                onValueChange={(value) => handleChange('status', value as TicketStatus)}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Selecione um status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="aberto" value={TicketStatus.ABERTO}>Aberto</SelectItem>
                  <SelectItem key="em_analise" value={TicketStatus.EM_ANALISE}>Em Análise</SelectItem>
                  <SelectItem key="respondido" value={TicketStatus.RESPONDIDO}>Respondido</SelectItem>
                  <SelectItem key="encaminhado" value={TicketStatus.ENCAMINHADO}>Encaminhado</SelectItem>
                  <SelectItem key="resolvido" value={TicketStatus.RESOLVIDO}>Resolvido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={ticket.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Nome do solicitante"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={ticket.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="E-mail do solicitante"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">Mensagem</Label>
            <Textarea
              id="message"
              value={ticket.message || ''}
              onChange={(e) => handleChange('message', e.target.value)}
              placeholder="Conteúdo da mensagem"
              rows={5}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="response">Resposta</Label>
            <Textarea
              id="response"
              value={ticket.response || ''}
              onChange={(e) => handleChange('response', e.target.value)}
              placeholder="Resposta ao chamado"
              rows={5}
            />
            {ticket.status !== TicketStatus.ENCAMINHADO && !ticket.response && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md flex items-start">
                <div className="text-blue-600 mr-2 mt-0.5">
                  <Info className="h-4 w-4" />
                </div>
                <div className="text-sm text-blue-700">
                  Ao adicionar uma resposta, o status será alterado automaticamente para "Respondido".
                </div>
              </div>
            )}
          </div>

          {!isNewTicket && ticket.status !== TicketStatus.RESOLVIDO && ticket.response && (
            <div className="flex justify-center">
              <Button 
                variant="outline" 
                className="bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                onClick={() => handleChange('status', TicketStatus.RESOLVIDO)}
              >
                <Info className="h-4 w-4 mr-2" />
                Marcar como Resolvido
              </Button>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          {!isNewTicket && (
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          )}
          
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
      
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir chamado</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o chamado com protocolo <span className="font-mono font-semibold">{ticket.protocol}</span>?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Excluir'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Toaster position="top-right" richColors />
    </div>
  )
} 