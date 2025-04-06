import { Metadata } from 'next'
import { MessageSquareWarning, HelpCircle, AlertTriangle, Lightbulb, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { TicketType } from '../types/ticket'
import { Button } from '@/components/ui/button'
import { PanelLeftOpen } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Sistema de Chamados - Escola Piaget',
  description: 'Sistema de Chamados para registrar reclamações, denúncias, sugestões e dúvidas',
}

export default function TicketsPage() {
  return (
    <div className="container max-w-5xl mx-auto py-10 px-4 sm:px-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Sistema de Chamados</h1>
          <p className="text-neutral-600 max-w-2xl">
            Selecione o tipo de solicitação que deseja enviar. Todos os chamados geram um protocolo 
            automático e serão respondidos dentro do prazo.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin">
            <PanelLeftOpen className="h-4 w-4 mr-2" />
            Administração
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {ticketTypeCards.map((card) => (
          <Link key={card.type} href={card.path} className="block h-full">
            <div className="bg-white rounded-lg shadow-md p-6 h-full hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-50 mb-4 mx-auto">
                <card.icon className="h-6 w-6 text-blue-500" />
              </div>
              <h2 className="text-xl font-semibold text-center mb-2">{card.title}</h2>
              <p className="text-neutral-600 text-sm text-center mb-4">{card.description}</p>
              <p className="text-xs text-neutral-500 text-center bg-neutral-50 p-2 rounded">
                {card.deadlineText}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-10 bg-neutral-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Informações Importantes</h2>
        <ul className="list-disc list-inside space-y-2 text-neutral-700">
          <li>Todos os chamados geram um número de protocolo único para acompanhamento</li>
          <li>Denúncias de bullying são tratadas com prioridade e respondidas em até 48 horas</li>
          <li>Solicitações de privacidade de dados são respondidas em até 10 dias úteis</li>
          <li>Os demais tipos de chamados são respondidos em até 15 dias úteis</li>
          <li>Para situações de emergência, entre em contato diretamente com a secretaria da escola</li>
        </ul>
      </div>
    </div>
  )
}

const ticketTypeCards = [
  {
    title: 'Reclamação',
    description: 'Registre uma reclamação sobre serviços ou atendimento',
    type: TicketType.RECLAMACAO,
    path: '/chamados/formulario?tipo=reclamacao',
    icon: MessageSquareWarning,
    deadlineText: 'Prazo de resposta: até 15 dias',
  },
  {
    title: 'Denúncia',
    description: 'Denuncie casos de bullying ou comportamentos inadequados',
    type: TicketType.DENUNCIA,
    path: '/fluxo-antibullying',
    icon: AlertTriangle,
    deadlineText: 'Prazo de resposta: até 48 horas',
  },
  {
    title: 'Sugestão',
    description: 'Envie sugestões para melhorar nossos serviços',
    type: TicketType.SUGESTAO,
    path: '/chamados/formulario?tipo=sugestao',
    icon: Lightbulb,
    deadlineText: 'Prazo de resposta: até 15 dias',
  },
  {
    title: 'Dúvida',
    description: 'Tire dúvidas sobre questões pedagógicas, financeiras ou outras',
    type: TicketType.DUVIDA,
    path: '/chamados/formulario?tipo=duvida',
    icon: HelpCircle,
    deadlineText: 'Prazo de resposta: até 15 dias',
  },
  {
    title: 'Privacidade de Dados',
    description: 'Solicite acesso, correção ou exclusão dos seus dados pessoais',
    type: TicketType.PRIVACIDADE,
    path: '/chamados/formulario?tipo=privacidade',
    icon: ShieldAlert,
    deadlineText: 'Prazo de resposta: até 10 dias',
  }
] 