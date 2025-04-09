import { SES } from 'aws-sdk';

// Configuração do Amazon SES
const ses = new SES({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

/**
 * Interface para os parâmetros da função sendEmail
 */
interface SendEmailParams {
  to: string | string[];
  subject: string;
  htmlBody: string;
  textBody?: string;
  from?: string;
}

/**
 * Interface para o retorno da função sendEmail
 */
interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: any;
}

/**
 * Função para enviar emails usando Amazon SES
 */
export async function sendEmail({
  to,
  subject,
  htmlBody,
  textBody,
  from = process.env.EMAIL_FROM || 'contato@piaget.com.br'
}: SendEmailParams): Promise<SendEmailResult> {
  const recipients = Array.isArray(to) ? to : [to];
  
  try {
    const params = {
      Source: from,
      Destination: {
        ToAddresses: recipients
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8'
        },
        Body: {
          Html: {
            Data: htmlBody,
            Charset: 'UTF-8'
          },
          ...(textBody && {
            Text: {
              Data: textBody,
              Charset: 'UTF-8'
            }
          })
        }
      }
    };

    const result = await ses.sendEmail(params).promise();
    console.log(`[Email] Enviado com sucesso para ${recipients.join(', ')}`);
    return { success: true, messageId: result.MessageId };
    
  } catch (error) {
    console.error('[Email] Erro ao enviar:', error);
    return { success: false, error };
  }
}

/**
 * Interface para um ticket
 */
export interface Ticket {
  protocol: string;
  type: string;
  category?: string;
  name?: string;
  email?: string;
  createdAt: Date | string;
  message?: string;
  status?: string;
}

/**
 * Mapeia tipos de chamado para cores e nomes mais amigáveis
 */
const ticketTypeInfo: Record<string, { color: string, name: string }> = {
  'denuncia': { color: '#ef4444', name: 'Denúncia' },
  'reclamacao': { color: '#f97316', name: 'Reclamação' },
  'sugestao': { color: '#22c55e', name: 'Sugestão' },
  'duvida': { color: '#3b82f6', name: 'Dúvida' },
  'privacidade': { color: '#8b5cf6', name: 'Privacidade' },
  'default': { color: '#3b82f6', name: 'Chamado' }
};

/**
 * Mapeia status para cores e nomes mais amigáveis
 */
const ticketStatusInfo: Record<string, { color: string, bgColor: string, name: string }> = {
  'aberto': { color: '#0369a1', bgColor: '#e0f2fe', name: 'Aberto' },
  'em_analise': { color: '#854d0e', bgColor: '#fef9c3', name: 'Em Análise' },
  'respondido': { color: '#166534', bgColor: '#dcfce7', name: 'Respondido' },
  'encaminhado': { color: '#581c87', bgColor: '#f3e8ff', name: 'Encaminhado' },
  'resolvido': { color: '#475569', bgColor: '#f1f5f9', name: 'Resolvido' },
  'default': { color: '#3b82f6', bgColor: '#e0f2fe', name: 'Aberto' }
};

/**
 * Obter base HTML compartilhada para emails
 */
