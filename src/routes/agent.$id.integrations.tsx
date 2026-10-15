import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, Webhook as WebhookIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { agentQuery } from "@/lib/agents";
import { uid, type Webhook } from "@/lib/crm";
import { useAutomations } from "@/components/agent/useAutomations";

export const Route = createFileRoute("/agent/$id/integrations")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(agentQuery(params.id)),
  component: Integrations,
});

const FIELDS = ["Name", "Phone", "Email", "Address", "Appointment time", "Order details", "Summary", "Transcript"];
const TIMING: Record<Webhook["timing"], string> = { during: "During a call", after: "After a call", both: "During and after" };

function Integrations() {
  const { id } = Route.useParams();
  const { auto, save } = useAutomations(id);
  const [open, setOpen] = useState(false);
  const [w, setW] = useState<Omit<Webhook, "id">>({ name: "", url: "", timing: "after", fields: ["Name", "Phone", "Email"] });

  const add = async () => {
    try {
      const u = new URL(w.url.trim());
      if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error();
    } catch { return void toast.error("Enter a valid webhook URL"); }
    if (!w.fields.length) return void toast.error("Pick at least one detail to send");
    await save({ webhooks: [...auto.webhooks, { id: uid(), ...w, name: w.name.trim() || "Webhook", url: w.url.trim() }] }, "Connection added");
    setOpen(false);
    setW({ name: "", url: "", timing: "after", fields: ["Name", "Phone", "Email"] });
  };

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex-1"><h2 className="text-lg font-semibold">Connections</h2><p className="text-sm text-muted-foreground">Send caller details to other tools with a webhook.</p></div>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add connection</Button>
      </div>
      {auto.webhooks.length === 0 && <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">No connections yet</div>}
      {auto.webhooks.map((h) => (
        <div key={h.id} className="flex gap-3 rounded-xl border bg-card p-4">
          <WebhookIcon className="mt-0.5 h-5 w-5 text-muted-foreground" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center gap-2"><span className="font-medium">{h.name}</span><Badge variant="secondary">{TIMING[h.timing]}</Badge></div>
            <div className="truncate font-mono text-xs text-muted-foreground">{h.url}</div>
            <div className="flex flex-wrap gap-1">{h.fields.map((f) => <Badge key={f} variant="outline">{f}</Badge>)}</div>
          </div>
          <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => save({ webhooks: auto.webhooks.filter((x) => x.id !== h.id) }, "Removed")}><Trash2 className="h-4 w-4" /></Button>
        </div>
      ))}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add connection</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-1.5"><Label>Name</Label><Input value={w.name} maxLength={100} onChange={(e) => setW({ ...w, name: e.target.value })} placeholder="My CRM" /></div>
            <div className="space-y-1.5"><Label>Webhook URL</Label><Input value={w.url} maxLength={2000} onChange={(e) => setW({ ...w, url: e.target.value })} placeholder="https://example.com/webhook" /></div>
            <div className="space-y-2"><Label>When should it fire?</Label>
              <RadioGroup value={w.timing} onValueChange={(v) => setW({ ...w, timing: v as Webhook["timing"] })}>
                {(Object.keys(TIMING) as Webhook["timing"][]).map((k) => (
                  <label key={k} className="flex items-center gap-2 text-sm"><RadioGroupItem value={k} /> {TIMING[k]}</label>
                ))}
              </RadioGroup>
            </div>
            <div className="space-y-2"><Label>Caller details to send</Label>
              <div className="grid grid-cols-2 gap-2">
                {FIELDS.map((f) => (
                  <label key={f} className="flex items-center gap-2 text-sm">
                    <Checkbox checked={w.fields.includes(f)} onCheckedChange={(c) => setW({ ...w, fields: c ? [...w.fields, f] : w.fields.filter((x) => x !== f) })} /> {f}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter><Button onClick={add}>Add connection</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
