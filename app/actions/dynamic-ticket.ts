'use server'

// import { createSafeActionClient } from "next-safe-action"
import { z } from "zod"
import { dynamicTicketSchema } from "@/lib/validations"
import dbConnect from '@/lib/mongodb'
import Ticket from '@/lib/models/ticket'
import { TicketStatus, TicketType } from '@/app/types/ticket'
import { calculateDeadlineDate, generateProtocol } from '@/lib/utils'

// Inicializa o cliente de ação segura - Comentado
// export const action = createSafeActionClient()

// Tipo para os dados de entrada da action
type InputType = z.infer<typeof dynamicTicketSchema>

// Action para criar um ticket com respostas dinâmicas - Definida como função async padrão
// export const createTicketWithAnswers = action(dynamicTicketSchema, async (data: InputType) => { ... })

// Definir como uma função async padrão exportada
export async function createTicketWithAnswers(data: InputType) {
  const validatedFields = dynamicTicketSchema.safeParse(data);
  if (!validatedFields.success) {
    console.error('Erro de validação na action:', validatedFields.error.flatten().fieldErrors);
    return {
      success: false,
      error: "Dados inválidos fornecidos.",
    };
  }
  const validData = validatedFields.data;

  // --- Validação Condicional por Tipo de Chamado --- 
  if (validData.type === TicketType.DENUNCIA) {
      // Encontrar a resposta para a pergunta de identificação
      // Precisamos saber o ID ou o texto exato da pergunta de identificação
      // Vamos assumir que o ID é passado ou podemos buscar pelo texto
      // Alternativa: Passar a resposta da pergunta de ID como um campo separado? Não, melhor buscar nos answers.

      // --- REFAZENDO A LÓGICA: Validar NOME/EMAIL com base nos dados recebidos --- 
      // Se a intenção for se identificar (assumindo que o frontend valida ou sinaliza)
      // e os campos nome/email estiverem vazios, retorna erro.
      // COMO SABER A INTENÇÃO? Vamos checar se nome/email foram preenchidos.
      const identified = !!validData.name || !!validData.email; 
      
      // Se os campos foram preenchidos, mas um está faltando:
      if (identified && (!validData.name || !validData.email)) {
         return {
              success: false,
              error: "Se optar por se identificar na denúncia, Nome e Email são obrigatórios."
          };
      }
      
      // Se não se identificou (ambos vazios), garantir que sejam salvos como vazios/nulos
      if (!validData.name && !validData.email) {
          validData.name = ''; // Limpar explicitamente
          validData.email = ''; // Limpar explicitamente
      }
  } 
  // Validação para Solicitações de Privacidade
  else if (validData.type === TicketType.PRIVACIDADE) {
      // Campos nome e email são sempre obrigatórios para solicitações de privacidade
      if (!validData.name || !validData.email) {
          return {
              success: false,
              error: "Nome e Email são obrigatórios para solicitações de dados pessoais."
          };
      }
  }
  // --- Fim da Validação Condicional ---

  // --- Processamento dos anexos ---
  const fileUploads: any[] = [];
  
  // Buscar e processar todos os anexos nas respostas
  if (validData.answers) {
    for (const [questionId, answer] of Object.entries(validData.answers)) {
      // Verificar se a resposta contém dados de arquivo (para perguntas do tipo FILE)
      if (Array.isArray(answer) && answer.length > 0 && 
          answer[0] && typeof answer[0] === 'object' && 
          'name' in answer[0] && 'size' in answer[0] && 'type' in answer[0]) {
        
        // Aqui você processaria/salvaria os arquivos
        // Por enquanto, apenas registramos os metadados
        const fileData = answer.map((file: any) => ({
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type
        }));
        
        fileUploads.push(...fileData);
        console.log(`Anexos para a pergunta ${questionId}:`, fileData);
      }
    }
  }

  try {
    await dbConnect()

    const protocol = generateProtocol()
    const deadlineDate = calculateDeadlineDate(validData.type)

    // Gerar uma mensagem baseada nas respostas do formulário dinâmico
    let generatedMessage = "Respostas do formulário:\n\n";
    
    if (validData.answers && Object.keys(validData.answers).length > 0) {
      for (const [questionId, answer] of Object.entries(validData.answers)) {
        // Ignore arquivos ou objetos complexos
        if (typeof answer === 'string' || typeof answer === 'number' || typeof answer === 'boolean') {
          generatedMessage += `Resposta: ${answer}\n`;
        } else if (Array.isArray(answer) && answer.every(item => typeof item === 'string')) {
          generatedMessage += `Resposta: ${answer.join(', ')}\n`;
        }
      }
    } else {
      generatedMessage = "Formulário enviado sem respostas textuais.";
    }

    const newTicket = new Ticket({
      protocol,
      type: validData.type,
      category: validData.category,
      name: validData.name,
      email: validData.email,
      answers: validData.answers,
      message: generatedMessage, // Usar a mensagem gerada a partir das respostas
      status: TicketStatus.ABERTO,
      fileAttachments: fileUploads.length > 0 ? fileUploads : undefined
    })

    await newTicket.save()

    const deadlineText = validData.type === TicketType.DENUNCIA ? '48 horas' : '15 dias'

    return {
      success: true,
      data: {
          protocol,
          deadlineText,
          deadlineFormatted: deadlineDate.toLocaleDateString('pt-BR'),
      }
    }
  } catch (error) {
    console.error('Erro ao criar ticket com respostas dinâmicas:', error)
    const message = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
    return {
      success: false,
      error: message,
    }
  }
} 