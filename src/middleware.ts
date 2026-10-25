import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value || 
                request.headers.get('Authorization')?.replace('Bearer ', '')

  // Protected routes
  const protectedRoutes = ['/dashboard']
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  // If accessing a protected route without a token
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If accessing login/register with valid token
  if ((request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register') && token) {
    try {
      const secret = process.env.JWT_SECRET || 'ipcecma-secret-key-2024'
      jwt.verify(token, secret)
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } catch (error) {
      // Token invalid, continue to login
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/register'
  ]
}
