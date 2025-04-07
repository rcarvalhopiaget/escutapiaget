import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
// import { getToken } from 'next-auth/jwt' // Não precisamos mais de getToken aqui

// Função auxiliar para obter o nome do cookie de sessão
function getSessionCookieName() {
  const securePrefix = process.env.NODE_ENV === 'production' ? '__Secure-' : ''
  return `${securePrefix}next-auth.session-token`
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionCookieName = getSessionCookieName()
  
  console.log(`[Middleware] Processando rota: ${pathname}`)
  
  // Ignorar rotas públicas ou de autenticação
  const publicPaths = [
    '/admin/login', 
    '/admin/login-debug', 
    '/admin/auth-debug', 
    '/admin/google-auth', 
    '/admin/unauthorized'
  ];
  const isPublicApiRoute = pathname.startsWith('/api/auth') || pathname.startsWith('/api/debug');
  const isPublicPageRoute = publicPaths.some(path => pathname.includes(path));

  if (isPublicPageRoute || isPublicApiRoute) {
    console.log(`[Middleware] Rota pública ou de autenticação/debug, ignorando: ${pathname}`)
    return NextResponse.next()
  }
  
  // Para todas as outras rotas /admin, verificar apenas a EXISTÊNCIA do cookie de sessão
  if (pathname.startsWith('/admin')) {
    console.log(`[Middleware] Rota administrativa detectada: ${pathname}`)
    
    // Verificação otimista: Apenas checar se o cookie de sessão existe
    const sessionCookie = request.cookies.get(sessionCookieName)
    console.log(`[Middleware] Cookie de sessão (${sessionCookieName}) encontrado?`, !!sessionCookie)

    // Se não houver cookie de sessão, redireciona para login
    if (!sessionCookie) {
      console.log(`[Middleware] Sem cookie de sessão para ${pathname}, redirecionando para login`)
      const url = new URL('/admin/login', request.url)
      url.searchParams.set('from', pathname) // Mantém o destino original
      return NextResponse.redirect(url)
    }
    
    // Se o cookie existir, permite o acesso.
    // A verificação DETALHADA de token e permissões DEVE ser feita na página/componente/API.
    console.log(`[Middleware] Cookie de sessão encontrado para ${pathname}, permitindo acesso otimista.`)
    return NextResponse.next()
  }
  
  // Para qualquer outra rota fora de /admin, permitir acesso
  return NextResponse.next()
}

// Matcher para aplicar o middleware apenas nas rotas /admin
export const config = {
  matcher: [
    '/admin/:path*', // Aplica a todas as rotas dentro de /admin
  ],
} 