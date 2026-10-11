import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const generateSystemPrompt = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      name: z.string().max(200),
      industry: z.string().max(200).nullable().optional(),
      business_name: z.string().max(200).nullable().optional(),
      website: z.string().max(500).nullable().optional(),
      goal: z.string().max(4000).nullable().optional(),
      agent_type: z.string().max(20),
      collect: z.array(z.string().max(200)).max(50),
      current: z.string().max(20000).optional(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI is not configured");
    const brief = [
      `Assistant name: ${data.name}`,
      `Type: ${data.agent_type === "chatbot" ? "website chatbot" : data.agent_type === "both" ? "phone call agent and website chatbot" : "phone call agent"}`,
      data.industry && `Industry: ${data.industry}`,
      data.business_name && `Business: ${data.business_name}`,
      data.website && `Website: ${data.website}`,
      data.goal && `Goal: ${data.goal}`,
      data.collect.length && `Information to collect: ${data.collect.join(", ")}`,
      data.current && `Existing prompt (improve on it):\n${data.current}`,
    ].filter(Boolean).join("\n");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "You write production system prompts for customer-facing AI assistants. Output only the prompt in plain text with short headed sections: Role, Goals, Style, Information to Collect, Rules. Keep it concise and actionable. Voice agents must use short spoken sentences.",
          },
          { role: "user", content: brief },
        ],
      }),
    });
    if (res.status === 429) throw new Error("Too many requests, try again in a moment.");
    if (res.status === 402) throw new Error("AI credits are used up. Add credits in workspace settings.");
    if (!res.ok) throw new Error("Could not generate the prompt.");
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return { prompt: json.choices?.[0]?.message?.content?.trim() ?? "" };
  });
