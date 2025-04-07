import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  console.log(`[Middleware] Processando rota: ${pathname}`)
  console.log(`[Middleware] URL completa: ${request.url}`)
  console.log(`[Middleware] Cookies: ${request.headers.get('cookie')}`)
  
  // Ignorar rotas que não devem passar pelo middleware de autenticação
  if (
    pathname.includes('/admin/login') || 
    pathname.includes('/admin/login-debug') || 
    pathname.includes('/admin/google-auth') ||
    pathname.includes('/api/auth')
  ) {
    console.log(`[Middleware] Rota excluída da verificação: ${pathname}`)
    return NextResponse.next()
  }
  
  // Obter o token da sessão
  let token;
  try {
    token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === 'production',
    })
    
    console.log(`[Middleware] Token obtido:`, !!token)
    if (token) {
      console.log(`[Middleware] Detalhes do usuário:`, {
        id: token.id,
        email: token.email,
        role: token.role,
        permissions: token.permissions && JSON.stringify(token.permissions).substring(0, 100) // limitando para evitar logs enormes
      })
    } else {
      console.log(`[Middleware] Sem token ou token inválido. Headers Cookie:`, request.headers.get('cookie'))
    }
  } catch (error) {
    console.error(`[Middleware] Erro ao processar token:`, error)
    token = null
  }
  
  // Verificar se é uma rota administrativa que exige autenticação
  if (pathname.startsWith('/admin')) {
    console.log(`[Middleware] Rota administrativa detectada: ${pathname}`)
    
    // Se não houver token, redireciona para login
    if (!token) {
      console.log(`[Middleware] Sem token de autenticação, redirecionando para login`)
      const url = new URL('/admin/login', request.url)
      url.searchParams.set('from', pathname)
      return NextResponse.redirect(url)
    }
    
    // Verifica rotas específicas
    if (pathname.startsWith('/admin/dashboard')) {
      console.log(`[Middleware] Verificando acesso ao dashboard`)
      
      // Debug para entender melhor o problema com viewDashboard
      if (token.permissions) {
        console.log(`[Middleware] Permissões completas:`, JSON.stringify(token.permissions))
      } else {
        console.log(`[Middleware] Usuário não tem objeto permissions no token`)
      }
      
      // Permitir acesso se tiver a permissão viewDashboard ou for admin
      if (!token.permissions?.viewDashboard && token.role !== 'admin') {
        console.log(`[Middleware] Usuário sem permissão para dashboard (nem viewDashboard nem admin)`)
        return NextResponse.redirect(new URL('/admin/unauthorized', request.url))
      }
      
      console.log(`[Middleware] Acesso ao dashboard permitido`)
    } 
    // Verificação para outras áreas administrativas
    else if (!pathname.startsWith('/admin/dashboard')) {
      // Outras áreas administrativas exigem role admin
      if (token.role !== 'admin') {
        console.log(`[Middleware] Usuário não é admin (role=${token.role}), redirecionando`)
        return NextResponse.redirect(new URL('/admin/unauthorized', request.url))
      }
      
      console.log(`[Middleware] Acesso admin permitido para usuário com role '${token.role}'`)
    }
  }
  
  return NextResponse.next()
}

// Matcher para aplicar o middleware
export const config = {
  matcher: [
    '/admin/:path*',
  ],
} 