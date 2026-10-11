// Server-only AI + knowledge helpers (Lovable AI Gateway).
const GATEWAY = "https://ai.gateway.lovable.dev/v1";

export class AiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

function key() {
  const k = process.env["LOVABLE_API_KEY"];
  if (!k) throw new AiError(500, "AI is not configured");
  return k;
}

async function failure(res: Response): Promise<AiError> {
  let msg = "";
  try { const j = (await res.json()) as { message?: string; error?: { message?: string } | string }; msg = j.message || (typeof j.error === "string" ? j.error : j.error?.message) || ""; } catch { /* ignore */ }
  if (res.status === 429) return new AiError(429, "Too many requests, try again in a moment.");
  if (res.status === 402) return new AiError(402, msg || "AI credits are used up. Add credits in workspace settings.");
  return new AiError(res.status, msg || `AI request failed (${res.status})`);
}

// ---------- Text processing ----------
export function htmlToText(html: string): { title: string; text: string } {
  const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "").trim();
  let t = html
    .replace(/<(script|style|noscript|svg|nav|footer|header|iframe|form)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<\/(p|div|li|h[1-6]|tr|section|article|br)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ");
  t = t.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
  t = t.split("\n").map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean).join("\n");
  return { title: decode(title), text: t };
}
const decode = (s: string) => s.replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"');

export async function fetchPage(url: string) {
  const u = new URL(url.startsWith("http") ? url : `https://${url}`);
  if (!["http:", "https:"].includes(u.protocol)) throw new Error("Only http(s) URLs are supported");
  const res = await fetch(u.toString(), { headers: { "User-Agent": "Mozilla/5.0 (compatible; AgentStudioBot/1.0)", Accept: "text/html,*/*" }, redirect: "follow" });
  if (!res.ok) throw new Error(`The page returned ${res.status}`);
  const html = (await res.text()).slice(0, 2_000_000);
  return { url: u.toString(), ...htmlToText(html) };
}

export function chunkText(text: string, size = 1000, overlap = 150): string[] {
  const clean = text.replace(/\n{3,}/g, "\n\n").trim();
  const out: string[] = [];
  let i = 0;
  while (i < clean.length) {
    let end = Math.min(i + size, clean.length);
    if (end < clean.length) {
      const brk = Math.max(clean.lastIndexOf("\n", end), clean.lastIndexOf(". ", end));
      if (brk > i + size * 0.5) end = brk + 1;
    }
    const piece = clean.slice(i, end).trim();
    if (piece) out.push(piece);
    if (end >= clean.length) break;
    i = Math.max(end - overlap, i + 1);
  }
  return out;
}

// ---------- Embeddings ----------
export async function embed(inputs: string[]): Promise<number[][]> {
  const out: number[][] = [];
  for (let i = 0; i < inputs.length; i += 50) {
    const res = await fetch(`${GATEWAY}/embeddings`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-embedding-2", input: inputs.slice(i, i + 50), dimensions: 768 }),
    });
    if (!res.ok) throw await failure(res);
    const j = (await res.json()) as { data: { embedding: number[]; index?: number }[] };
    out.push(...j.data.map((d) => d.embedding));
  }
  return out;
}

// ---------- Chat streaming (returns a stream of plain text deltas) ----------
export type ChatMsg = { role: "user" | "assistant"; content: string };

async function* sse(res: Response): AsyncGenerator<{ event?: string; data: string }> {
  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let idx;
    while ((idx = buf.indexOf("\n\n")) >= 0) {
      const frame = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      let event: string | undefined; const data: string[] = [];
      for (const line of frame.split("\n")) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
      }
      if (data.length) yield { event, data: data.join("\n") };
    }
  }
}

export async function streamChat(opts: { model: string; system: string; messages: ChatMsg[]; signal?: AbortSignal; json?: { name: string; schema: object } }): Promise<AsyncGenerator<string>> {
  const { model, system, messages, signal } = opts;
  const headers = { Authorization: `Bearer ${key()}`, "Content-Type": "application/json", "X-Lovable-AIG-SDK": "fetch" };

  if (model.startsWith("anthropic/")) {
    const res = await fetch(`${GATEWAY}/messages`, { method: "POST", headers, signal, body: JSON.stringify({ model, max_tokens: 4096, system, messages, stream: true }) });
    if (!res.ok) throw await failure(res);
    return (async function* () {
      for await (const f of sse(res)) {
        const j = JSON.parse(f.data);
        if (j.type === "content_block_delta" && j.delta?.type === "text_delta") yield j.delta.text as string;
        if (j.type === "message_delta" && j.delta?.stop_reason === "refusal") { yield "\n\nSorry, I can't help with that."; return; }
        if (j.type === "error") throw new AiError(500, j.error?.message ?? "AI error");
      }
    })();
  }

  if (model.startsWith("openai/")) {
    const reasoning = model.startsWith("openai/gpt-6") ? { reasoning: { effort: "low" } } : {};
    const body: Record<string, unknown> = { model, instructions: system, input: messages.map((m) => ({ role: m.role, content: m.content })), stream: true, store: false, ...reasoning };
    if (opts.json) body.text = { format: { type: "json_schema", name: opts.json.name, schema: opts.json.schema, strict: true } };
    const res = await fetch(`${GATEWAY}/responses`, { method: "POST", headers, signal, body: JSON.stringify(body) });
    if (!res.ok) throw await failure(res);
    return (async function* () {
      for await (const f of sse(res)) {
        if (f.data === "[DONE]") return;
        const j = JSON.parse(f.data);
        if (j.type === "response.output_text.delta") yield j.delta as string;
        if (j.type === "response.failed" || j.type === "error") throw new AiError(500, j.response?.error?.message ?? j.message ?? "AI error");
      }
    })();
  }

  const res = await fetch(`${GATEWAY}/chat/completions`, { method: "POST", headers, signal, body: JSON.stringify({ model, messages: [{ role: "system", content: system }, ...messages], stream: true }) });
  if (!res.ok) throw await failure(res);
  return (async function* () {
    for await (const f of sse(res)) {
      if (f.data === "[DONE]") return;
      const j = JSON.parse(f.data);
      const d = j.choices?.[0]?.delta?.content;
      if (d) yield d as string;
    }
  })();
}

export async function completeText(opts: Parameters<typeof streamChat>[0]) {
  let out = "";
  for await (const d of await streamChat(opts)) out += d;
  return out;
}
