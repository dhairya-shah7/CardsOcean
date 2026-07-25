import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const session = request.cookies.get('session')?.value
  const isLoginPage = request.nextUrl.pathname.startsWith('/login')

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', request.nextUrl.pathname);

  // If there's no session and the user is not on /login, redirect to /login
  if (!session && !isLoginPage) {
    const url = new URL('/login', request.url)
    return NextResponse.redirect(url)
  }

  // If there is a session and the user is on /login, redirect to homepage
  if (session && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    }
  })
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - any file with an extension (e.g. logo.png, styles.css)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}
