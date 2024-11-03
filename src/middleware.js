import axios from "axios";
import { NextResponse } from "next/server";

export function middleware(request) {
  axios.defaults.withCredentials = true
  const url = new URL(request.url);
  const origin = url.origin;
  const pathname = url.pathname;
  const headers = new Headers(request.headers);
  headers.set("x-current-path", url.href);
  return NextResponse.next({ headers });
}

export const config = { 
  matcher: [
    // match all routes except static files and APIs
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};