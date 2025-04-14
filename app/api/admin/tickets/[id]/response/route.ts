import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminRole } from '@/lib/auth-utils'
import { respondToTicket } from '@/lib/services/ticket-service'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar se o usuário é administrador
    const isAuthorized = await verifyAdminRole()
    
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
    const { response } = await request.json()
    
    // Validar a resposta recebida
    if (!response || response.trim() === '') {
      return NextResponse.json(
        { error: 'É necessário fornecer uma resposta para o chamado' },
        { status: 400 }
      )
    }
    
    // Adicionar resposta ao ticket no banco de dados
    const result = await respondToTicket(id, response)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Erro ao responder ao chamado' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Erro ao responder ao ticket:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 