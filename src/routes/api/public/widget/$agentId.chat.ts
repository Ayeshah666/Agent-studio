import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { CORS, json, preflight, originAllowed, loadAgent } from "@/lib/widget.server";
import { resolveChatbot } from "@/lib/chatbot-config";

const schema = z.object({
  conversationId: z.string().uuid().optional().nullable(),
  contactId: z.string().uuid().optional().nullable(),
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(8000) })).min(1).max(60),
});

const STYLE = {
  concise: "Keep replies short: 1-3 sentences.",
  balanced: "Keep replies clear and moderately brief.",
  detailed: "Give thorough, well-structured replies when helpful.",
};

export const Route = createFileRoute("/api/public/widget/$agentId/chat")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      POST: async ({ request, params }) => {
        const agent = await loadAgent(params.agentId);
        if (!agent) return json({ error: "Chatbot not found" }, 404);
        if (!originAllowed(request, agent.allowed_domain)) return json({ error: "Not allowed" }, 403);
        const parsed = schema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return json({ error: "Invalid message" }, 400);
        const { messages } = parsed.data; let contactId = parsed.data.contactId;
        const last = messages[messages.length - 1]!;
        if (last.role !== "user") return json({ error: "Invalid message" }, 400);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { embed, streamChat, AiError } = await import("@/lib/ai.server");
        const c = resolveChatbot(agent.chatbot, agent);

        // Retrieval
        let context = "";
        try {
          const [vec] = await embed([last.content]);
          const { data: matches } = await supabaseAdmin.rpc("match_knowledge_chunks", { _agent_id: agent.id, _embedding: JSON.stringify(vec), _count: 5 });
          context = (matches ?? []).map((m: { content: string }, i: number) => `[${i + 1}] ${m.content}`).join("\n\n");
        } catch (e) { console.error("retrieval failed", e); }

        const system = [
          `You are ${c.bot_name}, the website chat assistant for ${c.business_name || "this business"}.`,
          agent.system_prompt && `Agent instructions:\n${agent.system_prompt}`,
          c.personality && `Personality: ${c.personality}`,
          c.goal && `Goal: ${c.goal}`,
          c.additional_info && `Additional information:\n${c.additional_info}`,
          `Knowledge base context:\n${context || "(no relevant knowledge found)"}`,
          "Answer only using the knowledge base context and the instructions above. If the answer is not there, say you don't know and offer to help another way. Never invent facts, prices or policies.",
          STYLE[c.response_style] ?? STYLE.balanced,
        ].filter(Boolean).join("\n\n");

        // Conversation record
        let conversationId = parsed.data.conversationId ?? null;
        if (conversationId) {
          const { data: ex } = await supabaseAdmin.from("conversations").select("id").eq("id", conversationId).eq("agent_id", agent.id).maybeSingle();
          if (!ex) conversationId = null;
        }
        if (!conversationId) {
          if (!contactId) {
            const { data: ct } = await supabaseAdmin.from("contacts").insert({ agent_id: agent.id, name: "Website visitor", data: { source: "chat" } }).select("id").single();
            if (ct) contactId = ct.id;
          }
          const { data: conv, error } = await supabaseAdmin.from("conversations")
            .insert({ agent_id: agent.id, contact_id: contactId ?? null, channel: "chat", messages: [] }).select("id").single();
          if (error) return json({ error: "Could not start the conversation" }, 500);
          conversationId = conv.id;
          await supabaseAdmin.from("agents").update({ chat_count: (agent.chat_count ?? 0) + 1 }).eq("id", agent.id);
        }

        let gen: AsyncGenerator<string>;
        try {
          gen = await streamChat({ model: agent.llm_model || "google/gemini-3-flash-preview", system, messages, signal: request.signal });
        } catch (e) {
          const status = e instanceof AiError ? e.status : 500;
          return json({ error: status === 429 ? "The assistant is busy, please try again shortly." : "The assistant is unavailable right now." }, status);
        }

        const enc = new TextEncoder();
        const convId = conversationId;
        const stream = new ReadableStream({
          async start(ctrl) {
            let reply = "";
            try {
              for await (const d of gen) { reply += d; ctrl.enqueue(enc.encode(d)); }
            } catch (e) {
              console.error("chat stream error", e);
              if (!reply) { reply = "Sorry, something went wrong. Please try again."; ctrl.enqueue(enc.encode(reply)); }
            }
            const now = new Date().toISOString();
            const transcript = [...messages, { role: "assistant", content: reply }].map((m) => ({ ...m, at: now }));
            const { data: cur } = await supabaseAdmin.from("conversations").select("unread_count, messages").eq("id", convId).maybeSingle();
            // keep any manual replies the owner sent from the inbox
            const prev = (Array.isArray(cur?.messages) ? cur.messages : []) as { role: string; content: string; at?: string }[];
            const manual = prev.filter((m) => m.role === "agent");
            const { error } = await supabaseAdmin.from("conversations")
              .update({ messages: [...transcript, ...manual.filter((m) => !transcript.some((t) => t.content === m.content))], unread_count: (cur?.unread_count ?? 0) + 1, updated_at: now, ...(contactId ? { contact_id: contactId } : {}) }).eq("id", convId);
            if (error) console.error("save conversation failed", error);
            ctrl.close();
          },
        });
        return new Response(stream, { headers: { ...CORS, "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache, no-transform", "X-Conversation-Id": convId } });
      },
    },
  },
});
