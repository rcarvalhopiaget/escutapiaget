import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/auth-utils'
import { updateTicketStatus } from '@/lib/services/ticket-service'
import { TicketStatus } from '@/app/types/ticket'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar se o usuário é administrador
    const isAuthorized = await verifyAdminAuth()
    
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    
    // Obter os parâmetros de forma assíncrona
    const resolvedParams = await params
    // Extrair ID do ticket e dados da requisição
    const id = resolvedParams.id
    const { status, internalComments } = await request.json()
    
    // Validar o status recebido
    if (!status || !Object.values(TicketStatus).includes(status as TicketStatus)) {
      return NextResponse.json(
        { error: 'Status inválido' },
        { status: 400 }
      )
    }
    
    // Atualizar o status no banco de dados
    const result = await updateTicketStatus(id, status as TicketStatus, internalComments)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Erro ao atualizar status' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Erro ao atualizar status do ticket:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 