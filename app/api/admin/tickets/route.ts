import { NextRequest, NextResponse } from 'next/server'
import { getTickets } from '../../../../lib/services/ticket-service'
import { verifyAdminRole } from '@/lib/auth-utils'
import dbConnect from '@/lib/mongodb'
import Ticket from '@/lib/models/ticket'

export async function GET(request: NextRequest) {
  console.log('[API] Iniciando GET /api/admin/tickets')
  
  try {
    // Verificar se o usuário é administrador
    console.log('[API] Verificando autorização do usuário')
    const isAdmin = await verifyAdminRole()
    
    if (!isAdmin) {
      console.log('[API] Usuário não autorizado')
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      )
    }
    
    console.log('[API] Usuário autorizado, buscando chamados')
    
    // Obter parâmetros de query
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    
    const filters: { status?: string; type?: string } = {}
    if (status) filters.status = status
    if (type) filters.type = type
    
    // Buscar chamados
    const result = await getTickets(filters)
    
    if (!result.success) {
      console.log(`[API] Erro: ${result.error}`)
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }
    
    console.log(`[API] Encontrados ${result.tickets.length} chamados`)
    
    // Retornar lista de chamados
    return NextResponse.json(
      { success: true, tickets: result.tickets },
      { status: 200 }
    )
  } catch (error) {
    console.error('[API] Erro ao buscar chamados:', error)
    
    return NextResponse.json(
      { 
        error: 'Ocorreu um erro ao buscar os chamados' 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  console.log('[API] Iniciando POST /api/admin/tickets')
  
  try {
    // Verificar se o usuário é administrador
    console.log('[API] Verificando autorização do usuário')
    const isAdmin = await verifyAdminRole()
    
    if (!isAdmin) {
      console.log('[API] Usuário não autorizado')
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      )
    }
    
    // Obter dados do corpo da requisição
    const ticketData = await request.json()
    
    // Validar campos obrigatórios
    if (!ticketData.protocol || !ticketData.type || !ticketData.status || !ticketData.message) {
      return NextResponse.json(
        { error: 'Campos obrigatórios não preenchidos' },
        { status: 400 }
      )
    }
    
    // Conectar ao banco de dados
    await dbConnect()
    
    // Verificar se já existe um chamado com o mesmo protocolo
    const existingTicket = await Ticket.findOne({ protocol: ticketData.protocol })
    
    if (existingTicket) {
      return NextResponse.json(
        { error: 'Já existe um chamado com este protocolo' },
        { status: 400 }
      )
    }
    
    // Criar um novo chamado
    console.log('[API] Criando novo chamado')
    const newTicket = new Ticket(ticketData)
    await newTicket.save()
    
    console.log(`[API] Novo chamado criado com protocolo: ${newTicket.protocol}`)
    
    // Retornar o chamado criado
    return NextResponse.json(
      { 
        success: true, 
        message: 'Chamado criado com sucesso',
        ticket: newTicket 
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