function getBaseEmailHtml(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <title>Piaget - Sistema de Chamados</title>
      <style type="text/css">
        @media screen and (max-width: 525px) {
          .responsive-table {
            width: 100% !important;
          }
          .responsive-padding {
            padding: 15px !important;
          }
        }
        body {
          margin: 0;
          padding: 0;
          font-family: Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        .wrapper {
          width: 100%;
          table-layout: fixed;
          background-color: #f8fafc;
          padding: 30px 0;
        }
        .main {
          margin: 0 auto;
          width: 100%;
          max-width: 600px;
          border-spacing: 0;
          color: #334155;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        .footer {
          margin: 20px auto 0;
          width: 100%;
          max-width: 600px;
          text-align: center;
          color: #64748b;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <table class="main" width="100%">
          <tr>
            <td style="padding: 0;">
              <table width="100%">
                <tr>
                  <td style="text-align: center; padding: 20px 0; background-color: #1e293b; border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px;">Piaget</h1>
                    <p style="margin: 5px 0 0; color: #cbd5e1; font-size: 16px;">Sistema de Chamados</p>
                  </td>
                </tr>
                <tr>
                  <td class="responsive-padding" style="padding: 30px;">
                    ${content}
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #f1f5f9; text-align: center; padding: 15px; border-radius: 0 0 8px 8px;">
                    <p style="margin: 0; color: #64748b; font-size: 14px;">
                      © ${new Date().getFullYear()} Piaget - Todos os direitos reservados
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <table class="footer">
          <tr>
            <td style="padding: 15px;">
              <p>Este é um email automático. Por favor, não responda diretamente a este email.</p>
              <p>Se precisar de assistência, acesse o <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://escuta.piaget.com.br'}" style="color: #3b82f6; text-decoration: none;">Portal Escuta Piaget</a>.</p>
            </td>
          </tr>
        </table>
      </div>
    </body>
    </html>
  `;
}

/**
 * Envia notificações relacionadas a um ticket
 */
export async function sendTicketNotification(ticket: Ticket): Promise<SendEmailResult> {
  if (!ticket.email) return { success: false, error: 'Email do destinatário não fornecido' };
  
  // Identifica o tipo de ticket para personalização
  const typeInfo = ticketTypeInfo[ticket.type] || ticketTypeInfo.default;
  const createdAtDate = new Date(ticket.createdAt);
  const formattedDate = createdAtDate.toLocaleDateString('pt-BR');
  const formattedTime = createdAtDate.toLocaleTimeString('pt-BR');
  
  try {
    // Email para o usuário
    const userEmailContent = `
      <h2 style="color: ${typeInfo.color}; margin-bottom: 20px;">Seu ${typeInfo.name} foi Registrado</h2>
      <p style="margin-bottom: 25px; font-size: 16px;">Olá ${ticket.name || 'Cliente'},</p>
      <p style="margin-bottom: 25px; font-size: 16px;">Recebemos seu ${typeInfo.name.toLowerCase()} e já estamos trabalhando para atendê-lo da melhor forma possível.</p>
      
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8fafc; border-radius: 8px; margin-bottom: 25px;">
        <tr>
          <td style="padding: 20px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="padding-bottom: 15px; border-bottom: 1px solid #e2e8f0;">
                  <p style="margin: 0; font-size: 16px; font-weight: bold; color: #334155;">Detalhes do ${typeInfo.name}</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 15px 0;">
                  <table cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td width="40%" style="color: #64748b; font-size: 14px; padding-bottom: 12px;">Protocolo:</td>
                      <td style="font-weight: bold; font-size: 14px; padding-bottom: 12px;">${ticket.protocol}</td>
                    </tr>
                    <tr>
                      <td width="40%" style="color: #64748b; font-size: 14px; padding-bottom: 12px;">Tipo:</td>
                      <td style="font-size: 14px; padding-bottom: 12px;">
                        <span style="display: inline-block; padding: 4px 8px; border-radius: 4px; background-color: ${typeInfo.color}1A; color: ${typeInfo.color}; font-weight: 500;">${typeInfo.name}</span>
                      </td>
                    </tr>
                    <tr>
                      <td width="40%" style="color: #64748b; font-size: 14px; padding-bottom: 12px;">Data:</td>
                      <td style="font-size: 14px; padding-bottom: 12px;">${formattedDate} às ${formattedTime}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      
      <p style="margin-bottom: 10px; font-size: 16px;">Estamos comprometidos em responder ${ticket.type === 'denuncia' ? 'em até 48 horas' : 'em até 15 dias úteis'}.</p>
      <p style="margin-bottom: 25px; font-size: 16px;">Você pode acompanhar o status do seu chamado através do protocolo informado acima.</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
        <p style="margin-bottom: 5px; font-size: 14px;">Atenciosamente,</p>
        <p style="margin: 0; font-weight: bold; font-size: 16px;">Equipe Piaget</p>
      </div>
    `;
    
    const userEmailPlainText = `
Seu ${typeInfo.name} foi Registrado

Olá ${ticket.name || 'Cliente'},

Recebemos seu ${typeInfo.name.toLowerCase()} e já estamos trabalhando para atendê-lo da melhor forma possível.

Detalhes do ${typeInfo.name}:
- Protocolo: ${ticket.protocol}
- Tipo: ${typeInfo.name}
- Data: ${formattedDate} às ${formattedTime}

Estamos comprometidos em responder ${ticket.type === 'denuncia' ? 'em até 48 horas' : 'em até 15 dias úteis'}.
Você pode acompanhar o status do seu chamado através do protocolo informado acima.

Atenciosamente,
Equipe Piaget
    `;
    
    // Enviar email para o usuário
    await sendEmail({
      to: ticket.email,
      subject: `Seu ${typeInfo.name} #${ticket.protocol} foi registrado`,
      htmlBody: getBaseEmailHtml(userEmailContent),
      textBody: userEmailPlainText
    });
    
    // Email para os administradores
    const adminEmailContent = `
      <h2 style="color: #ef4444; margin-bottom: 20px;">Novo ${typeInfo.name} Registrado</h2>
      <p style="margin-bottom: 25px; font-size: 16px;">Um novo ${typeInfo.name.toLowerCase()} foi registrado no sistema e requer sua atenção.</p>
      
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #fef2f2; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid ${typeInfo.color};">
        <tr>
          <td style="padding: 20px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="padding-bottom: 15px; border-bottom: 1px solid #fecaca;">
                  <p style="margin: 0; font-size: 16px; font-weight: bold; color: #b91c1c;">Detalhes do ${typeInfo.name}</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 15px 0;">
                  <table cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td width="40%" style="color: #64748b; font-size: 14px; padding-bottom: 12px;">Protocolo:</td>
                      <td style="font-weight: bold; font-size: 14px; padding-bottom: 12px;">${ticket.protocol}</td>
                    </tr>
                    <tr>
                      <td width="40%" style="color: #64748b; font-size: 14px; padding-bottom: 12px;">Tipo:</td>
                      <td style="font-size: 14px; padding-bottom: 12px;">
                        <span style="display: inline-block; padding: 4px 8px; border-radius: 4px; background-color: ${typeInfo.color}1A; color: ${typeInfo.color}; font-weight: 500;">${typeInfo.name}</span>
                      </td>
                    </tr>
                    <tr>
                      <td width="40%" style="color: #64748b; font-size: 14px; padding-bottom: 12px;">Categoria:</td>
                      <td style="font-size: 14px; padding-bottom: 12px;">${ticket.category || 'Não especificada'}</td>
                    </tr>
                    <tr>
                      <td width="40%" style="color: #64748b; font-size: 14px; padding-bottom: 12px;">Nome:</td>
                      <td style="font-size: 14px; padding-bottom: 12px;">${ticket.name || 'Não informado'}</td>
                    </tr>
                    <tr>
                      <td width="40%" style="color: #64748b; font-size: 14px; padding-bottom: 12px;">Email:</td>
                      <td style="font-size: 14px; padding-bottom: 12px;">${ticket.email || 'Não informado'}</td>
                    </tr>
                    <tr>
                      <td width="40%" style="color: #64748b; font-size: 14px; padding-bottom: 12px;">Data:</td>
                      <td style="font-size: 14px; padding-bottom: 12px;">${formattedDate} às ${formattedTime}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      
      <div style="margin-bottom: 25px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://escuta.piaget.com.br'}/admin/chamados" style="display: inline-block; padding: 12px 24px; background-color: #1e40af; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; text-align: center;">Ver Chamado</a>
      </div>
      
      <p style="margin-bottom: 10px; font-size: 14px; color: #64748b;">Este ${typeInfo.name.toLowerCase()} deve ser respondido ${ticket.type === 'denuncia' ? 'em até 48 horas' : 'em até 15 dias úteis'}.</p>
    `;
    
    const adminEmailPlainText = `
Novo ${typeInfo.name} Registrado

Um novo ${typeInfo.name.toLowerCase()} foi registrado no sistema e requer sua atenção.

Detalhes do ${typeInfo.name}:
- Protocolo: ${ticket.protocol}
- Tipo: ${typeInfo.name}
- Categoria: ${ticket.category || 'Não especificada'}
- Nome: ${ticket.name || 'Não informado'}
- Email: ${ticket.email || 'Não informado'}
- Data: ${formattedDate} às ${formattedTime}

Este ${typeInfo.name.toLowerCase()} deve ser respondido ${ticket.type === 'denuncia' ? 'em até 48 horas' : 'em até 15 dias úteis'}.

Acesse o painel administrativo para responder:
${process.env.NEXT_PUBLIC_APP_URL || 'https://escuta.piaget.com.br'}/admin/chamados
    `;
    
    // Enviar email para os administradores
    await sendEmail({
      to: process.env.ADMIN_EMAIL || 'contato@piaget.com.br',
      subject: `Novo ${typeInfo.name} #${ticket.protocol} - Requer Atenção`,
      htmlBody: getBaseEmailHtml(adminEmailContent),
      textBody: adminEmailPlainText
    });
    
    console.log(`[Ticket] Notificações de email enviadas para o ticket ${ticket.protocol}`);
    return { success: true };
    
  } catch (error) {
    console.error('[Ticket] Erro ao enviar notificações por email:', error);
    return { success: false, error };
  }
}

