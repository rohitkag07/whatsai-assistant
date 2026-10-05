import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

function recoveryRedirect(request: NextRequest, pathname: string) {
  const redirect = request.nextUrl.clone();
  redirect.pathname = pathname;
  redirect.search = "";
  return redirect;
}

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");

  if (!tokenHash || type !== "recovery") {
    const failure = recoveryRedirect(request, "/forgot-password");
    failure.searchParams.set("error", "invalid_or_expired");
    return NextResponse.redirect(failure);
  }

  const supabase = await createClient();
  const result = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: "recovery",
  });

  if (result.error) {
    const failure = recoveryRedirect(request, "/forgot-password");
    failure.searchParams.set("error", "invalid_or_expired");
    return NextResponse.redirect(failure);
  }

  return NextResponse.redirect(
    recoveryRedirect(request, "/account/update-password"),
  );
}
