import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.json({ error: 'Código de autorização não encontrado' }, { status: 400 })
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )

    // Trocar o código de autorização por tokens
    const { tokens } = await oauth2Client.getToken(code)
    console.log('[Google Callback] Tokens recebidos:', tokens)

    // !! IMPORTANTE !!
    // Armazene o tokens.refresh_token de forma segura (ex: no banco de dados, associado ao usuário)
    // O refresh_token só é enviado na primeira vez que o usuário autoriza.
    // O access_token tem vida curta e precisa ser renovado usando o refresh_token.
    
    // Exemplo de como armazenar (substitua pela sua lógica real):
    // await saveRefreshTokenToDatabase(tokens.refresh_token);

    // Redirecionar o usuário de volta para a aplicação ou para uma página de sucesso
    // A URL de redirecionamento pode vir do parâmetro 'state' ou ser fixa
    const redirectUrl = '/' // Ou para onde o usuário deve ir após autorizar
    return NextResponse.redirect(new URL(redirectUrl, request.url))

  } catch (error) {
    console.error('[Google Callback] Erro ao obter tokens:', error)
    return NextResponse.json({ error: 'Falha ao processar autorização do Google' }, { status: 500 })
  }
} 