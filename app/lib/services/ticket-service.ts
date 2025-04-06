import { sendEmail } from '@/app/lib/email-service';
import { Ticket } from '@/app/types/ticket';

// Definir tipo para os dados de entrada de createTicket
interface CreateTicketData {
  type: string;
  category: string;
  name?: string;
  email?: string;
  message?: string;
  // Adicione outros campos necessários aqui
}

// Adicione esta função ao serviço
async function sendTicketNotification(ticket: Ticket) {
  if (!ticket.email) return;
  
  try {
    // Email para o usuário
    await sendEmail({
      to: ticket.email,
      subject: `Seu chamado #${ticket.protocol} foi registrado`,
      htmlBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">Chamado Registrado</h2>
          <p>Olá ${ticket.name || ''},</p>
          <p>Seu chamado foi registrado com sucesso em nosso sistema.</p>
          
          <div style="background-color: #f0f9ff; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <p><strong>Protocolo:</strong> ${ticket.protocol}</p>
            <p><strong>Tipo:</strong> ${ticket.type}</p>
            <p><strong>Data:</strong> ${new Date(ticket.createdAt).toLocaleString('pt-BR')}</p>
          </div>
          
          <p>Você receberá uma resposta em breve.</p>
          <p>Atenciosamente,<br>Colégio Piaget</p>
        </div>
      `,
      textBody: `
        Chamado Registrado
        
        Olá ${ticket.name || ''},
        
        Seu chamado foi registrado com sucesso em nosso sistema.
        
        Protocolo: ${ticket.protocol}
        Tipo: ${ticket.type}
        Data: ${new Date(ticket.createdAt).toLocaleString('pt-BR')}
        
        Você receberá uma resposta em breve.
        
        Atenciosamente,
        Colégio Piaget
      `
    });
    
    // Email para os administradores
    await sendEmail({
      to: process.env.ADMIN_EMAIL || 'colegiopiagetsbc@jpiaget.com.br',
      subject: `Novo chamado #${ticket.protocol} - ${ticket.type}`,
      htmlBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ef4444;">Novo Chamado Registrado</h2>
          
          <div style="background-color: #fef2f2; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <p><strong>Protocolo:</strong> ${ticket.protocol}</p>
            <p><strong>Tipo:</strong> ${ticket.type}</p>
            <p><strong>Categoria:</strong> ${ticket.category}</p>
            <p><strong>Nome:</strong> ${ticket.name || 'Não informado'}</p>
            <p><strong>Email:</strong> ${ticket.email || 'Não informado'}</p>
            <p><strong>Data:</strong> ${new Date(ticket.createdAt).toLocaleString('pt-BR')}</p>
          </div>
          
          <p>Acesse o painel administrativo para responder.</p>
        </div>
      `
    });
    
    console.log(`[Ticket] Notificações de email enviadas para o ticket ${ticket.protocol}`);
    
  } catch (error) {
    console.error('[Ticket] Erro ao enviar notificações por email:', error);
  }
}

// Modifique a função createTicket para chamar a notificação por email
export async function createTicket(data: CreateTicketData) {
  // Lógica placeholder para criar o ticket e definir 'result'
  // Substitua esta lógica pela sua implementação real de criação de ticket
  // Exemplo:
  // const createdTicket = await database.createTicket(data);
  // const result = { success: true, ticket: createdTicket };
  console.log('[Ticket] Iniciando criação do ticket com dados:', data); 
  // Simulação de criação de ticket bem-sucedida com alguns dados
  const simulatedTicket: Ticket = {
    id: 'simulated-id-' + Date.now(), // ID simulado
    protocol: 'PROTO-' + Date.now(), // Protocolo simulado
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'aberto',
    ...data,
    // Garanta que todos os campos obrigatórios de Ticket estejam aqui
  };
  const result = { success: true, ticket: simulatedTicket }; 
  // Fim da lógica placeholder
  
  // Adicione este trecho após salvar o ticket com sucesso
  if (result.success) {
    // Enviar notificações por email de forma assíncrona
    sendTicketNotification(result.ticket).catch(err => 
      console.error('Falha ao enviar notificação por email:', err)
    );
  }
  
  return result;
}