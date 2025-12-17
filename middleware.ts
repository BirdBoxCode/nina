import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  
  // Default to main
  let variant = 'main'
  
  // Logic for localhost vs production
  // We check for "art." or "tattoo." in the hostname
  if (hostname.includes('art.')) {
    variant = 'art'
  } else if (hostname.includes('tattoo.')) {
    variant = 'tattoo'
  }

  // Set header for Server Components to read
  const response = NextResponse.next()
  response.headers.set('x-site-variant', variant)
  
  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
