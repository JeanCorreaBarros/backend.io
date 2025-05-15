import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Rutas que requieren autenticación
  const protectedPaths = ["/dashboard", "/profile", "/projects"]

  // Verificar si la ruta actual requiere autenticación
  const isProtectedPath = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path))

  if (!isProtectedPath) {
    return NextResponse.next()
  }

  // Obtener la cookie de autenticación simulada
  const fakeAuth = request.cookies.get("fake_auth")?.value

  // Si no hay autenticación, redirigir al login
  if (!fakeAuth) {
    const url = new URL("/login", request.url)
    url.searchParams.set("from", request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Si hay autenticación, permitir el acceso
  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*", "/projects/:path*"],
}
