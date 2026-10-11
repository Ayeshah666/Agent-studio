import { createFileRoute } from "@tanstack/react-router";
import { Phone } from "lucide-react";

export const Route = createFileRoute("/phone-numbers")({
  head: () => ({
    meta: [
      { title: "Phone Numbers — AgentStudio" },
      { name: "description", content: "Manage the phone numbers your voice agents answer." },
      { property: "og:title", content: "Phone Numbers — AgentStudio" },
      { property: "og:description", content: "Manage the phone numbers your voice agents answer." },
    ],
  }),
  component: () => (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Phone Numbers</h1>
      <div className="mt-8 grid place-items-center rounded-2xl border border-dashed p-16 text-center text-muted-foreground">
        <Phone className="mb-3 h-6 w-6" />
        Phone numbers will appear here once a calling provider is connected.
      </div>
    </div>
  ),
});
