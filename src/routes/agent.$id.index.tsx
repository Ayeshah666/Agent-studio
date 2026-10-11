import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Loader2, Clock, ListChecks, Play, Search, Mic, Check, Plus, X, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { agentQuery, updateAgent } from "@/lib/agents";
import { generateSystemPrompt } from "@/lib/ai.functions";
import { COLLECT_OPTIONS, LANGUAGES, LLM_MODELS, TIMEZONES, VOICES } from "@/lib/agent-options";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/agent/$id/")({
  component: AgentTab,
});

function AgentTab() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { data: agent } = useSuspenseQuery(agentQuery(id));
  const gen = useServerFn(generateSystemPrompt);

  const [firstMessage, setFirstMessage] = useState(agent?.first_message ?? "");
  const [prompt, setPrompt] = useState(agent?.system_prompt ?? "");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tzOpen, setTzOpen] = useState(false);
  const [collectOpen, setCollectOpen] = useState(false);
  const [voiceQ, setVoiceQ] = useState("");
  const [playing, setPlaying] = useState<string | null>(null);

  useEffect(() => { setFirstMessage(agent?.first_message ?? ""); setPrompt(agent?.system_prompt ?? ""); }, [agent?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!agent) return null;

  const collect = (agent.collect_fields as string[]) ?? [];
  const dirty = firstMessage !== (agent.first_message ?? "") || prompt !== (agent.system_prompt ?? "");

  const patch = async (p: Parameters<typeof updateAgent>[1], msg?: string) => {
    try {
      const u = await updateAgent(id, p);
      qc.setQueryData(agentQuery(id).queryKey, u);
      if (msg) toast.success(msg);
    } catch (e) { toast.error("Save failed", { description: (e as Error).message }); }
  };

  const generate = async () => {
    setGenerating(true);
    try {
      const r = await gen({ data: {
        name: agent.name, industry: agent.industry, business_name: agent.business_name, website: agent.website,
        goal: agent.goal, agent_type: agent.agent_type, collect, current: prompt || undefined,
      } });
      setPrompt(r.prompt);
      toast.success("Prompt generated — remember to save");
    } catch (e) { toast.error((e as Error).message); }
    setGenerating(false);
  };

  const tzLabel = TIMEZONES.find((t) => t.value === agent.timezone)?.label ?? agent.timezone;
  const voices = VOICES.filter((v) => `${v.name} ${v.description}`.toLowerCase().includes(voiceQ.toLowerCase()));

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <Section title="First Message">
          <Textarea value={firstMessage} onChange={(e) => setFirstMessage(e.target.value)} className="min-h-20" />
        </Section>
        <Section
          title="System Prompt"
          action={<Button size="sm" variant="outline" onClick={generate} disabled={generating}>
            {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} Generate with AI
          </Button>}
        >
          <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} className="min-h-80 font-mono text-[13px] leading-relaxed" placeholder="Describe how your agent should behave…" />
        </Section>
        <div className="flex justify-end">
          <Button disabled={!dirty || saving} onClick={async () => { setSaving(true); await patch({ first_message: firstMessage, system_prompt: prompt }, "Saved"); setSaving(false); }}>
            <Save className="h-4 w-4" /> Save changes
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Language</Label>
            <Select value={agent.language ?? "en-US"} onValueChange={(v) => patch({ language: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{LANGUAGES.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>LLM Model</Label>
            <Select value={agent.llm_model ?? LLM_MODELS[0].value} onValueChange={(v) => patch({ llm_model: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{LLM_MODELS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <RowButton icon={Clock} label="Timezone" value={tzLabel} onClick={() => setTzOpen(true)} />
          <RowButton icon={ListChecks} label="What to collect during the call" value={collect.length ? collect.join(", ") : "Nothing selected"} onClick={() => setCollectOpen(true)} />
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border bg-card p-6 text-center shadow-soft">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-secondary"><Mic className="h-6 w-6" /></div>
          <h3 className="mt-4 font-semibold">Talk to Your Agent</h3>
          <p className="mt-1 text-sm text-muted-foreground">Live testing will be available soon.</p>
          <Button className="mt-4 w-full" disabled>Start test call</Button>
        </div>
        <div className="rounded-2xl border bg-card p-4 shadow-soft">
          <h3 className="px-1 font-semibold">Voice</h3>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={voiceQ} onChange={(e) => setVoiceQ(e.target.value)} placeholder="Search voices" className="pl-9" />
          </div>
          <div className="mt-3 max-h-96 space-y-2 overflow-y-auto">
            {voices.map((v) => {
              const sel = agent.voice_id === v.id;
              return (
                <div key={v.id} className={cn("flex items-center gap-3 rounded-xl border p-3 transition", sel ? "border-primary" : "hover:bg-accent")}>
                  <button
                    onClick={() => { setPlaying(v.id); toast(`Voice preview for ${v.name} coming soon`); setTimeout(() => setPlaying(null), 1200); }}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary"
                    aria-label={`Preview ${v.name}`}
                  >
                    {playing === v.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                  </button>
                  <button className="min-w-0 flex-1 text-left" onClick={() => patch({ voice_id: v.id }, `Voice set to ${v.name}`)}>
                    <p className="text-sm font-medium">{v.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{v.description}</p>
                  </button>
                  {sel && <Check className="h-4 w-4" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <TimezoneDialog open={tzOpen} onOpenChange={setTzOpen} value={agent.timezone ?? "UTC"} onPick={(tz) => { patch({ timezone: tz }); setTzOpen(false); }} />
      <CollectDialog open={collectOpen} onOpenChange={setCollectOpen} value={collect} onSave={(f) => { patch({ collect_fields: f }, "Fields saved"); setCollectOpen(false); }} />
    </div>
  );
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between"><Label className="text-sm font-medium">{title}</Label>{action}</div>
      {children}
    </div>
  );
}

function RowButton({ icon: Icon, label, value, onClick }: { icon: typeof Clock; label: string; value: string; onClick: () => void }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <button onClick={onClick} className="flex h-9 w-full items-center gap-2 rounded-md border border-input bg-transparent px-3 text-left text-sm hover:bg-accent">
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" /><span className="truncate">{value}</span>
      </button>
    </div>
  );
}

function TimezoneDialog({ open, onOpenChange, value, onPick }: { open: boolean; onOpenChange: (o: boolean) => void; value: string; onPick: (v: string) => void }) {
  const [q, setQ] = useState("");
  const list = TIMEZONES.filter((t) => `${t.label} ${t.value}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Select timezone</DialogTitle></DialogHeader>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search timezones" autoFocus />
        <div className="max-h-80 space-y-1 overflow-y-auto">
          {list.map((t) => (
            <button key={t.value} onClick={() => onPick(t.value)} className={cn("flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-accent", value === t.value && "bg-accent font-medium")}>
              <span>{t.label}<span className="ml-2 text-xs text-muted-foreground">{t.value}</span></span>
              {value === t.value && <Check className="h-4 w-4" />}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CollectDialog({ open, onOpenChange, value, onSave }: { open: boolean; onOpenChange: (o: boolean) => void; value: string[]; onSave: (v: string[]) => void }) {
  const [sel, setSel] = useState<string[]>(value);
  const [custom, setCustom] = useState("");
  useEffect(() => { if (open) setSel(value); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const all = [...COLLECT_OPTIONS, ...sel.filter((s) => !COLLECT_OPTIONS.includes(s))];
  const toggle = (f: string) => setSel(sel.includes(f) ? sel.filter((x) => x !== f) : [...sel, f]);
  const add = () => { const c = custom.trim(); if (c && !sel.includes(c)) setSel([...sel, c]); setCustom(""); };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>What to collect during the call</DialogTitle></DialogHeader>
        <div className="space-y-1">
          {all.map((f) => (
            <label key={f} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-accent">
              <Checkbox checked={sel.includes(f)} onCheckedChange={() => toggle(f)} />
              <span className="flex-1">{f}</span>
              {!COLLECT_OPTIONS.includes(f) && (
                <button type="button" onClick={(e) => { e.preventDefault(); setSel(sel.filter((x) => x !== f)); }} aria-label={`Remove ${f}`}><X className="h-3.5 w-3.5 text-muted-foreground" /></button>
              )}
            </label>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); add(); }} className="flex gap-2">
          <Input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Add a custom field" />
          <Button type="submit" variant="outline" size="icon" aria-label="Add field"><Plus className="h-4 w-4" /></Button>
        </form>
        <DialogFooter><Button onClick={() => onSave(sel)}>Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
