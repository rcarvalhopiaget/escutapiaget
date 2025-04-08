'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
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
import { AdminHeader } from '@/components/admin/admin-header'
import AuthGuard from '../components/auth-guard'

// Tipos de período para filtragem
type PeriodOption = '7' | '30' | '90' | '180' | '365'

export default function DashboardPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(true)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [period, setPeriod] = useState<PeriodOption>('90')
  
  // Efeito para redirecionar se não estiver autenticado OU não tiver permissão
  useEffect(() => {
    // Esperar o status ser determinado
    if (status === 'loading') {
      console.log('[DashboardPage] Carregando status de autenticação...')
      return;
    }
    
    // Se não autenticado, redirecionar para login
    if (status === 'unauthenticated') {
      console.log('[DashboardPage] Usuário não autenticado. Redirecionando para login.')
      // Adicionar timestamp para evitar cache
      const timestamp = new Date().getTime();
      window.location.href = `/admin/login?from=/admin/dashboard&t=${timestamp}`
      return;
    }
    
    // Se autenticado, verificar permissões
    if (status === 'authenticated') {
      console.log('[DashboardPage] Usuário autenticado:', session?.user?.email)
      console.log('[DashboardPage] Role do usuário:', session?.user?.role)
      console.log('[DashboardPage] Permissões:', JSON.stringify(session?.user?.permissions))
      
      // Verificar se a sessão tem propriedade role definida
      if (!session?.user?.role) {
        console.log('[DashboardPage] ALERTA: Sessão não tem propriedade role definida')
        console.log('[DashboardPage] Sessão completa:', JSON.stringify(session))
        toast.error('Erro de Sessão', { 
          description: 'Sua sessão não tem as informações necessárias. Tente fazer login novamente.' 
        })
        
        // Redirecionar para debug se ambiente de desenvolvimento
        if (process.env.NODE_ENV === 'development') {
          router.push('/admin/session-debug')
          return
        } else {
          // Em produção, redirecionar para login
          const timestamp = new Date().getTime()
          window.location.href = `/admin/login?from=/admin/dashboard&t=${timestamp}`
          return
        }
      }
      
      const userRole = session?.user?.role
      const userPermissions = session?.user?.permissions || {}
      
      const canViewDashboard = userPermissions.viewDashboard || userRole === 'admin';
      
      if (!canViewDashboard) {
        console.log('[DashboardPage] Acesso negado. Usuário não tem permissão para ver o dashboard.')
        console.log('[DashboardPage] Role:', userRole)
        console.log('[DashboardPage] Permissões:', JSON.stringify(userPermissions))
        
        toast.error('Acesso Negado', { description: 'Você não tem permissão para acessar esta página.' })
        router.push('/admin/unauthorized') // Redirecionar para página de não autorizado
      } else {
        // Se tem permissão, buscar os tickets
        console.log('[DashboardPage] Acesso permitido. Buscando dados...')
        fetchTickets();
      }
    }
  }, [status, session, router])
  
  // Função para buscar os tickets
  const fetchTickets = async () => {
    try {
      console.log('[DashboardPage] Iniciando busca de tickets...');
      const response = await fetch('/api/admin/tickets')
      const data = await response.json()
      
      if (response.ok) {
        console.log(`[DashboardPage] ${data.tickets?.length || 0} tickets encontrados`);
        setTickets(data.tickets || [])
      } else {
        console.error('[DashboardPage] Erro ao buscar tickets:', data.error)
        toast.error('Erro ao carregar dados', { description: data.error || 'Falha ao buscar tickets.' })
      }
    } catch (error) {
      console.error('[DashboardPage] Erro ao buscar tickets:', error)
      toast.error('Erro ao carregar dados', { description: 'Falha na comunicação com o servidor.' })
    } finally {
      setIsLoading(false) // Definir isLoading como false após a tentativa
    }
  }
  
  // Filtrar tickets pelo período selecionado
  const filteredTickets = tickets.filter(ticket => {
    const ticketDate = new Date(ticket.createdAt)
    const now = new Date()
    const periodDays = parseInt(period)
    const periodDate = new Date(new Date().setDate(now.getDate() - periodDays)) // Corrigido para não modificar 'now' diretamente
    
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
  
  // Mostrar loading enquanto a sessão carrega ou os dados são buscados
  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    )
  }
  
  // Se chegou aqui e não está carregando, mas não está autenticado (após verificação do useEffect)
  // Teoricamente não deveria acontecer devido ao redirect no useEffect, mas é uma salvaguarda.
  if (status !== 'authenticated') {
     return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
         Acesso não autorizado ou sessão inválida.
      </div>
    )
  }
  
  // Renderizar o dashboard apenas se autenticado e com permissão (verificado no useEffect)
  return (
    <AuthGuard requiredRole="admin" requiredPermission="viewDashboard">
      <div className="container py-10 max-w-7xl">
        <AdminHeader 
          title="Dashboard" 
          description="Visualize dados e métricas do sistema de ouvidoria"
        />
        
        <div className="flex justify-between items-center mb-8">
          <div /> {/* Espaço vazio para manter o alinhamento */}
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
                  <BarChart data={typeChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Gráfico de Distribuição por Status */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {statusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    {/* <Legend /> */}
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  )
} 