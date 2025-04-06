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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Obter os parâmetros de forma assíncrona
  const resolvedParams = await params
  console.log(`[API] Iniciando PATCH /api/admin/tickets/${resolvedParams.id}/status`)
  
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
    const { status } = await request.json()
    
    // Validar se o status foi fornecido
    if (!status) {
      return NextResponse.json(
        { error: 'Status não fornecido' },
        { status: 400 }
      )
    }
    
    // Validar se o status é válido
    const validStatuses = Object.values(TicketStatus)
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { 
          error: 'Status inválido',
          validStatuses
        },
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
    
    // Atualizar o status do chamado
    console.log(`[API] Atualizando status do chamado ${id} para: ${status}`)
    
    const updatedTicket = await Ticket.findByIdAndUpdate(
      id,
      { 
        status: status,
        updatedAt: new Date()
      },
      { new: true }
    )
    
    console.log(`[API] Status do chamado atualizado: ${id}`)
    
    // Retornar o chamado atualizado
    return NextResponse.json(
      { 
        success: true, 
        message: 'Status do chamado atualizado com sucesso',
        ticket: updatedTicket 
      },
      { status: 200 }
    )
  } catch (error) {
    console.error(`[API] Erro ao atualizar status do chamado:`, error)
    
    return NextResponse.json(
      { error: 'Ocorreu um erro ao atualizar o status do chamado' },
      { status: 500 }
    )
  }
} 