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
 * Verifica se a URL de origem é a mesma que a de destino, para evitar loops
 */
function isCircularRedirection(fromUrl: string, toUrl: string): boolean {
  const stripQueryParams = (url: string) => url.split('?')[0];
  const normalizedFrom = stripQueryParams(fromUrl);
  const normalizedTo = stripQueryParams(toUrl);
  
  return normalizedFrom === normalizedTo || 
         (normalizedFrom === '/admin' && normalizedTo === '/admin/login') ||
         (normalizedFrom === '/admin/login' && normalizedTo === '/admin');
}

/**
 * Middleware para controle de acesso às rotas administrativas
 */
export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const fullUrl = request.url;
  
  console.log(`[Middleware] Verificando: ${pathname}, URL completa: ${fullUrl}`);
  
  // Verificar parâmetros especiais que indicam que devemos permitir a navegação
  // sem interferência do middleware para resolver problemas de loop ou autorização forçada
  const hasCleanParam = searchParams.get('clean') === 'true';
  const hasManualParam = searchParams.get('manual') === 'true';
  const hasResetParam = searchParams.get('reset') === 'true';
  const hasAccessParam = searchParams.get('access') === 'auth';
  
  // Se tiver qualquer parâmetro de bypass, permitir acesso sem verificação adicional
  if (hasCleanParam || hasManualParam || hasResetParam || hasAccessParam) {
    console.log(`[Middleware] Detectado parâmetro especial de bypass. Permitindo navegação direta.`);
    
    // Se for parâmetro de acesso auth, vamos adicionar um cookie especial para evitar
    // que o usuário seja redirecionado para login nas navegações internas
    if (hasAccessParam) {
      const response = NextResponse.next();
      // Adicionamos um cookie auxiliar que expira em 8 horas
      response.cookies.set('admin_access', 'true', { 
        maxAge: 60 * 60 * 8, // 8 horas
        path: '/admin',
        httpOnly: true,
        sameSite: 'lax'
      });
      return response;
    }
    
    return NextResponse.next();
  }
  
  // Verifica se a rota está relacionada a autenticação ou é pública
  const isPublicApiRoute = pathname.startsWith('/api/auth') || pathname.startsWith('/api/debug');
  const isPublicPageRoute = PUBLIC_ROUTES.some(path => pathname === path || pathname.startsWith(`${path}/`));

  // Permite acesso a rotas públicas
  if (isPublicApiRoute || isPublicPageRoute) {
    console.log(`[Middleware] Rota pública permitida: ${pathname}`);
    return NextResponse.next();
  }
  
  // Verifica se a rota requer autenticação administrativa
  if (pathname.startsWith('/admin')) {
    console.log(`[Middleware] Verificando autenticação para rota admin: ${pathname}`);
    const sessionCookieName = getSessionCookieName();
    const sessionCookie = request.cookies.get(sessionCookieName);
    const adminAccessCookie = request.cookies.get('admin_access');
    
    console.log(`[Middleware] Cookie de sessão ${sessionCookieName} existe: ${!!sessionCookie}`);
    console.log(`[Middleware] Cookie admin_access existe: ${!!adminAccessCookie}`);

    // Redireciona para login se não houver nem cookie de sessão nem cookie admin_access
    if (!sessionCookie && !adminAccessCookie) {
      console.log(`[Middleware] Sem cookies de autenticação. Redirecionando para login.`);
      const url = new URL('/admin/login', request.url);
      
      // Adicionar o caminho original como parâmetro, exceto se for potencialmente circular
      if (!isCircularRedirection(pathname, '/admin/login')) {
        url.searchParams.set('from', pathname);
      }
      
      // Adicionar timestamp para evitar cache
      url.searchParams.set('t', Date.now().toString());
      
      return NextResponse.redirect(url);
    }
    
    // Se o usuário está tentando acessar a raiz de admin com cookie válido, redirecionar para dashboard
    /* Comentado para permitir acesso direto à página principal do admin
    if (pathname === '/admin' && sessionCookie) {
      console.log(`[Middleware] Usuário autenticado tentando acessar /admin. Redirecionando para dashboard.`);
      // Adicionar parâmetro access=auth para evitar que o middleware interfira
      const dashboardUrl = new URL('/admin/dashboard', request.url);
      dashboardUrl.searchParams.set('access', 'auth');
      dashboardUrl.searchParams.set('t', Date.now().toString());
      return NextResponse.redirect(dashboardUrl);
    }
    */
    
    // Permite acesso se o cookie existir
    console.log(`[Middleware] Cookie de sessão encontrado. Permitindo acesso a: ${pathname}`);
    return NextResponse.next();
  }
  
  // Para qualquer outra rota, permite acesso
  return NextResponse.next();
}

/**
 * Configuração do matcher para aplicar o middleware apenas nas rotas /admin
 */
export const config = {
  matcher: [
    '/admin/:path*', // Aplica a todas as rotas dentro de /admin
  ],
} 