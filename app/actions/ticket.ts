import { createSafeActionClient } from "next-safe-action"
import { z } from "zod"
import { ticketFormSchema } from "@/lib/validations"
import { createTicket as createTicketService } from "@/lib/services/ticket-service"

// Cliente de ação seguro
export const action = createSafeActionClient()

// Ação para criar um novo chamado
export const createTicket = action(ticketFormSchema, async (data: z.infer<typeof ticketFormSchema>) => {
  try {
    // Usa o serviço que conecta ao MongoDB
    const result = await createTicketService(data)
    
    if (!result.success) {
      throw new Error(result.error)
    }
    
    return {
      success: true,
      protocol: result.protocol,
      deadlineText: result.deadlineText,
      deadlineFormatted: result.deadlineFormatted
    }
  } catch (error) {
    console.error('Erro ao criar ticket via action:', error)
    
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
}) 