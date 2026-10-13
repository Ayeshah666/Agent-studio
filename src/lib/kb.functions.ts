import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const addSchema = z.object({
  agentId: z.string().uuid(),
  type: z.enum(["url", "file", "text"]),
  title: z.string().max(300).optional(),
  content: z.string().max(2_000_000).optional(),
  url: z.string().max(2000).optional(),
});

export const addKnowledge = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => addSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { fetchPage, chunkText, embed } = await import("./ai.server");

    let title = data.title?.trim() || "Untitled";
    let content = data.content ?? "";
    let source_url: string | null = null;
    if (data.type === "url") {
      if (!data.url) throw new Error("URL is required");
      source_url = data.url;
    }
    const { data: item, error } = await supabaseAdmin.from("knowledge_items")
      .insert({ agent_id: data.agentId, source_type: data.type, title: data.type === "url" ? (data.url ?? null) : title, source_url, status: "processing" })
      .select().single();
    if (error) throw new Error(error.message);

    try {
      if (data.type === "url") {
        const page = await fetchPage(data.url!);
        title = page.title || page.url;
        content = page.text;
      }
      if (content.trim().length < 20) throw new Error("No readable text was found");
      const chunks = chunkText(content);
      const vectors = await embed(chunks);
      const rows = chunks.map((c, i) => ({ agent_id: data.agentId, item_id: item.id, content: c, embedding: JSON.stringify(vectors[i]) }));
      for (let i = 0; i < rows.length; i += 100) {
        const { error: e } = await supabaseAdmin.from("knowledge_chunks").insert(rows.slice(i, i + 100));
        if (e) throw new Error(e.message);
      }
      await supabaseAdmin.from("knowledge_items").update({ title, content: content.slice(0, 500_000), status: "ready", error: null }).eq("id", item.id);
      return { id: item.id, chunks: chunks.length };
    } catch (e) {
      const msg = (e as Error).message;
      await supabaseAdmin.from("knowledge_items").update({ status: "failed", error: msg }).eq("id", item.id);
      throw new Error(msg);
    }
  });

export const autofillChatbot = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ website: z.string().min(3).max(2000), business_name: z.string().max(300).optional() }).parse(d))
  .handler(async ({ data }) => {
    const { fetchPage, completeText } = await import("./ai.server");
    const page = await fetchPage(data.website);
    const raw = await completeText({
      model: "openai/gpt-6-astra",
      system: "You set up website chatbots. From the website text, write: personality (2-3 sentences on tone and voice), goal (what the bot should help visitors do), additional_info (key facts: services, hours, location, contact, pricing if present, as short bullet lines). Answer as JSON.",
      messages: [{ role: "user", content: `Business: ${data.business_name ?? ""}\nWebsite: ${page.url}\nTitle: ${page.title}\n\n${page.text.slice(0, 15000)}` }],
      json: {
        name: "chatbot_setup",
        schema: { type: "object", additionalProperties: false, required: ["personality", "goal", "additional_info"], properties: { personality: { type: "string" }, goal: { type: "string" }, additional_info: { type: "string" } } },
      },
    });
    const j = JSON.parse(raw) as { personality: string; goal: string; additional_info: string };
    return j;
  });

export const checkEmbeddable = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ url: z.string().max(2000) }).parse(d))
  .handler(async ({ data }) => {
    try {
      const u = new URL(data.url.startsWith("http") ? data.url : `https://${data.url}`);
      const res = await fetch(u.toString(), { method: "GET", redirect: "follow", headers: { "User-Agent": "Mozilla/5.0" } });
      const xfo = res.headers.get("x-frame-options");
      const csp = res.headers.get("content-security-policy") ?? "";
      const fa = csp.match(/frame-ancestors([^;]*)/i)?.[1]?.trim() ?? "";
      const blocked = !!xfo || (fa !== "" && fa !== "*");
      return { embeddable: res.ok && !blocked && u.protocol === "https:", url: u.toString() };
    } catch {
      return { embeddable: false, url: data.url };
    }
  });
