import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Ticket from '@/lib/models/ticket'
import { generateProtocol } from '@/lib/utils'

export async function POST(request: NextRequest) {
  console.log('[API] Iniciando POST /api/tickets (criação de chamado público)')
  
  try {
    // Obter dados do corpo da requisição
    const ticketData = await request.json()
    
    // Validar campos obrigatórios
    if (!ticketData.type || !ticketData.message) {
      console.log('[API] Erro: Campos obrigatórios não preenchidos')
      return NextResponse.json(
        { error: 'Campos obrigatórios não preenchidos' },
        { status: 400 }
      )
    }
    
    // Conectar ao banco de dados
    await dbConnect()
    
    // Gerar protocolo único para o chamado (DDMMAA-HHMMSS)
    const date = new Date()
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear().toString().substring(2)
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const seconds = date.getSeconds().toString().padStart(2, '0')
    
    const protocol = `${day}${month}${year}-${hours}${minutes}${seconds}`
    
    // Verificar se já existe um chamado com o mesmo protocolo (improvável, mas por segurança)
    const existingTicket = await Ticket.findOne({ protocol })
    
    if (existingTicket) {
      console.log('[API] Erro: Colisão de protocolo detectada (muito improvável)')
      // Gerar novo protocolo com milissegundos
      const milliseconds = date.getMilliseconds().toString().padStart(3, '0')
      ticketData.protocol = `${protocol}-${milliseconds}`
    } else {
      ticketData.protocol = protocol
    }
    
    // Definir status inicial como 'aberto'
    ticketData.status = 'aberto'
    
    // Criar um novo chamado
    console.log('[API] Criando novo chamado com protocolo:', ticketData.protocol)
    const newTicket = new Ticket(ticketData)
    await newTicket.save()
    
    console.log(`[API] Chamado criado com sucesso. Protocolo: ${newTicket.protocol}`)
    
    // Retornar o chamado criado
    return NextResponse.json(
      { 
        success: true, 
        message: 'Chamado criado com sucesso',
        ticket: {
          protocol: newTicket.protocol,
          type: newTicket.type,
          status: newTicket.status,
          createdAt: newTicket.createdAt
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[API] Erro ao criar chamado:', error)
    
    return NextResponse.json(
      { error: 'Ocorreu um erro ao criar o chamado' },
      { status: 500 }
    )
  }
} 