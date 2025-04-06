import dbConnect from '@/lib/mongodb'
import { TicketFormData, TicketStatus, TicketType } from '@/app/types/ticket'
import { calculateDeadlineDate, generateProtocol, generateUUID } from '@/lib/utils'
import Ticket from '@/lib/models/ticket'

// Importação com tratamento de erro
let TicketModel: any = null
try {
  // Importação dinâmica para evitar erro no cliente
  TicketModel = require('@/lib/models/ticket').default
} catch (error) {
  console.warn('Não foi possível importar o modelo Ticket:', error)
}

export async function createTicket(data: TicketFormData) {
  try {
    // Tenta conectar ao MongoDB
    await dbConnect()
    
    const protocol = generateProtocol()
    const now = new Date()
    const deadlineDate = calculateDeadlineDate(data.type)
    
    // Verifica se o modelo Ticket está disponível
    if (!TicketModel) {
      console.warn('Modelo Ticket não disponível, retornando resposta simulada')
      return simulateTicketCreation(data, protocol, deadlineDate)
    }
    
    // Cria o ticket no MongoDB
    const ticket = new TicketModel({
      protocol,
      type: data.type,
      category: data.category,
      name: data.name,
      email: data.email,
      studentName: data.studentName || '',
      studentGrade: data.studentGrade || '',
      isStudent: data.isStudent,
      message: data.message,
      status: TicketStatus.ABERTO,
    })
    
    await ticket.save()
    
    // Prepara informações para a resposta
    const deadlineText = data.type === TicketType.DENUNCIA 
      ? '48 horas' 
      : '15 dias'
    
    return {
      success: true,
      protocol,
      deadlineText,
      deadlineFormatted: deadlineDate.toLocaleDateString('pt-BR')
    }
  } catch (error) {
    console.error('Erro ao criar ticket:', error)
    
    // Em caso de erro, retorna uma resposta simulada para desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.warn('Usando resposta simulada para desenvolvimento')
      const protocol = generateProtocol()
      const deadlineDate = calculateDeadlineDate(data.type)
      return simulateTicketCreation(data, protocol, deadlineDate)
    }
    
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message
      }
    }
    
    return {
      success: false,
      error: 'Ocorreu um erro ao processar seu chamado. Tente novamente mais tarde.'
    }
  }
}

// Função auxiliar para simular a criação de ticket quando o MongoDB não está disponível
function simulateTicketCreation(data: TicketFormData, protocol: string, deadlineDate: Date) {
  const deadlineText = data.type === TicketType.DENUNCIA ? '48 horas' : '15 dias'
  
  return {
    success: true,
    protocol,
    deadlineText,
    deadlineFormatted: deadlineDate.toLocaleDateString('pt-BR')
  }
}

interface TicketFilters {
  status?: string
  type?: string
  protocol?: string
}

interface GetTicketsResult {
  success: boolean
  tickets: TicketType[]
  error?: string
}

/**
 * Busca chamados com filtros opcionais
 */
export async function getTickets(filters: TicketFilters = {}): Promise<GetTicketsResult> {
  try {
    // Conectar ao banco de dados
    await dbConnect()
    
    // Construir o objeto de filtro para a consulta
    const query: Record<string, any> = {}
    
    if (filters.status) {
      query.status = filters.status
    }
    
    if (filters.type) {
      query.type = filters.type
    }
    
    if (filters.protocol) {
      query.protocol = filters.protocol
    }
    
    // Buscar tickets no banco de dados
    const ticketsData = await Ticket.find(query).sort({ createdAt: -1 }).lean()
    
    // Mapear os documentos do MongoDB para o formato da interface TicketType
    const tickets = ticketsData.map(ticket => ({
      id: ticket._id.toString(),
      protocol: ticket.protocol,
      type: ticket.type,
      category: ticket.category || '',
      status: ticket.status,
      name: ticket.name || '',
      email: ticket.email || '',
      message: ticket.message,
      response: ticket.response || '',
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
    }))
    
    return {
      success: true,
      tickets
    }
  } catch (error) {
    console.error('Erro ao buscar chamados:', error)
    return {
      success: false,
      tickets: [],
      error: 'Erro ao buscar chamados no banco de dados'
    }
  }
}

/**
 * Busca um chamado específico pelo protocolo
 */
export async function getTicketByProtocol(protocol: string): Promise<{
  success: boolean
  ticket?: TicketType
  error?: string
}> {
  try {
    // Conectar ao banco de dados
    await dbConnect()
    
    // Buscar ticket pelo protocolo
    const ticketData = await Ticket.findOne({ protocol }).lean()
    
    if (!ticketData) {
      return {
        success: false,
        error: 'Chamado não encontrado'
      }
    }
    
    // Converter para o formato da interface TicketType
    const ticket: TicketType = {
      id: ticketData._id.toString(),
      protocol: ticketData.protocol,
      type: ticketData.type,
      category: ticketData.category || '',
      status: ticketData.status,
      name: ticketData.name || '',
      email: ticketData.email || '',
      message: ticketData.message,
      response: ticketData.response || '',
      createdAt: ticketData.createdAt.toISOString(),
      updatedAt: ticketData.updatedAt.toISOString(),
    }
    
    return {
      success: true,
      ticket
    }
  } catch (error) {
    console.error('Erro ao buscar chamado pelo protocolo:', error)
    return {
      success: false,
      error: 'Erro ao buscar chamado no banco de dados'
    }
  }
}

export async function getTicketById(id: string) {
  try {
    await dbConnect()
    
    if (!TicketModel) {
      console.warn('Modelo Ticket não disponível, retornando erro')
      return { success: false, error: 'Chamado não encontrado' }
    }
    
    const ticket = await TicketModel.findById(id)
    if (!ticket) {
      return { success: false, error: 'Chamado não encontrado' }
    }
    
    return { success: true, ticket }
  } catch (error) {
    console.error('Erro ao buscar ticket por ID:', error)
    return { success: false, error: 'Falha ao buscar o chamado' }
  }
}

export async function updateTicketStatus(id: string, status: TicketStatus, internalComments?: string) {
  try {
    await dbConnect()
    
    if (!TicketModel) {
      console.warn('Modelo Ticket não disponível, retornando erro')
      return { success: false, error: 'Chamado não encontrado' }
    }
    
    const ticket = await TicketModel.findById(id)
    if (!ticket) {
      return { success: false, error: 'Chamado não encontrado' }
    }
    
    ticket.status = status
    if (internalComments) {
      ticket.internalComments = internalComments
    }
    
    await ticket.save()
    
    return { success: true, ticket }
  } catch (error) {
    console.error('Erro ao atualizar status do ticket:', error)
    return { success: false, error: 'Falha ao atualizar o status do chamado' }
  }
} 