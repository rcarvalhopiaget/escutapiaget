import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Ticket from '@/lib/models/ticket'
import { TicketStatus, TicketType } from '@/app/types/ticket'
import { generateProtocol } from '@/lib/utils'

export async function GET(req: NextRequest) {
  try {
    console.log('[Setup Test Ticket] Conectando ao banco de dados')
    await dbConnect()
    
    const protocol = generateProtocol()
    
    console.log('[Setup Test Ticket] Criando ticket de teste')
    
    // Criar um ticket de teste
    const ticket = new Ticket({
      protocol,
      type: TicketType.DUVIDA,
      category: 'Matrícula',
      status: TicketStatus.ABERTO,
      name: 'Usuário Teste',
      email: 'teste@exemplo.com',
      message: 'Este é um ticket de teste para verificar o funcionamento do dashboard.',
      createdAt: new Date(),
      updatedAt: new Date()
    })
    
    await ticket.save()
    console.log('[Setup Test Ticket] Ticket de teste criado com sucesso')
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'Ticket de teste criado com sucesso.', 
        ticket: {
          id: ticket._id.toString(),
          protocol: ticket.protocol,
          type: ticket.type,
          status: ticket.status,
          createdAt: ticket.createdAt.toISOString()
        }
      }, 
      { status: 201 }
    )
    
  } catch (error) {
    console.error('[Setup Test Ticket] Erro na criação do ticket de teste:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Falha na criação do ticket de teste.'
      }, 
      { status: 500 }
    )
  }
} 