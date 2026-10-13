import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Wand2, Loader2, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { agentQuery, updateAgent } from "@/lib/agents";
import { autofillChatbot, checkEmbeddable } from "@/lib/kb.functions";
import { LLM_MODELS } from "@/lib/agent-options";
import { AVATARS, ICON_SVGS, THEMES, resolveChatbot, type ChatbotConfig, type WidgetIcon } from "@/lib/chatbot-config";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/agent/$id/chatbot-builder")({ component: Builder });

function Seg<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex rounded-lg border p-1">
      {options.map((o) => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)} className={cn("flex-1 rounded-md px-3 py-1.5 text-sm transition", value === o.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>{o.label}</button>
      ))}
    </div>
  );
}

const F = ({ label, children }: { label: string; children: React.ReactNode }) => <div className="space-y-2"><Label>{label}</Label>{children}</div>;

function Builder() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { data: agent } = useSuspenseQuery(agentQuery(id));
  const [c, setC] = useState<ChatbotConfig>(() => resolveChatbot(agent?.chatbot, agent ?? undefined));
  const [model, setModel] = useState(agent?.llm_model ?? "google/gemini-3-flash-preview");
  const [saving, setSaving] = useState(false);
  const [filling, setFilling] = useState(false);
  const [embed, setEmbed] = useState(false);
  const autofill = useServerFn(autofillChatbot);
  const check = useServerFn(checkEmbeddable);
  const frame = useRef<HTMLIFrameElement>(null);
  const set = (p: Partial<ChatbotConfig>) => setC((x) => ({ ...x, ...p }));

  const site = c.website ? (c.website.startsWith("http") ? c.website : `https://${c.website}`) : "";
  useEffect(() => {
    if (!site) { setEmbed(false); return undefined; }
    const t = setTimeout(() => check({ data: { url: site } }).then((r) => setEmbed(r.embeddable)).catch(() => setEmbed(false)), 600);
    return () => clearTimeout(t);
  }, [site]); // eslint-disable-line react-hooks/exhaustive-deps

  const post = (extra: Record<string, unknown> = {}) => frame.current?.contentWindow?.postMessage({ type: "agentstudio:config", config: c, ...extra }, window.location.origin);
  useEffect(() => { post(); }, [c]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const h = (e: MessageEvent) => { if (e.data?.type === "agentstudio:ready") post({ open: true }); };
    window.addEventListener("message", h); return () => window.removeEventListener("message", h);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  if (!agent) return null;

  const save = async () => {
    setSaving(true);
    try { const u = await updateAgent(id, { chatbot: c, llm_model: model }); qc.setQueryData(agentQuery(id).queryKey, u); toast.success("Chatbot saved"); }
    catch (e) { toast.error((e as Error).message); }
    setSaving(false);
  };

  const doFill = async () => {
    if (!c.website) { toast.error("Add the business website first"); return; }
    setFilling(true);
    try { const r = await autofill({ data: { website: c.website, business_name: c.business_name } }); set(r); toast.success("Filled from your website — check Bot Goals"); }
    catch (e) { toast.error((e as Error).message); }
    setFilling(false);
  };

  const onAvatar = (file?: File) => {
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      const cv = document.createElement("canvas"); cv.width = cv.height = 128;
      const s = Math.min(img.width, img.height);
      cv.getContext("2d")!.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 128, 128);
      set({ avatar: "upload", avatar_url: cv.toDataURL("image/jpeg", 0.85) });
    };
    img.src = URL.createObjectURL(file);
  };

  const qr = [...c.quick_replies, "", "", ""].slice(0, 3);

  return (
    <div className="grid gap-6 xl:grid-cols-[440px_1fr]">
      <div className="space-y-4">
        <Tabs defaultValue="setup">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="setup">Bot Setup</TabsTrigger><TabsTrigger value="goals">Bot Goals</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger><TabsTrigger value="look">Appearance</TabsTrigger>
          </TabsList>

          <TabsContent value="setup" className="space-y-5 pt-4">
            <F label="Bot name"><Input value={c.bot_name} onChange={(e) => set({ bot_name: e.target.value })} /></F>
            <F label="Business name"><Input value={c.business_name} onChange={(e) => set({ business_name: e.target.value })} /></F>
            <F label="Business website"><Input value={c.website} onChange={(e) => set({ website: e.target.value })} placeholder="https://example.com" /></F>
            <F label={`Wait time before responding: ${c.wait_seconds}s`}><Slider min={0} max={5} step={0.5} value={[c.wait_seconds]} onValueChange={([v]) => set({ wait_seconds: v ?? 0 })} /></F>
            <F label="Response style"><Seg value={c.response_style} onChange={(v) => set({ response_style: v })} options={[{ value: "concise", label: "Concise" }, { value: "balanced", label: "Balanced" }, { value: "detailed", label: "Detailed" }]} /></F>
            <Button variant="outline" className="w-full" onClick={doFill} disabled={filling}>{filling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} Auto-Fill with AI</Button>
          </TabsContent>

          <TabsContent value="goals" className="space-y-5 pt-4">
            <F label="LLM model">
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{LLM_MODELS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
              </Select>
            </F>
            <F label="Personality"><Textarea className="min-h-24" value={c.personality} onChange={(e) => set({ personality: e.target.value })} placeholder="Friendly, warm and professional…" /></F>
            <F label="Goal"><Textarea className="min-h-24" value={c.goal} onChange={(e) => set({ goal: e.target.value })} /></F>
            <F label="Additional information"><Textarea className="min-h-32" value={c.additional_info} onChange={(e) => set({ additional_info: e.target.value })} placeholder="Opening hours, address, policies…" /></F>
          </TabsContent>

          <TabsContent value="chat" className="space-y-5 pt-4">
            <F label="First message"><Textarea value={c.first_message} onChange={(e) => set({ first_message: e.target.value })} /></F>
            <F label="Input placeholder"><Input value={c.placeholder} onChange={(e) => set({ placeholder: e.target.value })} /></F>
            <F label="Status text"><Input value={c.status_text} onChange={(e) => set({ status_text: e.target.value })} /></F>
            <F label="Widget position"><Seg value={c.position} onChange={(v) => set({ position: v })} options={[{ value: "bottom-right", label: "Bottom right" }, { value: "bottom-left", label: "Bottom left" }]} /></F>
            <F label="Quick-reply buttons (up to 3)">
              <div className="space-y-2">{qr.map((q, i) => <Input key={i} value={q} placeholder={`Quick reply ${i + 1}`} onChange={(e) => { const n = [...qr]; n[i] = e.target.value; set({ quick_replies: n }); }} />)}</div>
            </F>
            <div className="rounded-xl border p-4">
              <div className="flex items-center justify-between"><Label>Lead Capture Form</Label><Switch checked={c.lead_form.enabled} onCheckedChange={(v) => set({ lead_form: { ...c.lead_form, enabled: v } })} /></div>
              {c.lead_form.enabled && (
                <div className="mt-3 flex gap-5">
                  {(["name", "email", "phone"] as const).map((k) => (
                    <label key={k} className="flex items-center gap-2 text-sm capitalize">
                      <Checkbox checked={c.lead_form.fields[k]} onCheckedChange={(v) => set({ lead_form: { ...c.lead_form, fields: { ...c.lead_form.fields, [k]: !!v } } })} />{k}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="look" className="space-y-5 pt-4">
            <F label="Color theme">
              <div className="grid grid-cols-5 gap-2">
                {THEMES.map((t) => (
                  <button key={t.id} type="button" onClick={() => set({ theme: t.id, colors: t.id === "custom" ? c.colors : t.colors })} className={cn("rounded-lg border p-1.5 text-[11px]", c.theme === t.id && "ring-2 ring-primary")}>
                    <div className="flex h-7 overflow-hidden rounded" style={{ background: t.colors.background }}><span className="w-1/2" style={{ background: t.colors.accent }} /><span className="m-1.5 flex-1 rounded-sm" style={{ background: t.colors.bubble }} /></div>
                    <span className="mt-1 block truncate">{t.label}</span>
                  </button>
                ))}
              </div>
            </F>
            <div className="grid grid-cols-3 gap-3">
              {(["accent", "background", "bubble"] as const).map((k) => (
                <F key={k} label={k === "bubble" ? "Bot bubble" : k.charAt(0).toUpperCase() + k.slice(1)}>
                  <input type="color" value={c.colors[k]} onChange={(e) => set({ theme: "custom", colors: { ...c.colors, [k]: e.target.value } })} className="h-9 w-full cursor-pointer rounded-md border bg-transparent" />
                </F>
              ))}
            </div>
            <F label="Widget size"><Seg value={c.size} onChange={(v) => set({ size: v })} options={[{ value: "compact", label: "Compact" }, { value: "normal", label: "Normal" }, { value: "large", label: "Large" }]} /></F>
            <F label="Icon">
              <div className="flex gap-2">
                {(Object.keys(ICON_SVGS) as WidgetIcon[]).map((k) => (
                  <button key={k} type="button" onClick={() => set({ icon: k })} aria-label={k} className={cn("grid h-11 w-11 place-items-center rounded-full border", c.icon === k && "ring-2 ring-primary")} style={{ background: c.colors.accent, color: "#fff" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: ICON_SVGS[k] }} />
                  </button>
                ))}
              </div>
            </F>
            <F label="Avatar">
              <div className="flex items-center gap-3">
                {(["female", "male"] as const).map((k) => (
                  <button key={k} type="button" onClick={() => set({ avatar: k })} className={cn("rounded-full", c.avatar === k && "ring-2 ring-primary ring-offset-2")}><img src={AVATARS[k]} alt={k} className="h-11 w-11 rounded-full" /></button>
                ))}
                <label className={cn("grid h-11 cursor-pointer place-items-center overflow-hidden rounded-full border px-3 text-xs", c.avatar === "upload" && "ring-2 ring-primary ring-offset-2")}>
                  {c.avatar_url ? <img src={c.avatar_url} alt="Uploaded" className="h-11 w-11 object-cover" /> : "Upload"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => onAvatar(e.target.files?.[0])} />
                </label>
              </div>
            </F>
          </TabsContent>
        </Tabs>
        <Button className="w-full" onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save</Button>
      </div>

      <div className="flex flex-col overflow-hidden rounded-2xl border bg-card shadow-soft">
        <div className="flex items-center gap-2 border-b px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" /><span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" /><span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
          <span className="ml-3 truncate text-xs text-muted-foreground">{site || "Preview"}{site && !embed && " · this site can't be embedded, showing a sample page"}</span>
          <Button size="sm" variant="ghost" className="ml-auto" onClick={() => post({ reset: true, open: true })}><RotateCcw className="h-3.5 w-3.5" /> Restart chat</Button>
        </div>
        <iframe ref={frame} key={`${embed}-${site}`} title="Chatbot preview" src={`/widget-preview/${id}?site=${encodeURIComponent(site)}&embed=${embed ? 1 : 0}`} className="h-[720px] w-full border-0" />
      </div>
    </div>
  );
}
