'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Sector
} from 'recharts'
import { TicketStatus, TicketType } from '@/app/types/ticket'

// Definindo cores para os tipos de chamados
const TYPE_COLORS = {
  [TicketType.RECLAMACAO]: '#f97316', // Laranja
  [TicketType.DENUNCIA]: '#ef4444',   // Vermelho
  [TicketType.SUGESTAO]: '#22c55e',   // Verde
  [TicketType.DUVIDA]: '#3b82f6',     // Azul
  [TicketType.PRIVACIDADE]: '#8b5cf6', // Roxo
}

// Definindo cores para os status de chamados
const STATUS_COLORS = {
  [TicketStatus.ABERTO]: '#0369a1',     // Azul
  [TicketStatus.EM_ANALISE]: '#ca8a04',  // Amarelo
  [TicketStatus.RESPONDIDO]: '#16a34a',  // Verde
  [TicketStatus.ENCAMINHADO]: '#9333ea', // Roxo
  [TicketStatus.RESOLVIDO]: '#64748b',   // Cinza
}

// Nome amigável para os tipos de chamados
const TYPE_LABELS = {
  [TicketType.RECLAMACAO]: 'Reclamação',
  [TicketType.DENUNCIA]: 'Denúncia',
  [TicketType.SUGESTAO]: 'Sugestão',
  [TicketType.DUVIDA]: 'Dúvida',
  [TicketType.PRIVACIDADE]: 'Privacidade',
}

// Nome amigável para os status de chamados
const STATUS_LABELS = {
  [TicketStatus.ABERTO]: 'Aberto',
  [TicketStatus.EM_ANALISE]: 'Em Análise',
  [TicketStatus.RESPONDIDO]: 'Respondido',
  [TicketStatus.ENCAMINHADO]: 'Encaminhado',
  [TicketStatus.RESOLVIDO]: 'Resolvido',
}

interface Ticket {
  id: string
  type: TicketType
  status: TicketStatus
  createdAt: string
  category?: string
}

interface DashboardChartsProps {
  tickets: Ticket[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border rounded-md shadow-sm">
        <p className="font-semibold">{`${label}: ${payload[0].value}`}</p>
      </div>
    )
  }
  return null
}

