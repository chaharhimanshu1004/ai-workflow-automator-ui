import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {

    if (request.nextUrl.pathname === '/') {
        const token = request.cookies.get('accessToken')?.value

        if (token) {
            return NextResponse.redirect(new URL('/workflows', request.url))
        }
    }

    if (request.nextUrl.pathname.startsWith('/credentials') ||
        request.nextUrl.pathname.startsWith('/workflows')) {

        const token = request.cookies.get('accessToken')?.value

        if (!token) {
            return NextResponse.redirect(new URL('/', request.url))
        }
    }
    return NextResponse.next()
}

export const config = {
    matcher: ['/credentials/:path*', '/workflows/:path*', '/']
}