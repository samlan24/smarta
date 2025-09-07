import { type NextRequest } from 'next/server'
import { updateSession } from './src/app/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Handle Supabase auth
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes that don't need auth (like generate-commit)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/generate-commit|api/health).*)',
  ],
}