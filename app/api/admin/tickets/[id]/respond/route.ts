import { NextRequest, NextResponse } from 'next/server'
import { isValidObjectId } from 'mongoose'
import { verifyAdminRole } from '@/lib/auth-utils'
import dbConnect from '@/lib/mongodb'
import Ticket from '@/lib/models/ticket'
import { TicketStatus } from '@/app/types/ticket'

// Função para verificar autorização
async function checkAuthorization() {
  const isAdmin = await verifyAdminRole()
  
  if (!isAdmin) {
    return NextResponse.json(
      { error: 'Não autorizado' },
      { status: 403 }
    )
  }
  
  return null
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Obter os parâmetros de forma assíncrona
  const resolvedParams = await params
  console.log(`[API] Iniciando POST /api/admin/tickets/${resolvedParams.id}/respond`)
  
  try {
    // Verificar autorização
    const unauthorizedResponse = await checkAuthorization()
    if (unauthorizedResponse) return unauthorizedResponse
    
    const id = resolvedParams.id
    
    // Validar o ID
    if (!isValidObjectId(id)) {
      console.log(`[API] ID inválido: ${id}`)
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }
    
    // Obter dados do corpo da requisição
    const { response } = await request.json()
    
    // Validar se a resposta foi fornecida
    if (!response || typeof response !== 'string' || response.trim() === '') {
      return NextResponse.json(
        { error: 'Resposta não fornecida ou inválida' },
        { status: 400 }
      )
    }
    
    // Conectar ao banco de dados
    await dbConnect()
    
    // Verificar se o chamado existe
    const existingTicket = await Ticket.findById(id)
    
    if (!existingTicket) {
      console.log(`[API] Chamado não encontrado: ${id}`)
      return NextResponse.json(
        { error: 'Chamado não encontrado' },
        { status: 404 }
      )
    }
    
    // Atualizar o chamado com a resposta e mudar o status para respondido
    console.log(`[API] Respondendo ao chamado: ${id}`)
    
    const updatedTicket = await Ticket.findByIdAndUpdate(
      id,
      { 
        response: response,
        status: TicketStatus.RESPONDIDO,
        updatedAt: new Date()
      },
      { new: true }
    )
    
    console.log(`[API] Chamado respondido: ${id}`)
    
    // Retornar o chamado atualizado
    return NextResponse.json(
      { 
        success: true, 
        message: 'Resposta enviada com sucesso',
        ticket: updatedTicket 
      },
      { status: 200 }
    )
  } catch (error) {
    console.error(`[API] Erro ao responder chamado:`, error)
    
    return NextResponse.json(
      { error: 'Ocorreu um erro ao responder o chamado' },
      { status: 500 }
    )
  }
} 