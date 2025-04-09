'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { 
  Loader2, 
  Users, 
  MessageSquare, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  BarChart3,
  CalendarClock
} from 'lucide-react'
import { AdminHeader } from '@/components/admin/admin-header'
import AuthGuard from '../components/auth-guard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { TicketStatus, TicketType } from '@/app/types/ticket'

// Definição da interface para o tipo de ticket usado no estado
interface TicketData {
  id: string;
  protocol: string;
  title: string;
  message: string;
  status: TicketStatus;
  type: TicketType;
  createdAt: string;
}

// Componente de card estatístico
interface StatCardProps {
  title: string;
  value: number;
  description: string;
  icon: React.ElementType;
  trend?: number;
  color?: 'blue' | 'green' | 'amber' | 'red' | 'purple';
}

function StatCard({ title, value, description, icon, trend, color = 'blue' }: StatCardProps) {
  const IconComponent = icon
  const colorVariants = {
    blue: "text-blue-600 bg-blue-100",
    green: "text-green-600 bg-green-100",
    amber: "text-amber-600 bg-amber-100",
    red: "text-red-600 bg-red-100",
    purple: "text-purple-600 bg-purple-100",
  }
  
  const iconClass = colorVariants[color]
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h2 className="text-3xl font-bold">{value}</h2>
          </div>
          <div className={`p-2 rounded-full ${iconClass}`}>
            <IconComponent className="h-6 w-6" />
          </div>
        </div>
        <div className="flex items-center pt-4">
          {trend !== undefined && (
            <span className={`mr-2 text-xs ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? '+' : ''}{trend}%
            </span>
          )}
          <span className="text-xs text-muted-foreground">{description}</span>
        </div>
      </CardContent>
    </Card>
  )
}

// Componente de atividade recente
interface RecentActivityProps {
  date: string;
  title: string;
  message: string;
  status: TicketStatus;
  type: TicketType;
}

function RecentActivity({ date, title, message, status, type }: RecentActivityProps) {
  const getStatusColor = (status: TicketStatus): string => {
    switch (status) {
      case TicketStatus.ABERTO: return "bg-blue-500"
      case TicketStatus.EM_ANALISE: return "bg-amber-500"
      case TicketStatus.RESPONDIDO: return "bg-green-500"
      case TicketStatus.ENCAMINHADO: return "bg-purple-500"
      case TicketStatus.RESOLVIDO: return "bg-slate-500"
      default: return "bg-gray-500"
    }
  }
  
  const getTypeLabel = (type: TicketType): string => {
    switch (type) {
      case TicketType.RECLAMACAO: return "Reclamação"
      case TicketType.DENUNCIA: return "Denúncia"
      case TicketType.SUGESTAO: return "Sugestão"
      case TicketType.DUVIDA: return "Dúvida"
      case TicketType.PRIVACIDADE: return "Privacidade"
      default: return "Outro"
    }
  }
  
  return (
    <div className="flex items-start space-x-4 mb-4 pb-4 border-b last:border-0">
      <div className={`mt-1 w-2 h-2 rounded-full ${getStatusColor(status)}`} />
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{title}</p>
          <span className="text-xs text-muted-foreground">{date}</span>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-1">{message}</p>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {getTypeLabel(type)}
          </Badge>
          {status && (
            <Badge variant="secondary" className="text-xs">
              {status === TicketStatus.ABERTO ? 'Aberto' : 
              status === TicketStatus.EM_ANALISE ? 'Em Análise' : 
              status === TicketStatus.RESPONDIDO ? 'Respondido' : 
              status === TicketStatus.ENCAMINHADO ? 'Encaminhado' : 
              status === TicketStatus.RESOLVIDO ? 'Resolvido' : status}
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}

// Dados de exemplo
const MOCK_TICKETS = [
  { 
    id: '1', 
    protocol: '090423-102030', 
    title: 'Problemas na conexão internet',
    message: 'Não consigo acessar o sistema, a internet caí frequentemente. Por favor, resolver com urgência.',
    status: TicketStatus.ABERTO, 
    type: TicketType.RECLAMACAO,
    createdAt: '10/04/2023 - 10:20' 
  },
  { 
    id: '2', 
    protocol: '080423-091545', 
    title: 'Denúncia de comportamento inadequado',
    message: 'Gostaria de reportar um comportamento inadequado durante a aula de matemática...',
    status: TicketStatus.EM_ANALISE, 
    type: TicketType.DENUNCIA,
    createdAt: '08/04/2023 - 09:15' 
  },
  { 
    id: '3', 
    protocol: '070423-152205', 
    title: 'Sugestão para melhorias no refeitório',
    message: 'Sugiro algumas melhorias no refeitório para melhor atender os alunos...',
    status: TicketStatus.RESPONDIDO, 
    type: TicketType.SUGESTAO,
    createdAt: '07/04/2023 - 15:22' 
  },
  { 
    id: '4', 
    protocol: '050423-111020', 
    title: 'Dúvida sobre o calendário de provas',
    message: 'Gostaria de saber quando serão realizadas as provas de recuperação deste semestre.',
    status: TicketStatus.RESOLVIDO, 
    type: TicketType.DUVIDA,
    createdAt: '05/04/2023 - 11:10' 
  },
]

// Componente Dashboard - corrigindo inconsistências nos nomes de variáveis
export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // Estado com nomes consistentes
  const [isLoading, setIsLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const [tickets, setTickets] = useState<TicketData[]>([])
  const [stats, setStats] = useState({
    totalChamados: 0,
    abertos: 0,
    respondidos: 0,
    resolvidos: 0,
    emAnalise: 0
  })

  // Verificação de autenticação com garantia adicional
  useEffect(() => {
    console.log('[Dashboard] Status de autenticação:', status)
    console.log('[Dashboard] Dados da sessão:', session)
    
    // Só continue após o status de autenticação ser determinado
    if (status === 'loading') {
      return
    }
    
    // Se não estiver autenticado, redirecione para o login
    if (status === 'unauthenticated') {
      console.log('[Dashboard] Usuário não autenticado. Redirecionando para login...')
      router.push('/admin/login')
      return
    }
    
    // Verificar se o usuário tem papel admin
    if (session?.user?.role !== 'admin') {
      console.log('[Dashboard] Usuário não é admin. Redirecionando para página não autorizada...')
      router.push('/admin/unauthorized')
      return
    }
    
    // Se chegou aqui, o usuário está autenticado e autorizado
    console.log('[Dashboard] Usuário autenticado e autorizado:', session?.user)
    setAuthChecked(true)
    
    // Simular carregamento dos dados do dashboard
    const timer = setTimeout(() => {
      // Carregar dados de exemplo
      setTickets(MOCK_TICKETS)
      
      // Estatísticas 
      setStats({
        totalChamados: 125,
        abertos: 28,
        respondidos: 45,
        resolvidos: 37,
        emAnalise: 18
      })
      
      setIsLoading(false)
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [status, session, router])
  
  // Se ainda está verificando a autenticação, mostre um loader
  if (!authChecked || status === 'loading') {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin h-12 w-12 mx-auto text-primary" />
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  // Se não estiver autenticado como admin, o useEffect vai redirecionar
  // Este render nunca deve acontecer, mas é bom ter como garantia
  if (status !== 'authenticated' || session?.user?.role !== 'admin') {
    return null
  }

  // Layout e conteúdo do dashboard usando componentes existentes
  return (
    <AuthGuard requiredRole="admin" requiredPermission="viewDashboard">
      <div className="container py-10 max-w-7xl">
        <AdminHeader 
          title="Dashboard Administrativo" 
          description="Visualize dados e métricas do sistema de ouvidoria"
        />
        
        {isLoading ? (
          <div className="py-20 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-neutral-400" />
            <p className="mt-4 text-neutral-500">Carregando dados...</p>
          </div>
        ) : (
          <>
            {/* Cards de estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              <StatCard 
                title="Total de Chamados" 
                value={stats.totalChamados} 
                description="No último mês"
                icon={MessageSquare} 
                trend={12} 
                color="blue" 
              />
              <StatCard 
                title="Chamados Abertos" 
                value={stats.abertos} 
                description="Aguardando análise"
                icon={AlertCircle} 
                trend={8} 
                color="amber" 
              />
              <StatCard 
                title="Respondidos" 
                value={stats.respondidos} 
                description="Nos últimos 30 dias"
                icon={CheckCircle} 
                trend={5} 
                color="green" 
              />
              <StatCard 
                title="Resolvidos" 
                value={stats.resolvidos} 
                description="Nos últimos 30 dias"
                icon={CheckCircle} 
                trend={3} 
                color="green" 
              />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
              {/* Coluna de gráficos - ocupa 2/3 do espaço */}
              <div className="lg:col-span-2 space-y-6">
                {/* Gráfico de tendência */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2 text-blue-500" /> 
                      Tendência de Chamados
                    </CardTitle>
                    <CardDescription>
                      Evolução dos chamados nos últimos 30 dias
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px] flex flex-col justify-center items-center text-center p-6">
                      <BarChart3 className="h-16 w-16 text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground">
                        Visualização de gráfico será implementada com a biblioteca de sua preferência (Recharts, Chart.js, etc)
                      </p>
                    </div>
                  </CardContent>
                </Card>
              
                {/* Distribuição por tipos */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2 text-blue-500" /> 
                      Distribuição por Categoria
                    </CardTitle>
                    <CardDescription>
                      Quantidade de chamados por tipo
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Reclamações</span>
                          <span className="text-sm font-medium">42</span>
                        </div>
                        <Progress value={42} className="h-2 bg-blue-100" indicatorClassName="bg-blue-500" />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Denúncias</span>
                          <span className="text-sm font-medium">18</span>
                        </div>
                        <Progress value={18} max={125} className="h-2 bg-red-100" indicatorClassName="bg-red-500" />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Dúvidas</span>
                          <span className="text-sm font-medium">37</span>
                        </div>
                        <Progress value={37} max={125} className="h-2 bg-amber-100" indicatorClassName="bg-amber-500" />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Sugestões</span>
                          <span className="text-sm font-medium">28</span>
                        </div>
                        <Progress value={28} max={125} className="h-2 bg-green-100" indicatorClassName="bg-green-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Coluna de atividades recentes - ocupa 1/3 do espaço */}
              <div className="space-y-6">
                <Card className="h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center">
                      <CalendarClock className="h-5 w-5 mr-2 text-blue-500" /> 
                      Atividades Recentes
                    </CardTitle>
                    <CardDescription>
                      Últimos chamados registrados
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {tickets.map((ticket) => (
                        <RecentActivity 
                          key={ticket.id}
                          date={ticket.createdAt}
                          title={ticket.title}
                          message={ticket.message}
                          status={ticket.status}
                          type={ticket.type}
                        />
                      ))}
                    </div>
                    
                    <div className="mt-4 text-center">
                      <a 
                        href="/admin/chamados?access=auth" 
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        Ver todos os chamados
                      </a>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            {/* Barra de status */}
            <div className="mt-6">
              <Card className="bg-gray-50 border-dashed">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground">
                    Última atualização: {new Date().toLocaleString('pt-BR')} • Usuário: {session.user?.name || 'Admin'} • Versão: 1.0.5
                  </p>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AuthGuard>
  )
} 