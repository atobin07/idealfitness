import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

type OtpType = "recovery" | "magiclink" | "email" | "signup" | "invite" | "email_change";

// Handles the link Supabase emails for magic-link sign-in and password resets.
// Establishes a session (PKCE `code` or `token_hash`) then forwards to `next`.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as OtpType | null;
  const next = searchParams.get("next") || "/dashboard";

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }

  // Bad or expired link — send them somewhere they can start over.
  const fallback = next === "/reset" ? "/forgot" : "/login";
  return NextResponse.redirect(new URL(fallback, origin));
}
