export { updateSession as middleware } from '@/lib/supabase/middleware';

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|icon.svg).*)',
  ],
};
