import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { TicketType } from "@/app/types/ticket"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export function generateProtocol(): string {
  const now = new Date()
  const year = now.getFullYear().toString().substring(2) // pega apenas os dois últimos dígitos do ano
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const day = now.getDate().toString().padStart(2, '0')
  const datePart = `${year}${month}${day}`
  
  // Gera um número aleatório de 6 dígitos
  const randomPart = Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
  
  return `${datePart}-${randomPart}`
}

export function calculateDeadlineDate(ticketType: TicketType) {
  const now = new Date()
  let deadline: Date

  if (ticketType === TicketType.DENUNCIA) {
    // Denúncias: 48 horas (2 dias)
    deadline = new Date(now)
    deadline.setDate(now.getDate() + 2)
  } else if (ticketType === TicketType.PRIVACIDADE) {
    // Solicitações de privacidade: 10 dias úteis (aproximadamente 14 dias corridos)
    deadline = new Date(now)
    deadline.setDate(now.getDate() + 14)
  } else {
    // Outros tipos: 15 dias úteis (aproximadamente 21 dias corridos)
    deadline = new Date(now)
    deadline.setDate(now.getDate() + 21)
  }

  return deadline
}
