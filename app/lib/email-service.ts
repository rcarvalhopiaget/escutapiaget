import { SES } from 'aws-sdk';

// Configuração do Amazon SES
const ses = new SES({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

// Função para enviar email
export async function sendEmail({
  to,
  subject,
  htmlBody,
  textBody,
  from: customFrom
}: {
  to: string | string[];
  subject: string;
  htmlBody: string;
  textBody?: string;
  from?: string;
}) {
  const recipients = Array.isArray(to) ? to : [to];
  
  try {
    // Define o endereço de origem padrão
    let from: string
    if (customFrom) {
      from = customFrom
    } else {
      from = process.env.EMAIL_FROM || 'contato@piaget.com.br'
    }

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