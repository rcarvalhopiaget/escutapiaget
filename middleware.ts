import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  console.log(`[Middleware] Processando rota: ${pathname}`)
  
  // Obter o token uma única vez para uso em toda a função
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
        permissions: token.permissions
      })
    } else {
      console.log(`[Middleware] Sem token ou token inválido`)
    }
  } catch (error) {
    console.error(`[Middleware] Erro ao processar token:`, error)
    token = null
  }
  
  // Verificar se é uma rota administrativa geral
  if (pathname.startsWith('/admin') && !pathname.includes('/admin/login') && !pathname.includes('/admin/login-debug') && !pathname.includes('/admin/google-auth')) {
    console.log(`[Middleware] Rota protegida detectada: ${pathname}`)
    
    // Se não estiver autenticado, redirecionar para a página de login
    if (!token) {
      console.log(`[Middleware] Sem token de autenticação, redirecionando para login`)
      const url = new URL('/admin/login', request.url)
      url.searchParams.set('callbackUrl', encodeURI(pathname))
      return NextResponse.redirect(url)
    }
    
    // Verificação específica para o dashboard
    if (pathname.startsWith('/admin/dashboard')) {
      console.log(`[Middleware] Verificando acesso ao dashboard`)
      
      // Verificar permissão específica para dashboard
      if (!token.permissions?.viewDashboard) {
        console.log(`[Middleware] Usuário sem permissão 'viewDashboard'`)
        return NextResponse.redirect(new URL('/admin/unauthorized', request.url))
      }
      
      console.log(`[Middleware] Acesso ao dashboard permitido para usuário com permissão 'viewDashboard'`)
    } 
    // Verificação específica para usuários admin
    else if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/dashboard')) {
      // Verificar se o usuário tem a role de administrador para outras áreas admin
      if (token.role !== 'admin') {
        console.log(`[Middleware] Usuário não é admin (role=${token.role}), redirecionando`)
        return NextResponse.redirect(new URL('/admin/unauthorized', request.url))
      }
      
      console.log(`[Middleware] Acesso admin permitido para usuário com role '${token.role}'`)
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