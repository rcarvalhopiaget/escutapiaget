import { NextRequest, NextResponse } from 'next/server'
import { isValidObjectId } from 'mongoose'
import { verifyAdminRole } from '@/lib/auth-utils'
import dbConnect from '@/lib/mongodb'
import Ticket from '@/lib/models/ticket'

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Obter os parâmetros de forma assíncrona
  const resolvedParams = await params
  console.log(`[API] Iniciando DELETE /api/admin/tickets/${resolvedParams.id}`)
  
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
    
    // Conectar ao banco de dados
    await dbConnect()
    
    // Verificar se o ticket existe
    const ticket = await Ticket.findById(id)
    if (!ticket) {
      console.log(`[API] Chamado não encontrado: ${id}`)
      return NextResponse.json(
        { error: 'Chamado não encontrado' },
        { status: 404 }
      )
    }
    
    // Excluir o ticket
    console.log(`[API] Excluindo chamado: ${id}`)
    await Ticket.findByIdAndDelete(id)
    
    // Retornar sucesso
    return NextResponse.json(
      { success: true, message: 'Chamado excluído com sucesso' },
      { status: 200 }
    )
  } catch (error) {
    console.error(`[API] Erro ao excluir chamado:`, error)
    
    return NextResponse.json(
      { error: 'Ocorreu um erro ao excluir o chamado' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Obter os parâmetros de forma assíncrona
  const resolvedParams = await params
  console.log(`[API] Iniciando GET /api/admin/tickets/${resolvedParams.id}`)
  
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
    
    // Conectar ao banco de dados
    await dbConnect()
    
    // Buscar o ticket
    const ticket = await Ticket.findById(id)
    
    if (!ticket) {
      console.log(`[API] Chamado não encontrado: ${id}`)
      return NextResponse.json(
        { error: 'Chamado não encontrado' },
        { status: 404 }
      )
    }
    
    console.log(`[API] Chamado encontrado: ${id}`)
    
    // Converter para objeto e adicionar o id
    const ticketObj = ticket.toObject()
    ticketObj.id = ticketObj._id.toString()
    
    // Retornar o ticket
    return NextResponse.json(
      { success: true, ticket: ticketObj },
      { status: 200 }
    )
  } catch (error) {
    console.error(`[API] Erro ao buscar chamado:`, error)
    
    return NextResponse.json(
      { error: 'Ocorreu um erro ao buscar o chamado' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Obter os parâmetros de forma assíncrona
  const resolvedParams = await params
  console.log(`[API] Iniciando PUT /api/admin/tickets/${resolvedParams.id}`)
  
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
    
    // Verificar se o chamado existe
    const existingTicket = await Ticket.findById(id)
    
    if (!existingTicket) {
      console.log(`[API] Chamado não encontrado: ${id}`)
      return NextResponse.json(
        { error: 'Chamado não encontrado' },
        { status: 404 }
      )
    }
    
    // Verificar se o protocolo está sendo alterado e se já existe outro chamado com esse protocolo
    if (ticketData.protocol !== existingTicket.protocol) {
      const duplicateProtocol = await Ticket.findOne({ 
        protocol: ticketData.protocol,
        _id: { $ne: id }
      })
      
      if (duplicateProtocol) {
        return NextResponse.json(
          { error: 'Já existe outro chamado com este protocolo' },
          { status: 400 }
        )
      }
    }
    
    // Atualizar o chamado
    console.log(`[API] Atualizando chamado: ${id}`)
    
    // Atualizar dados do chamado
    // O { new: true } retorna o documento atualizado em vez do antigo
    const updatedTicket = await Ticket.findByIdAndUpdate(
      id,
      { 
        ...ticketData,
        updatedAt: new Date()
      },
      { new: true }
    )
    
    // Converter para objeto e adicionar o id
    const ticketObj = updatedTicket.toObject()
    ticketObj.id = ticketObj._id.toString()
    
    console.log(`[API] Chamado atualizado: ${id}`)
    
    // Retornar o chamado atualizado
    return NextResponse.json(
      { 
        success: true, 
        message: 'Chamado atualizado com sucesso',
        ticket: ticketObj 
      },
      { status: 200 }
    )
  } catch (error) {
    console.error(`[API] Erro ao atualizar chamado:`, error)
    
    return NextResponse.json(
      { error: 'Ocorreu um erro ao atualizar o chamado' },
      { status: 500 }
    )
  }
} 