import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rotas públicas que não precisam de autenticação
  const publicRoutes = ['/login', '/register', '/recuperar-senha', '/convite-app', '/invite', '/']
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))

  // Se for rota pública, permite acesso
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Para rotas do dashboard, deixamos a verificação client-side (useEffect)
  // O middleware não bloqueia mais, pois o token está no localStorage
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (já têm validação própria)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|convite-app).*)',
  ],
}