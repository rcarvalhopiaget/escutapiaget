import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
// import { getToken } from 'next-auth/jwt' // Não precisamos mais de getToken aqui

/**
 * Obtém o nome do cookie de sessão baseado no ambiente
 */
function getSessionCookieName(): string {
  const securePrefix = process.env.NODE_ENV === 'production' ? '__Secure-' : ''
  return `${securePrefix}next-auth.session-token`
}

/**
 * Lista de rotas públicas que não requerem autenticação
 */
const PUBLIC_ROUTES = [
  '/admin/login', 
  '/admin/login-debug', 
  '/admin/auth-debug',
  '/admin/session-debug',
  '/admin/google-auth', 
  '/admin/unauthorized',
  '/admin/setup',
  '/admin/criar-admin'
];

/**
 * Middleware para controle de acesso às rotas administrativas
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Verifica se a rota está relacionada a autenticação ou é pública
  const isPublicApiRoute = pathname.startsWith('/api/auth') || pathname.startsWith('/api/debug')
  const isPublicPageRoute = PUBLIC_ROUTES.some(path => pathname === path || pathname.startsWith(`${path}/`))

  // Permite acesso a rotas públicas
  if (isPublicPageRoute || isPublicApiRoute) {
    return NextResponse.next()
  }
  
  // Verifica se a rota requer autenticação administrativa
  if (pathname.startsWith('/admin')) {
    const sessionCookieName = getSessionCookieName()
    const sessionCookie = request.cookies.get(sessionCookieName)

    // Redireciona para login se não houver cookie de sessão
    if (!sessionCookie) {
      const url = new URL('/admin/login', request.url)
      url.searchParams.set('from', pathname)
      return NextResponse.redirect(url)
    }
    
    // Permite acesso se o cookie existir
    // A verificação detalhada de token e permissões é feita na página/componente
    return NextResponse.next()
  }
  
  // Para qualquer outra rota, permite acesso
  return NextResponse.next()
}

/**
 * Configuração do matcher para aplicar o middleware apenas nas rotas /admin
 */
export const config = {
  matcher: [
    '/admin/:path*', // Aplica a todas as rotas dentro de /admin
  ],
} 