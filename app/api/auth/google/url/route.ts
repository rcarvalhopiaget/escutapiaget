import { NextRequest, NextResponse } from 'next/server'
import { getGoogleAuthUrl } from '@/lib/drive-service'

export async function GET(request: NextRequest) {
  try {
    const url = await getGoogleAuthUrl()
    return NextResponse.json({ url }, { status: 200 })
  } catch (error) {
    console.error('[Google Auth URL] Erro ao gerar URL de autorização:', error)
    return NextResponse.json(
      { error: 'Falha ao gerar URL de autorização do Google' }, 
      { status: 500 }
    )
  }
} 