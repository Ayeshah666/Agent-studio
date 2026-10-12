import { createFileRoute } from "@tanstack/react-router";
import { widgetScript } from "@/lib/widget-script";

export const Route = createFileRoute("/api/public/widget/script")({
  server: {
    handlers: {
      GET: async () =>
        new Response(widgetScript(), {
          headers: { "Content-Type": "application/javascript; charset=utf-8", "Cache-Control": "public, max-age=300", "Access-Control-Allow-Origin": "*" },
        }),
    },
  },
});
