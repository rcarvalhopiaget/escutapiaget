import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Verificar se é uma rota administrativa
  if (pathname.startsWith('/admin') && !pathname.includes('/admin/login')) {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    // Se não estiver autenticado, redirecionar para a página de login
    if (!token) {
      const url = new URL('/admin/login', request.url)
      url.searchParams.set('callbackUrl', encodeURI(pathname))
      return NextResponse.redirect(url)
    }
    
    // Verificar se o usuário tem a role de administrador
    if (token.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }
  
  return NextResponse.next()
}

// Configurar em quais rotas o middleware será executado
export const config = {
  matcher: [
    '/admin/:path*',
  ],
} 