export function DashboardCharts({ tickets }: DashboardChartsProps) {
  // Preparar dados para gráfico de tipos de chamados
  const typeData = React.useMemo(() => {
    const typeCounts: Record<string, number> = {}
    
    // Inicializa todos os tipos com 0
    Object.values(TicketType).forEach(type => {
      typeCounts[type] = 0
    })
    
    // Conta ocorrências
    tickets.forEach(ticket => {
      typeCounts[ticket.type] = (typeCounts[ticket.type] || 0) + 1
    })
    
    // Converte para o formato de dados do Recharts
    return Object.entries(typeCounts).map(([type, count]) => ({
      name: TYPE_LABELS[type as TicketType] || type,
      value: count,
      color: TYPE_COLORS[type as TicketType] || '#9ca3af',
    }))
  }, [tickets])
  
  // Preparar dados para gráfico de status de chamados
  const statusData = React.useMemo(() => {
    const statusCounts: Record<string, number> = {}
    
    // Inicializa todos os status com 0
    Object.values(TicketStatus).forEach(status => {
      statusCounts[status] = 0
    })
    
    // Conta ocorrências
    tickets.forEach(ticket => {
      statusCounts[ticket.status] = (statusCounts[ticket.status] || 0) + 1
    })
    
    // Converte para o formato de dados do Recharts
    return Object.entries(statusCounts).map(([status, count]) => ({
      name: STATUS_LABELS[status as TicketStatus] || status,
      value: count,
      color: STATUS_COLORS[status as TicketStatus] || '#9ca3af',
    }))
  }, [tickets])
  
  // Preparar dados para gráfico de evolução mensal
  const timelineData = React.useMemo(() => {
    const monthCounts: Record<string, { total: number, [key: string]: number }> = {}
    
    // Ordena tickets por data de criação
    const sortedTickets = [...tickets].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
    
    // Conta os chamados por mês e tipo
    sortedTickets.forEach(ticket => {
      const date = new Date(ticket.createdAt)
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
      
      if (!monthCounts[monthKey]) {
        monthCounts[monthKey] = { 
          total: 0,
          [TicketType.RECLAMACAO]: 0,
          [TicketType.DENUNCIA]: 0,
          [TicketType.SUGESTAO]: 0, 
          [TicketType.DUVIDA]: 0,
          [TicketType.PRIVACIDADE]: 0
        }
      }
      
      monthCounts[monthKey].total += 1
      monthCounts[monthKey][ticket.type] = (monthCounts[monthKey][ticket.type] || 0) + 1
    })
    
    // Formata para exibição no gráfico
    return Object.entries(monthCounts).map(([month, data]) => {
      const [year, monthNum] = month.split('-')
      const monthName = new Date(parseInt(year), parseInt(monthNum) - 1, 1)
        .toLocaleDateString('pt-BR', { month: 'short' })
      
      return {
        name: `${monthName}/${year.substring(2)}`,
        total: data.total,
        reclamacao: data[TicketType.RECLAMACAO] || 0,
        denuncia: data[TicketType.DENUNCIA] || 0,
        sugestao: data[TicketType.SUGESTAO] || 0,
        duvida: data[TicketType.DUVIDA] || 0,
        privacidade: data[TicketType.PRIVACIDADE] || 0,
      }
    })
  }, [tickets])
  
  // Se não houver dados, mostrar mensagem
  if (!tickets.length) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Estatísticas de Chamados</CardTitle>
          <CardDescription>
            Não há dados disponíveis para visualização.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }
  
  return (
    <Tabs defaultValue="type" className="col-span-full">
      <CardHeader className="px-0 pt-0">
        <div className="flex items-center justify-between">
          <CardTitle>Estatísticas de Chamados</CardTitle>
          <TabsList>
            <TabsTrigger value="type">Por Tipo</TabsTrigger>
            <TabsTrigger value="status">Por Status</TabsTrigger>
            <TabsTrigger value="timeline">Evolução Mensal</TabsTrigger>
          </TabsList>
        </div>
        <CardDescription>
          Visualização estatística dos chamados registrados no sistema.
        </CardDescription>
      </CardHeader>
      
      <TabsContent value="type" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Tipo de Chamado</CardTitle>
            <CardDescription>
              Quantidade de chamados agrupados por categoria
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(value, entry, index) => <span className="text-sm">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="status" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Status</CardTitle>
            <CardDescription>
              Quantidade de chamados em cada fase do atendimento
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={statusData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  tick={{ fontSize: 14 }} 
                  width={100} 
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="value" 
                  fill="#8884d8" 
                  barSize={30}
                  radius={[0, 4, 4, 0]}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="timeline" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Evolução Mensal de Chamados</CardTitle>
            <CardDescription>
              Acompanhamento da quantidade de chamados ao longo do tempo
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={timelineData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="total"
                  name="Total"
                  stroke="#64748b"
                  strokeWidth={2}
                  activeDot={{ r: 8 }}
                />
                <Line
                  type="monotone"
                  dataKey="reclamacao"
                  name="Reclamações"
                  stroke={TYPE_COLORS[TicketType.RECLAMACAO]}
                />
                <Line
                  type="monotone"
                  dataKey="denuncia"
                  name="Denúncias"
                  stroke={TYPE_COLORS[TicketType.DENUNCIA]}
                />
                <Line
                  type="monotone"
                  dataKey="sugestao"
                  name="Sugestões"
                  stroke={TYPE_COLORS[TicketType.SUGESTAO]}
                />
                <Line
                  type="monotone"
                  dataKey="duvida"
                  name="Dúvidas"
                  stroke={TYPE_COLORS[TicketType.DUVIDA]}
                />
                <Line
                  type="monotone"
                  dataKey="privacidade"
                  name="Privacidade"
                  stroke={TYPE_COLORS[TicketType.PRIVACIDADE]}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
} 