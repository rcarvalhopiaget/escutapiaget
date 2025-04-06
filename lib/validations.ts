import { z } from 'zod'
import { TicketCategory, TicketType } from '@/app/types/ticket'
import { QuestionType } from '@/app/types/question'

export const ticketFormSchema = z.object({
  type: z.nativeEnum(TicketType, {
    required_error: 'O tipo de chamado é obrigatório'
  }),
  category: z.nativeEnum(TicketCategory, {
    required_error: 'A categoria é obrigatória'
  }),
  name: z.string().min(3, {
    message: 'O nome deve ter pelo menos 3 caracteres'
  }),
  email: z.string().email({
    message: 'Digite um email válido'
  }),
  isStudent: z.boolean(),
  studentName: z.string().optional().or(z.literal('')),
  studentGrade: z.string().optional().or(z.literal('')),
  message: z.string().min(10, {
    message: 'A mensagem deve ter pelo menos 10 caracteres'
  })
})

// Schema de validação para o formulário de perguntas
export const questionFormSchema = z.object({
  text: z.string().min(5, {
    message: 'O texto da pergunta deve ter pelo menos 5 caracteres.'
  }),
  type: z.nativeEnum(QuestionType, {
    required_error: 'O tipo da pergunta é obrigatório.'
  }),
  category: z.string().min(1, {
    message: 'A categoria é obrigatória (use "all" para todas).'
  }),
  order: z.coerce.number({
    required_error: 'A ordem é obrigatória.',
    invalid_type_error: 'A ordem deve ser um número.'
  }).int().min(0, 'A ordem deve ser positiva.'),
  required: z.boolean().default(false),
  options: z.array(z.string().min(1, { message: 'Opção não pode ser vazia.' })).optional()
}).refine(
  (data) => {
    // Se o tipo for select, radio ou checkbox, as opções são obrigatórias
    if ([
      QuestionType.SELECT,
      QuestionType.RADIO,
      QuestionType.CHECKBOX
    ].includes(data.type)) {
      return data.options && data.options.length > 0
    }
    // Caso contrário, as opções não são necessárias (podem ser um array vazio ou undefined)
    return true
  },
  {
    message: 'Opções são obrigatórias para os tipos Select, Radio e Checkbox.',
    path: ['options'], // Onde o erro deve ser anexado
  }
)

// Schema para a action que cria ticket com respostas dinâmicas
export const dynamicTicketSchema = z.object({
    type: z.nativeEnum(TicketType),
    category: z.nativeEnum(TicketCategory),
    name: z.string().min(3, { message: 'Nome é obrigatório.' }).or(z.literal('')),
    email: z.string().email({ message: 'Email inválido.' }).or(z.literal('')),
    // Outros campos padrão podem ser adicionados aqui se necessário
    answers: z.record(z.any()), // Valida que 'answers' é um objeto (Record)
}); 