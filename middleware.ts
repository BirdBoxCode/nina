import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const queryVariant = searchParams.get('v')
  const cookieVariant = request.cookies.get('variant')?.value
  const hostname = request.headers.get('host') || ''
  
  // Default to main
  let variant = 'main'
  
  // Priority: 
  // 1. Query parameter (?v=art)
  // 2. Cookie (for persistence)
  // 3. Subdomain (for local dev or future custom domain)

  if (queryVariant === 'art' || queryVariant === 'tattoo' || queryVariant === 'main') {
    variant = queryVariant
  } else if (cookieVariant === 'art' || cookieVariant === 'tattoo') {
    variant = cookieVariant
  } else if (hostname.includes('art.')) {
    variant = 'art'
  } else if (hostname.includes('tattoo.')) {
    variant = 'tattoo'
  }

  // Set header for Server Components to read
  const response = NextResponse.next({
    request: {
      headers: new Headers(request.headers),
    },
  })
  
  // Set the header on the request so it's available to server components
  response.headers.set('x-site-variant', variant)
  
  // If we have a new variant from query param, set cookie
  if (queryVariant) {
    if (queryVariant === 'main') {
      response.cookies.delete('variant')
    } else {
      response.cookies.set('variant', variant, { path: '/', maxAge: 60 * 60 * 24 * 7 }) // 7 days
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
