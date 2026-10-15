import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowUp, Phone, MessageSquare, Layers, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DashboardStats } from "@/components/DashboardStats";
import { supabase } from "@/integrations/supabase/client";
import { INDUSTRIES, INDUSTRY_GOALS, AGENT_TYPE_LABEL, DEFAULT_SETTINGS, type AgentType } from "@/lib/agent-options";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — AgentStudio" },
      { name: "description", content: "Start building an AI call agent or chatbot in a few steps." },
      { property: "og:title", content: "Dashboard — AgentStudio" },
      { property: "og:description", content: "Start building an AI call agent or chatbot in a few steps." },
    ],
  }),
  component: Home,
});

const SHORTCUTS: { type: AgentType; label: string; icon: typeof Phone }[] = [
  { type: "voice", label: "Build AI Call Agent", icon: Phone },
  { type: "chatbot", label: "Build AI Chatbot", icon: MessageSquare },
  { type: "both", label: "Build Call Agent + Chatbot", icon: Layers },
];

function Home() {
  const navigate = useNavigate();
  const [type, setType] = useState<AgentType | null>(null);
  const [industry, setIndustry] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [goal, setGoal] = useState("");
  const [idea, setIdea] = useState("");
  const [saving, setSaving] = useState(false);

  const pickIndustry = (i: string) => {
    setIndustry(i);
    setGoal(idea.trim() || INDUSTRY_GOALS[i] || "");
  };
  const reset = () => { setType(null); setIndustry(null); };

  const create = async () => {
    if (!type || !industry || !name.trim()) return undefined;
    setSaving(true);
    const { data, error } = await supabase
      .from("agents")
      .insert({
        name: name.trim(),
        agent_type: type,
        industry,
        website: website.trim() || null,
        goal: goal.trim(),
        status: "draft",
        first_message: `Hi, thanks for reaching out! This is ${name.trim()}. How can I help you today?`,
        settings: DEFAULT_SETTINGS,
        collect_fields: ["Name", "Email"],
      })
      .select("id")
      .single();
    setSaving(false);
    if (error) return void toast.error("Could not create agent", { description: error.message });
    navigate({ to: "/agent/$id", params: { id: data.id } });
    return undefined;
  };

  return (
    <>
    <div className="mx-auto flex min-h-[75vh] max-w-3xl flex-col items-center justify-center px-6 py-16">
      {!type && (
        <>
          <h1 className="text-center text-4xl font-semibold tracking-tight">What would you like to build today?</h1>
          <p className="mt-3 text-muted-foreground">Describe your assistant, or pick a starting point.</p>
          <form
            onSubmit={(e) => { e.preventDefault(); if (idea.trim()) setType("both"); }}
            className="mt-10 w-full rounded-2xl border bg-card p-3 shadow-soft"
          >
            <Textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="e.g. A receptionist for my dental clinic that books appointments…"
              className="min-h-24 resize-none border-0 bg-transparent text-base shadow-none focus-visible:ring-0"
            />
            <div className="flex justify-end">
              <Button type="submit" size="icon" className="rounded-full" disabled={!idea.trim()} aria-label="Continue">
                <ArrowUp className="h-4 w-4" />
              </Button>
            </div>
          </form>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {SHORTCUTS.map(({ type: t, label, icon: Icon }) => (
              <button key={t} className="chip" onClick={() => setType(t)}>
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>
        </>
      )}

      {type && !industry && (
        <div className="w-full">
          <BackLink onClick={reset} />
          <p className="text-sm text-muted-foreground">{AGENT_TYPE_LABEL[type]}</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">Choose an industry</h2>
          <div className="mt-8 flex flex-wrap gap-2">
            {INDUSTRIES.map((i) => (
              <button key={i} className="chip" onClick={() => pickIndustry(i)}>{i}</button>
            ))}
          </div>
        </div>
      )}

      {type && industry && (
        <div className="w-full">
          <BackLink onClick={() => setIndustry(null)} />
          <p className="text-sm text-muted-foreground">{AGENT_TYPE_LABEL[type]} · {industry}</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">Set up your agent</h2>
          <div className="mt-8 space-y-5 rounded-2xl border bg-card p-6 shadow-soft">
            <div className="space-y-2">
              <Label htmlFor="name">Agent Name *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Riley" autoFocus />
            </div>
            <div className="space-y-2">
              <Label htmlFor="web">Website <span className="text-muted-foreground">(optional)</span></Label>
              <Input id="web" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yourbusiness.com" />
              <p className="text-xs text-muted-foreground">Used later to build the knowledge base automatically.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal">What should this assistant do?</Label>
              <Textarea id="goal" value={goal} onChange={(e) => setGoal(e.target.value)} className="min-h-28" />
            </div>
            <Button className="w-full" size="lg" onClick={create} disabled={!name.trim() || saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Create Agent
            </Button>
          </div>
        </div>
      )}
    </div>
    {!type && <DashboardStats />}
    </>
  );
}

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="h-4 w-4" /> Back
    </button>
  );
}
