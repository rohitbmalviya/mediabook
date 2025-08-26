// ============================================================
// MediBook — Next.js 16 Proxy (replaces middleware.ts)
//
// Route protection:
//  /dashboard    → any authenticated user
//  /booking/*    → any authenticated user
//  /doctor       → DOCTOR role only
//  /doctor/*     → DOCTOR role only
//  /login        → redirect to dashboard if already logged in
//  /register     → redirect to dashboard if already logged in
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const COOKIE_NAME = 'mb_session'

function getEncodedSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET ?? ''
  return new TextEncoder().encode(secret)
}

interface SessionClaims {
  userId: string
  role: 'PATIENT' | 'DOCTOR'
  expiresAt: number
}

async function verifySession(
  token: string
): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, getEncodedSecret(), {
      algorithms: ['HS256'],
    })
    return payload as unknown as SessionClaims
  } catch {
    return null
  }
}

// Patterns for protected routes
const AUTHED_ROUTES = ['/dashboard', '/booking']
const DOCTOR_ONLY_ROUTES = ['/doctor']
const PUBLIC_AUTH_ROUTES = ['/login', '/register']

function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
  )
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl

  const cookieToken = request.cookies.get(COOKIE_NAME)?.value
  const session = cookieToken ? await verifySession(cookieToken) : null

  const isAuthed = session !== null

  // Authenticated users visiting /login or /register → redirect to their dashboard
  if (isAuthed && matchesPrefix(pathname, PUBLIC_AUTH_ROUTES)) {
    const target =
      session.role === 'DOCTOR'
        ? new URL('/doctor', request.url)
        : new URL('/dashboard', request.url)
    return NextResponse.redirect(target)
  }

  // /doctor/* → must be DOCTOR
  if (matchesPrefix(pathname, DOCTOR_ONLY_ROUTES)) {
    if (!isAuthed) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }
    if (session.role !== 'DOCTOR') {
      // Authenticated but wrong role — send to their own dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // /dashboard, /booking/* → any authenticated user
  if (matchesPrefix(pathname, AUTHED_ROUTES)) {
    if (!isAuthed) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image  (image optimization)
     * - favicon.ico
     * - public assets (*.png, *.svg, *.jpg, *.ico, *.webp)
     * - /api routes (handled by route handlers)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|jpg|jpeg|gif|webp|ico)$|api/).*)',
  ],
}
