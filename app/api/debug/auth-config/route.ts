import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Colete informações de configuração para debug
    const authConfig = {
      baseUrl: process.env.NEXTAUTH_URL || 'Não definido',
      secret: process.env.NEXTAUTH_SECRET ? 'Definido' : 'Não definido',
      debug: process.env.DEBUG_ENABLED === 'true' ? 'Ativado' : 'Desativado',
      nodeEnv: process.env.NODE_ENV || 'Não definido',
      googleClientId: process.env.GOOGLE_CLIENT_ID ? 'Definido' : 'Não definido',
      googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'Definido' : 'Não definido',
      cookiePrefix: process.env.COOKIE_PREFIX || 'next-auth',
      headers: {
        host: request.headers.get('host'),
        origin: request.headers.get('origin'),
        'x-forwarded-proto': request.headers.get('x-forwarded-proto'),
        'x-forwarded-host': request.headers.get('x-forwarded-host'),
      },
      cookies: parseCookies(request),
    };
    
    return NextResponse.json(authConfig, { status: 200 });
  } catch (error) {
    console.error('Erro ao coletar configurações de autenticação:', error);
    return NextResponse.json(
      { error: `Erro ao coletar configurações: ${error}` },
      { status: 500 }
    );
  }
}

function parseCookies(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) return {};
    
    const cookieArray = cookieHeader.split(';');
    const cookieMap: Record<string, string> = {};
    
    cookieArray.forEach(cookie => {
      const [key, value] = cookie.trim().split('=');
      
      // Redação segura dos valores de cookies, removendo informações sensíveis
      if (key && key.includes('session-token')) {
        cookieMap[key] = value ? 'Presente (valor oculto)' : 'Ausente';
      } else if (key && key.includes('csrf-token')) {
        cookieMap[key] = value ? 'Presente (valor oculto)' : 'Ausente';
      } else if (key && key.includes('callback-url')) {
        cookieMap[key] = value ? 'Presente (valor oculto)' : 'Ausente';
      } else if (key) {
        cookieMap[key] = value || '';
      }
    });
    
    return cookieMap;
  } catch (error) {
    console.error('Erro ao processar cookies:', error);
    return { error: 'Erro ao processar cookies' };
  }
} 