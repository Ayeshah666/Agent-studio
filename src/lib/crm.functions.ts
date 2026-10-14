import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

type Extract = { summary: string; outcome: string; name: string | null; phone: string | null; email: string | null; order: string | null; appointment_time: string | null };

export const summarizeRecord = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ kind: z.enum(["call", "conversation"]), id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { completeText } = await import("./ai.server");
    const table = data.kind === "call" ? "calls" : "conversations";
    let raw0: unknown = null;
    if (data.kind === "call") {
      const { data: r } = await supabaseAdmin.from("calls").select("transcript").eq("id", data.id).maybeSingle();
      if (!r) throw new Error("Record not found");
      raw0 = r.transcript;
    } else {
      const { data: r } = await supabaseAdmin.from("conversations").select("messages").eq("id", data.id).maybeSingle();
      if (!r) throw new Error("Record not found");
      raw0 = r.messages;
    }
    const list = (raw0 ?? []) as { role: string; content: string }[];
    if (!Array.isArray(list) || list.length === 0) throw new Error("There is no transcript to summarize yet");
    const text = list.map((m) => `${m.role === "user" ? "Customer" : "Agent"}: ${m.content}`).join("\n").slice(0, 20000);
    const nullableStr = { type: ["string", "null"] };
    const raw = await completeText({
      model: "openai/gpt-6-astra",
      system: "You review customer conversations for a business. Write a 2-3 sentence summary, a short outcome label (e.g. 'Appointment booked', 'Order placed', 'Question answered', 'No resolution'), and extract details the customer gave. Use null when a detail was not mentioned. Answer as JSON.",
      messages: [{ role: "user", content: text }],
      json: {
        name: "conversation_summary",
        schema: {
          type: "object", additionalProperties: false,
          required: ["summary", "outcome", "name", "phone", "email", "order", "appointment_time"],
          properties: { summary: { type: "string" }, outcome: { type: "string" }, name: nullableStr, phone: nullableStr, email: nullableStr, order: nullableStr, appointment_time: nullableStr },
        },
      },
    });
    const j = JSON.parse(raw) as Extract;
    const { summary, outcome, ...extracted } = j;
    if (table === "calls") await supabaseAdmin.from("calls").update({ summary, outcome, extracted }).eq("id", data.id);
    else await supabaseAdmin.from("conversations").update({ summary, outcome, extracted }).eq("id", data.id);
    return j;
  });
