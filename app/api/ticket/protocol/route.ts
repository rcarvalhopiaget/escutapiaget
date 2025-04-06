import { NextRequest, NextResponse } from 'next/server'
import { getTicketByProtocol } from '@/lib/services/ticket-service'

export async function GET(request: NextRequest) {
  // Iniciar o log para rastreamento
  console.log('[API] Iniciando GET /api/ticket/protocol')
  
  try {
    // Obter o parâmetro de protocolo da URL
    const searchParams = request.nextUrl.searchParams
    const protocol = searchParams.get('protocol')
    
    // Validar se o protocolo foi fornecido
    if (!protocol) {
      console.log('[API] Erro: Protocolo não fornecido')
      return NextResponse.json(
        { error: 'Protocolo não fornecido' },
        { status: 400 }
      )
    }
    
    console.log(`[API] Buscando chamado com protocolo: ${protocol}`)
    
    // Buscar o chamado pelo protocolo
    const result = await getTicketByProtocol(protocol)
    
    if (!result.success) {
      console.log(`[API] Erro: ${result.error}`)
      return NextResponse.json(
        { error: result.error },
        { status: 404 }
      )
    }
    
    console.log('[API] Chamado encontrado com sucesso')
    
    // Retornar o chamado encontrado
    return NextResponse.json(
      { success: true, ticket: result.ticket },
      { status: 200 }
    )
  } catch (error) {
    console.error('[API] Erro ao buscar chamado por protocolo:', error)
    
    return NextResponse.json(
      { 
        error: 'Ocorreu um erro ao buscar o chamado. Tente novamente mais tarde.' 
      },
      { status: 500 }
    )
  }
} 