'use client'

import { useState } from 'react'
import { DynamicQuestionForm } from './dynamic-question-form'
import { TicketType, TicketCategory } from '@/app/types/ticket'

interface PrivacyFormProps {
  onSuccess: (protocol: string, deadlineText: string, deadlineFormatted: string) => void
}

export function PrivacyQuestionForm({ onSuccess }: PrivacyFormProps) {
  // Redirecionar para o formulário dinâmico, que busca as questões da categoria correta
  return (
    <DynamicQuestionForm
      ticketType={TicketType.PRIVACIDADE}
      ticketCategory={TicketCategory.PRIVACIDADE_DADOS}
      onSuccess={onSuccess}
    />
  )
} 