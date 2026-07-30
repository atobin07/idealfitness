// Public Supabase connection values.
//
// These are the browser-public URL + publishable/anon key — safe to ship in
// client code (access is enforced by row-level security). We read from env when
// available and fall back to literals so the app works on any host even if the
// environment variables haven't been configured in the dashboard (e.g. the Edge
// middleware runtime, where a missing value would otherwise crash the request).
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://oknfnlucnnnzgxahtkrp.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "sb_publishable_nbyLuTf1yM5AEp1_TRi9LA_CHsFKqm8";