/**
 * Envia uma notificação de mudança de status para o usuário
 */
export async function sendStatusUpdateNotification(ticket: Ticket): Promise<SendEmailResult> {
  if (!ticket.email) return { success: false, error: 'Email do destinatário não fornecido' };
  if (!ticket.status) return { success: false, error: 'Status do ticket não fornecido' };
  
  const typeInfo = ticketTypeInfo[ticket.type] || ticketTypeInfo.default;
  const currentStatus = ticket.status ? (ticketStatusInfo[ticket.status] || ticketStatusInfo.default) : ticketStatusInfo.default;
  
  try {
    const emailContent = `
      <h2 style="color: ${typeInfo.color}; margin-bottom: 20px;">Atualização do Seu ${typeInfo.name}</h2>
      <p style="margin-bottom: 25px; font-size: 16px;">Olá ${ticket.name || 'Cliente'},</p>
      <p style="margin-bottom: 25px; font-size: 16px;">O status do seu ${typeInfo.name.toLowerCase()} foi atualizado.</p>
      
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8fafc; border-radius: 8px; margin-bottom: 25px;">
        <tr>
          <td style="padding: 20px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="padding-bottom: 15px; border-bottom: 1px solid #e2e8f0;">
                  <p style="margin: 0; font-size: 16px; font-weight: bold; color: #334155;">Detalhes da Atualização</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 15px 0;">
                  <table cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td width="40%" style="color: #64748b; font-size: 14px; padding-bottom: 12px;">Protocolo:</td>
                      <td style="font-weight: bold; font-size: 14px; padding-bottom: 12px;">${ticket.protocol}</td>
                    </tr>
                    <tr>
                      <td width="40%" style="color: #64748b; font-size: 14px; padding-bottom: 12px;">Novo Status:</td>
                      <td style="font-size: 14px; padding-bottom: 12px;">
                        <span style="display: inline-block; padding: 4px 8px; border-radius: 4px; background-color: ${currentStatus.bgColor}; color: ${currentStatus.color}; font-weight: 500;">${currentStatus.name}</span>
                      </td>
                    </tr>
                    <tr>
                      <td width="40%" style="color: #64748b; font-size: 14px; padding-bottom: 12px;">Data da Atualização:</td>
                      <td style="font-size: 14px; padding-bottom: 12px;">${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      
      <p style="margin-bottom: 25px; font-size: 16px;">Você pode verificar mais detalhes sobre seu chamado entrando em contato com nossa equipe e informando o número do protocolo.</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
        <p style="margin-bottom: 5px; font-size: 14px;">Atenciosamente,</p>
        <p style="margin: 0; font-weight: bold; font-size: 16px;">Equipe Piaget</p>
      </div>
    `;
    
    const emailPlainText = `
Atualização do Seu ${typeInfo.name}

Olá ${ticket.name || 'Cliente'},

O status do seu ${typeInfo.name.toLowerCase()} foi atualizado.

Detalhes da Atualização:
- Protocolo: ${ticket.protocol}
- Novo Status: ${currentStatus.name}
- Data da Atualização: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}

Você pode verificar mais detalhes sobre seu chamado entrando em contato com nossa equipe e informando o número do protocolo.

Atenciosamente,
Equipe Piaget
    `;
    
    await sendEmail({
      to: ticket.email,
      subject: `Atualização do Seu ${typeInfo.name} #${ticket.protocol}`,
      htmlBody: getBaseEmailHtml(emailContent),
      textBody: emailPlainText
    });
    
    console.log(`[Ticket] Notificação de mudança de status enviada para o ticket ${ticket.protocol}`);
    return { success: true };
    
  } catch (error) {
    console.error('[Ticket] Erro ao enviar notificação de mudança de status:', error);
    return { success: false, error };
  }
} 