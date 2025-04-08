import { getServerSession } from 'next-auth/next'
import { NextResponse } from 'next/server'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function GET() {
  try {
    // Obtém a sessão do servidor
    const session = await getServerSession(authOptions)
    
    // Retorna informações detalhadas
    return NextResponse.json({
      serverTime: new Date().toISOString(),
      authenticated: !!session,
      session: session ? {
        user: {
          ...session.user,
          // Omitir informações sensíveis
        },
        expires: session.expires
      } : null,
      authProviders: authOptions.providers.map(p => p.id),
      sessionStrategy: authOptions.session?.strategy,
      debug: authOptions.debug,
      nextAuthPages: authOptions.pages,
      serverInfo: {
        nextjsVersion: process.env.NEXT_PUBLIC_VERSION || 'desconhecido',
        node: process.version,
        environment: process.env.NODE_ENV
      }
    }, { status: 200 })
  } catch (error) {
    console.error('Erro ao obter informações de depuração da autenticação:', error)
    return NextResponse.json(
      { error: 'Falha ao obter informações de depuração', details: (error as Error).message },
      { status: 500 }
    )
  }
} 