'use client'

import { useState } from 'react'
import { MoreHorizontal, Eye, Edit, Trash2, MessageSquare, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Ticket, TicketStatus } from '@/app/types/ticket'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface TicketActionsProps {
  ticket: Ticket
  onStatusChange?: () => void
}

export function TicketActions({ ticket, onStatusChange }: TicketActionsProps) {
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showRespondDialog, setShowRespondDialog] = useState(false)
  const [showFinalizeDialog, setShowFinalizeDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isResponding, setIsResponding] = useState(false)
  const [isFinalizing, setIsFinalizing] = useState(false)
  const [responseText, setResponseText] = useState('')

  const handleView = () => {
    router.push(`/chamados/protocolo?protocolo=${ticket.protocol}`)
  }

  const handleEdit = () => {
    router.push(`/admin/chamados/${ticket.id}`)
  }

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      const response = await fetch(`/api/admin/tickets/${ticket.id}`, {
        method: 'DELETE',
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao excluir chamado')
      }
      
      setShowDeleteDialog(false)
      toast.success('Chamado excluído com sucesso')
      
      if (onStatusChange) {
        onStatusChange()
      }
    } catch (error) {
      console.error('Erro ao excluir chamado:', error)
      toast.error('Erro ao excluir chamado')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleRespond = async () => {
    if (!responseText.trim()) {
      toast.error('Digite uma resposta para o chamado')
      return
    }
    
    try {
      setIsResponding(true)
      const response = await fetch(`/api/admin/tickets/${ticket.id}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          response: responseText,
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao responder chamado')
      }
      
      setShowRespondDialog(false)
      setResponseText('')
      toast.success('Resposta enviada com sucesso')
      
      if (onStatusChange) {
        onStatusChange()
      }
    } catch (error) {
      console.error('Erro ao responder chamado:', error)
      toast.error('Erro ao enviar resposta')
    } finally {
      setIsResponding(false)
    }
  }

  const handleFinalize = async () => {
    try {
      setIsFinalizing(true)
      const response = await fetch(`/api/admin/tickets/${ticket.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: TicketStatus.RESOLVIDO,
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao finalizar chamado')
      }
      
      setShowFinalizeDialog(false)
      toast.success('Chamado finalizado com sucesso')
      
      if (onStatusChange) {
        onStatusChange()
      }
    } catch (error) {
      console.error('Erro ao finalizar chamado:', error)
      toast.error('Erro ao finalizar chamado')
    } finally {
      setIsFinalizing(false)
    }
  }

  // Verifica se o chamado já foi finalizado
  const isResolved = ticket.status === TicketStatus.RESOLVIDO
  
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleView}>
            <Eye className="mr-2 h-4 w-4" />
            Visualizar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
          
          {!isResolved && (
            <>
              <DropdownMenuItem onClick={() => setShowRespondDialog(true)}>
                <MessageSquare className="mr-2 h-4 w-4 text-green-600" />
                <span className="text-green-600">Responder</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => setShowFinalizeDialog(true)}>
                <CheckCircle className="mr-2 h-4 w-4 text-blue-600" />
                <span className="text-blue-600">Finalizar</span>
              </DropdownMenuItem>
            </>
          )}
          
          <DropdownMenuItem 
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Diálogo de exclusão */}
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
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                  Excluindo...
                </>
              ) : (
                'Excluir'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de resposta */}
      <Dialog open={showRespondDialog} onOpenChange={setShowRespondDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Responder ao chamado</DialogTitle>
            <DialogDescription>
              Forneça uma resposta para o chamado com protocolo <span className="font-mono font-semibold">{ticket.protocol}</span>.
              O status será alterado para "Respondido" automaticamente.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="response">Resposta</Label>
              <Textarea
                id="response"
                placeholder="Digite sua resposta aqui..."
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                rows={5}
                className="resize-none"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRespondDialog(false)}
              disabled={isResponding}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleRespond}
              disabled={isResponding || !responseText.trim()}
            >
              {isResponding ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                  Enviando...
                </>
              ) : (
                'Enviar resposta'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de finalização */}
      <Dialog open={showFinalizeDialog} onOpenChange={setShowFinalizeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar chamado</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja finalizar o chamado com protocolo <span className="font-mono font-semibold">{ticket.protocol}</span>?
              O status será alterado para "Resolvido".
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowFinalizeDialog(false)}
              disabled={isFinalizing}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleFinalize}
              disabled={isFinalizing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isFinalizing ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                  Finalizando...
                </>
              ) : (
                'Finalizar chamado'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 