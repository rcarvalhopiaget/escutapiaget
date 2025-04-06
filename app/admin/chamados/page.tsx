'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { PlusCircle, Download, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Toaster } from '@/components/ui/sonner'
import { DataTable } from '@/app/components/ui/data-table'

import { ticketColumns } from './columns'
import { Ticket } from '@/app/types/ticket'

// Função utilitária para converter chamados para CSV
function convertToCSV(tickets: Ticket[]) {
  if (!tickets.length) return ''
  
  // Define cabeçalhos do CSV
  const headers = [
    'Protocolo',
    'Data',
    'Tipo',
    'Categoria',
    'Nome',
    'Email',
    'Status',
    'Mensagem'
  ]
  
  // Mapeia os tipos de chamado
  const typeMap: Record<string, string> = {
    'reclamacao': 'Reclamação',
    'denuncia': 'Denúncia',
    'sugestao': 'Sugestão',
    'duvida': 'Dúvida'
  }
  
  // Mapeia os status
  const statusMap: Record<string, string> = {
    'aberto': 'Aberto',
    'em_analise': 'Em Análise',
    'respondido': 'Respondido',
    'encaminhado': 'Encaminhado'
  }
  
  // Formata os dados dos chamados
  const rows = tickets.map(ticket => {
    const createdAt = new Date(ticket.createdAt)
    const formattedDate = `${createdAt.toLocaleDateString('pt-BR')} ${createdAt.toLocaleTimeString('pt-BR')}`
    
    // Escapa aspas duplas em campos de texto
    const escapeField = (field: string) => {
      if (!field) return ''
      return `"${field.replace(/"/g, '""')}"`
    }
    
    return [
      ticket.protocol,
      formattedDate,
      typeMap[ticket.type] || ticket.type,
      ticket.category ? ticket.category.replace('_', ' ') : '',
      escapeField(ticket.name || ''),
      escapeField(ticket.email || ''),
      statusMap[ticket.status] || ticket.status,
      escapeField(ticket.message || '')
    ].join(',')
  })
  
  // Junta cabeçalhos e linhas
  return [headers.join(','), ...rows].join('\n')
}

// Função para download do CSV
function downloadCSV(csvContent: string, filename: string) {
  // Adiciona BOM para caracteres especiais serem exibidos corretamente no Excel
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export default function ChamadosPage() {
  const router = useRouter()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')

  const fetchTickets = async () => {
    try {
      setIsLoading(true)
      
      // Filtrar por status dependendo da aba
      const filters = activeTab !== 'all' ? `?status=${activeTab}` : ''
      
      // Chamando a API
      const response = await fetch(`/api/admin/tickets${filters}`)
      const result = await response.json()
      
      if (!response.ok) {
        toast.error('Erro ao carregar chamados', {
          description: result.error || 'Não foi possível carregar os chamados'
        })
        return
      }
      
      setTickets(result.tickets || [])
    } catch (error) {
      console.error('Erro ao buscar chamados:', error)
      toast.error('Erro ao carregar chamados', {
        description: 'Ocorreu um erro ao carregar os chamados'
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [activeTab])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  const handleExportCSV = () => {
    try {
      if (!tickets.length) {
        toast.error('Nenhum chamado disponível para exportação')
        return
      }
      
      toast.info('Preparando exportação...')
      
      // Gera o conteúdo CSV
      const csvContent = convertToCSV(tickets)
      
      // Define o nome do arquivo com data e hora
      const date = new Date()
      const formattedDate = `${date.getDate().toString().padStart(2, '0')}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getFullYear()}`
      const formattedTime = `${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}`
      const filename = `chamados_${formattedDate}_${formattedTime}.csv`
      
      // Realiza o download
      downloadCSV(csvContent, filename)
      
      toast.success('Exportação concluída com sucesso')
    } catch (error) {
      console.error('Erro ao exportar chamados:', error)
      toast.error('Erro ao exportar chamados para CSV')
    }
  }

  const handleAddTicket = () => {
    router.push('/admin/chamados/novo')
  }

  return (
    <div className="container py-10 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Chamados</h1>
          <p className="text-neutral-600 mt-1">
            Gerencie todos os chamados recebidos pela escola
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button onClick={handleAddTicket}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Novo Chamado
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" onValueChange={handleTabChange}>
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="all">
              Todos
              <Badge variant="outline" className="ml-2">
                {tickets.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="aberto">
              Abertos
              <Badge variant="outline" className="ml-2">
                {tickets.filter(t => t.status === 'aberto').length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="em_analise">
              Em Análise
              <Badge variant="outline" className="ml-2">
                {tickets.filter(t => t.status === 'em_analise').length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="respondido">
              Respondidos
              <Badge variant="outline" className="ml-2">
                {tickets.filter(t => t.status === 'respondido').length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="encaminhado">
              Encaminhados
              <Badge variant="outline" className="ml-2">
                {tickets.filter(t => t.status === 'encaminhado').length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="resolvido">
              Resolvidos
              <Badge variant="outline" className="ml-2">
                {tickets.filter(t => t.status === 'resolvido').length}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="mt-4">
          <div className="rounded-md border">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
                <span className="ml-2 text-neutral-500">Carregando chamados...</span>
              </div>
            ) : (
              <DataTable
                columns={ticketColumns}
                data={tickets}
                searchColumn="protocol"
                searchPlaceholder="Buscar por protocolo..."
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="aberto" className="mt-4">
          <div className="rounded-md border">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
                <span className="ml-2 text-neutral-500">Carregando chamados...</span>
              </div>
            ) : (
              <DataTable
                columns={ticketColumns}
                data={tickets.filter(t => t.status === 'aberto')}
                searchColumn="protocol"
                searchPlaceholder="Buscar por protocolo..."
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="em_analise" className="mt-4">
          <div className="rounded-md border">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
                <span className="ml-2 text-neutral-500">Carregando chamados...</span>
              </div>
            ) : (
              <DataTable
                columns={ticketColumns}
                data={tickets.filter(t => t.status === 'em_analise')}
                searchColumn="protocol"
                searchPlaceholder="Buscar por protocolo..."
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="respondido" className="mt-4">
          <div className="rounded-md border">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
                <span className="ml-2 text-neutral-500">Carregando chamados...</span>
              </div>
            ) : (
              <DataTable
                columns={ticketColumns}
                data={tickets.filter(t => t.status === 'respondido')}
                searchColumn="protocol"
                searchPlaceholder="Buscar por protocolo..."
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="encaminhado" className="mt-4">
          <div className="rounded-md border">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
                <span className="ml-2 text-neutral-500">Carregando chamados...</span>
              </div>
            ) : (
              <DataTable
                columns={ticketColumns}
                data={tickets.filter(t => t.status === 'encaminhado')}
                searchColumn="protocol"
                searchPlaceholder="Buscar por protocolo..."
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="resolvido" className="mt-4">
          <div className="rounded-md border">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
                <span className="ml-2 text-neutral-500">Carregando chamados...</span>
              </div>
            ) : (
              <DataTable
                columns={ticketColumns}
                data={tickets.filter(t => t.status === 'resolvido')}
                searchColumn="protocol"
                searchPlaceholder="Buscar por protocolo..."
              />
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      <Toaster position="top-right" richColors />
    </div>
  )
} 