// Server-only helpers shared by the public widget endpoints.
export const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Expose-Headers": "X-Conversation-Id",
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

export const preflight = () => new Response(null, { status: 204, headers: CORS });

const host = (v: string) => {
  try { return new URL(v.includes("://") ? v : `https://${v}`).hostname.replace(/^www\./, "").toLowerCase(); } catch { return ""; }
};

/** Allowed when no domain restriction is set, the call comes from this app itself, or the origin matches. */
export function originAllowed(request: Request, allowed: string | null | undefined) {
  if (!allowed?.trim()) return true;
  const origin = request.headers.get("origin") || request.headers.get("referer") || "";
  if (!origin) return false;
  const o = host(origin);
  if (o && o === host(new URL(request.url).origin)) return true;
  const a = host(allowed);
  return !!a && (o === a || o.endsWith(`.${a}`));
}

export async function loadAgent(agentId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(agentId)) return null;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("agents").select("*").eq("id", agentId).maybeSingle();
  return data;
}
