import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email-service';

export async function GET() {
  try {
    const result = await sendEmail({
      to: 'seu-email@exemplo.com', // Substitua pelo seu email para teste
      subject: 'Teste de configuração SES - Escuta Piaget',
      htmlBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #3b82f6;">Teste de Email</h1>
          <p>Este é um email de teste do sistema Escuta Piaget.</p>
          <p>Configuração SES funcionando corretamente!</p>
          <hr>
          <p style="color: #666; font-size: 12px;">Data do teste: ${new Date().toLocaleString('pt-BR')}</p>
        </div>
      `
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Email enviado com sucesso', 
      details: result 
    });
  } catch (error) {
    console.error('Falha no teste de email:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Falha ao enviar email de teste', 
      error: String(error) 
    }, { status: 500 });
  }
} 