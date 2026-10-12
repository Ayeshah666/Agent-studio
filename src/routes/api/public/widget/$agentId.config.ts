import { createFileRoute } from "@tanstack/react-router";
import { json, preflight, originAllowed, loadAgent } from "@/lib/widget.server";
import { resolveChatbot } from "@/lib/chatbot-config";

export const Route = createFileRoute("/api/public/widget/$agentId/config")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async ({ request, params }) => {
        const agent = await loadAgent(params.agentId);
        if (!agent) return json({ error: "Chatbot not found" }, 404);
        if (!originAllowed(request, agent.allowed_domain)) return json({ error: "This website is not allowed to use this chatbot" }, 403);
        const c = resolveChatbot(agent.chatbot, agent);
        // Only expose display settings; never the prompt or private notes.
        const { personality: _p, goal: _g, additional_info: _a, ...publicConfig } = c;
        return json({ config: publicConfig });
      },
    },
  },
});
