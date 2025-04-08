import { getServerSession } from 'next-auth/next'
import { NextResponse } from 'next/server'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function GET() {
  try {
    // Obtém a sessão do servidor
    const session = await getServerSession(authOptions)
    
    // Retorna informações da sessão
    return NextResponse.json({
      authenticated: !!session,
      session: session ? {
        user: {
          ...session.user,
          // Não inclua a senha ou informações sensíveis!
        },
        expires: session.expires
      } : null,
      serverTime: new Date().toISOString(),
      authOptions: {
        providers: authOptions.providers.map(p => p.id),
        session: {
          strategy: authOptions.session?.strategy
        },
        pages: authOptions.pages,
        debug: authOptions.debug
      }
    }, { status: 200 })
  } catch (error) {
    console.error('Erro ao obter informações da sessão:', error)
    return NextResponse.json(
      { error: 'Falha ao obter informações da sessão', details: (error as Error).message },
      { status: 500 }
    )
  }
} 