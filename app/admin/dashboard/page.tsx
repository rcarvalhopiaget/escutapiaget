'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Loader2, 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown, 
  XCircle 
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart, 
  Pie, 
  Legend 
} from 'recharts'

import { Ticket, TicketStatus } from '@/app/types/ticket'

// Tipos de período para filtragem
type PeriodOption = '7' | '30' | '90' | '180' | '365'

export default function DashboardPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [period, setPeriod] = useState<PeriodOption>('90')
  
  // Efeito para redirecionar se não estiver autenticado
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login')
    }
  }, [status, router])
  
  // Função para buscar os tickets
  const fetchTickets = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/tickets')
      const data = await response.json()
      
      if (response.ok) {
        setTickets(data.tickets || [])
      } else {
        console.error('Erro ao buscar tickets:', data.error)
      }
    } catch (error) {
      console.error('Erro ao buscar tickets:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Buscar tickets ao carregar a página
  useEffect(() => {
    if (status === 'authenticated') {
      fetchTickets()
    }
  }, [status])
  
  // Filtrar tickets pelo período selecionado
  const filteredTickets = tickets.filter(ticket => {
    const ticketDate = new Date(ticket.createdAt)
    const now = new Date()
    const periodDays = parseInt(period)
    const periodDate = new Date(now.setDate(now.getDate() - periodDays))
    
    return ticketDate >= periodDate
  })
  
  // Contagem de tickets por status
  const countByStatus = {
    aberto: filteredTickets.filter(t => t.status === TicketStatus.ABERTO).length,
    emAnalise: filteredTickets.filter(t => t.status === TicketStatus.EM_ANALISE).length,
    respondido: filteredTickets.filter(t => t.status === TicketStatus.RESPONDIDO).length,
    encaminhado: filteredTickets.filter(t => t.status === TicketStatus.ENCAMINHADO).length,
    resolvido: filteredTickets.filter(t => t.status === TicketStatus.RESOLVIDO).length
  }
  
  // Dados para o gráfico de distribuição por status
  const statusChartData = [
    { name: 'Abertos', value: countByStatus.aberto, color: '#3b82f6' },
    { name: 'Em Análise', value: countByStatus.emAnalise, color: '#eab308' },
    { name: 'Respondidos', value: countByStatus.respondido, color: '#10b981' },
    { name: 'Encaminhados', value: countByStatus.encaminhado, color: '#ec4899' },
    { name: 'Resolvidos', value: countByStatus.resolvido, color: '#64748b' }
  ].filter(item => item.value > 0)
  
  // Dados para gráfico por tipo de chamado
  const typeChartData = [
    { name: 'Reclamação', count: filteredTickets.filter(t => t.type === 'reclamacao').length },
    { name: 'Denúncia', count: filteredTickets.filter(t => t.type === 'denuncia').length },
    { name: 'Sugestão', count: filteredTickets.filter(t => t.type === 'sugestao').length },
    { name: 'Dúvida', count: filteredTickets.filter(t => t.type === 'duvida').length }
  ]
  
  // Cores para os gráficos
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']
  
  // Simulando contagens para categorias específicas (adaptar conforme necessário)
  const procedentesTotalmente = 0
  const procedentesParcialmente = 0
  const improcedentesDadosInsuf = 0
  const improcedentesTotalmente = 0
  const descartadosNaoQualif = 0
  const descartadosTotalmente = 0
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    )
  }
  
  return (
    <div className="container py-10 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Período:</span>
          <Select
            value={period}
            onValueChange={(value) => setPeriod(value as PeriodOption)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="180">Últimos 180 dias</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Cards com métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {/* Card de total de chamados no período */}
        <Card className="bg-blue-500 text-white overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-lg font-medium">
              <MessageSquare className="h-5 w-5 mr-2" />
              Relatos no período
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <p className="text-6xl font-bold">{filteredTickets.length}</p>
            </div>
          </CardContent>
        </Card>
        
        {/* Card de procedentes */}
        <Card className="bg-green-600 text-white overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-lg font-medium">
              <ThumbsUp className="h-5 w-5 mr-2" />
              Procedentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-5xl font-bold">{procedentesTotalmente}</p>
                <p className="text-sm mt-1">totalmente</p>
              </div>
              <div>
                <p className="text-5xl font-bold">{procedentesParcialmente}</p>
                <p className="text-sm mt-1">parcialmente</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Card de improcedentes */}
        <Card className="bg-yellow-500 text-white overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-lg font-medium">
              <ThumbsDown className="h-5 w-5 mr-2" />
              Improcedentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-5xl font-bold">{improcedentesTotalmente}</p>
                <p className="text-sm mt-1">totalmente</p>
              </div>
              <div>
                <p className="text-5xl font-bold">{improcedentesDadosInsuf}</p>
                <p className="text-sm mt-1">dados insuf.</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Card de descartados */}
        <Card className="bg-red-500 text-white overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-lg font-medium">
              <XCircle className="h-5 w-5 mr-2" />
              Descartados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-5xl font-bold">{descartadosNaoQualif}</p>
                <p className="text-sm mt-1">não qualif.</p>
              </div>
              <div>
                <p className="text-5xl font-bold">{descartadosTotalmente}</p>
                <p className="text-sm mt-1">totalmente</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gráfico de Relatos por Conclusão */}
        <Card>
          <CardHeader>
            <CardTitle>Relatos por Conclusão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={typeChartData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6">
                    {typeChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Gráfico de Distribuição de Status */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Status dos Relatos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                {statusChartData.length > 0 ? (
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({name, percent}: {name: string, percent: number}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {statusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-neutral-500">Sem dados para exibir</p>
                  </div>
                )}
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 