import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  console.log(`[Middleware] Processando rota: ${pathname}`)
  console.log(`[Middleware] Cookies: ${request.headers.get('cookie')}`)
  
  // Verificar se é uma rota administrativa
  if (pathname.startsWith('/admin') && !pathname.includes('/admin/login') && !pathname.includes('/admin/login-debug')) {
    console.log(`[Middleware] Rota protegida detectada: ${pathname}`)
    
    try {
      const token = await getToken({ 
        req: request, 
        secret: process.env.NEXTAUTH_SECRET,
        secureCookie: process.env.NODE_ENV === 'production',
        cookieName: 'next-auth.session-token',
      })
      
      console.log(`[Middleware] Token obtido:`, token ? 'Sim' : 'Não')
      if (token) {
        console.log(`[Middleware] Detalhes do token:`, token)
      } else {
        console.log(`[Middleware] Sem token ou token inválido, verificando cookies...`)
        const cookies = request.cookies.getAll()
        console.log(`[Middleware] Cookies disponíveis:`, cookies.map(c => c.name))
      }
      
      // Se não estiver autenticado, redirecionar para a página de login
      if (!token) {
        console.log(`[Middleware] Sem token de autenticação, redirecionando para login`)
        const url = new URL('/admin/login', request.url)
        url.searchParams.set('callbackUrl', encodeURI(pathname))
        return NextResponse.redirect(url)
      }
      
      // Verificar se o usuário tem a role de administrador
      if (token.role !== 'admin') {
        console.log(`[Middleware] Usuário não é admin (role=${token.role}), redirecionando para home`)
        return NextResponse.redirect(new URL('/', request.url))
      }
      
      console.log(`[Middleware] Autorização concedida para ${pathname}`)
    } catch (error) {
      console.error(`[Middleware] Erro ao processar autenticação:`, error)
      const url = new URL('/admin/login', request.url)
      url.searchParams.set('callbackUrl', encodeURI(pathname))
      url.searchParams.set('error', 'AuthError')
      return NextResponse.redirect(url)
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