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
  
  // Efeito para registrar o carregamento inicial da página do dashboard
  useEffect(() => {
    console.log('[DashboardPage] Inicializando');
    console.log('[DashboardPage] Status da sessão:', status);
    console.log('[DashboardPage] Sessão:', session);
  }, []);
  
  // Efeito para buscar os tickets quando estiver autenticado
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      console.log('[DashboardPage] Usuário autenticado como admin. Buscando tickets...');
      fetchTickets();
    }
  }, [status, session]);
  
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
      setIsLoading(false)
    }
  }
  
  console.log('[DashboardPage] Renderizando com status:', status);
  
  // Mostrar loading enquanto a sessão carrega
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
        <span className="ml-2">Carregando sessão...</span>
      </div>
    )
  }
  
  // Renderiza o conteúdo do dashboard dentro do AuthGuard
  return (
    <AuthGuard requiredRole="admin" requiredPermission="viewDashboard">
      <div className="container py-10 max-w-7xl">
        <AdminHeader 
          title="Dashboard" 
          description="Visualize dados e métricas do sistema de ouvidoria"
        />
        
        {/* Resto do conteúdo do dashboard */}
        {isLoading ? (
          <div className="py-20 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-neutral-400" />
            <p className="mt-4 text-neutral-500">Carregando dados...</p>
          </div>
        ) : (
          <div className="text-center py-10">
            <h2 className="text-xl font-semibold">Dashboard carregado com sucesso!</h2>
            <p className="mt-2 text-neutral-500">
              {tickets.length} tickets encontrados no período selecionado.
            </p>
          </div>
        )}
      </div>
    </AuthGuard>
  )
} 