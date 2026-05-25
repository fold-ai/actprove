import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PREFIXES = [
  "/",
  "/login",
  "/signup",
  "/reset-password",
  "/verify",
  "/pricing",
  "/eu-ai-act",
  "/about",
  "/security",
  "/changelog",
  "/blog",
  "/trust",
  "/literacy",
  "/audit",
  "/developers",
  "/partners",
  "/tools",
  "/compare",
  "/opengraph-image",
  "/api",
  "/auth",
];

const PUBLIC_FILES = ["/sitemap.xml", "/robots.txt", "/favicon.ico"];

function isPublic(pathname: string) {
  if (pathname === "/") return true;
  if (PUBLIC_FILES.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some(
    (p) => p !== "/" && (pathname === p || pathname.startsWith(p + "/")),
  );
}

/** Refreshes the Supabase session cookie and guards protected routes. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Unauthenticated user hitting a protected route → /login
  if (!user && !isPublic(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  // Authenticated user on an auth page → /dashboard
  if (
    user &&
    ["/login", "/signup"].some((p) => pathname === p)
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}
