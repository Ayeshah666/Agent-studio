import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { json, preflight, originAllowed, loadAgent } from "@/lib/widget.server";

const schema = z.object({
  name: z.string().trim().max(200).optional(),
  email: z.string().trim().max(255).email().optional().or(z.literal("")),
  phone: z.string().trim().max(50).optional(),
});

export const Route = createFileRoute("/api/public/widget/$agentId/lead")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      POST: async ({ request, params }) => {
        const agent = await loadAgent(params.agentId);
        if (!agent) return json({ error: "Chatbot not found" }, 404);
        if (!originAllowed(request, agent.allowed_domain)) return json({ error: "Not allowed" }, 403);
        const parsed = schema.safeParse(await request.json().catch(() => ({})));
        if (!parsed.success) return json({ error: "Please check your details" }, 400);
        const d = parsed.data;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: contact, error } = await supabaseAdmin.from("contacts")
          .insert({ agent_id: agent.id, name: d.name || null, email: d.email || null, phone: d.phone || null, data: { source: "chatbot" } })
          .select("id").single();
        if (error) return json({ error: "Could not save your details" }, 500);
        const { data: lead, error: le } = await supabaseAdmin.from("leads")
          .insert({ agent_id: agent.id, contact_id: contact.id, data: { ...d, source: "chatbot" } })
          .select("id").single();
        if (le) return json({ error: "Could not save your details" }, 500);
        return json({ contactId: contact.id, leadId: lead.id });
      },
    },
  },
});
