'use client'

import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TicketActions } from '@/app/components/chamados/ticket-actions'
import { Ticket, TicketStatus, TicketType } from '@/app/types/ticket'

// Mapeamento dos tipos de chamado para texto em português
const typeText: Record<TicketType, string> = {
  [TicketType.RECLAMACAO]: 'Reclamação',
  [TicketType.DENUNCIA]: 'Denúncia',
  [TicketType.SUGESTAO]: 'Sugestão',
  [TicketType.DUVIDA]: 'Dúvida',
  [TicketType.PRIVACIDADE]: 'Privacidade'
}

// Mapeamento dos status para texto e cores
const statusConfig: Record<TicketStatus, { text: string; variant: 'default' | 'outline' | 'secondary' | 'destructive' }> = {
  [TicketStatus.ABERTO]: { 
    text: 'Aberto', 
    variant: 'default' 
  },
  [TicketStatus.EM_ANALISE]: { 
    text: 'Em Análise', 
    variant: 'secondary' 
  },
  [TicketStatus.RESPONDIDO]: { 
    text: 'Respondido', 
    variant: 'outline' 
  },
  [TicketStatus.ENCAMINHADO]: { 
    text: 'Encaminhado', 
    variant: 'destructive' 
  },
  [TicketStatus.RESOLVIDO]: { 
    text: 'Resolvido', 
    variant: 'outline' 
  }
}

export const ticketColumns: ColumnDef<Ticket>[] = [
  // Coluna de Protocolo (ordenável)
  {
    accessorKey: 'protocol',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Protocolo
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <span className="font-mono">{row.getValue('protocol')}</span>,
  },
  
  // Coluna de Data (ordenável)
  {
    accessorKey: 'createdAt',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Data
          <Calendar className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const createdAt = new Date(row.getValue('createdAt'))
      return (
        <div>
          {format(createdAt, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
        </div>
      )
    },
  },
  
  // Coluna de Tipo
  {
    accessorKey: 'type',
    header: 'Tipo',
    cell: ({ row }) => {
      const type = row.getValue('type') as TicketType
      return <div>{typeText[type]}</div>
    },
  },
  
  // Coluna de Categoria
  {
    accessorKey: 'category',
    header: 'Categoria',
    cell: ({ row }) => {
      const category = row.getValue('category') as string
      return <div className="capitalize">{category.replace('_', ' ')}</div>
    },
  },
  
  // Coluna de Nome
  {
    accessorKey: 'name',
    header: 'Nome',
    cell: ({ row }) => {
      const name = row.getValue('name') as string
      return <div>{name || '-'}</div>
    },
  },
  
  // Coluna de Email
  {
    accessorKey: 'email',
    header: 'E-mail',
    cell: ({ row }) => {
      const email = row.getValue('email') as string
      return <div>{email || '-'}</div>
    },
  },
  
  // Coluna de Status
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as TicketStatus
      const config = statusConfig[status]
      
      return (
        <Badge variant={config.variant}>
          {config.text}
        </Badge>
      )
    },
  },
  
  // Coluna de Ações
  {
    id: 'actions',
    cell: ({ row }) => {
      return <TicketActions ticket={row.original} />
    },
  },
] 