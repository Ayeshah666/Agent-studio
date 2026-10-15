import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MessageSquareText, PhoneForwarded, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { agentQuery } from "@/lib/agents";
import { uid, type SmsAction, type TransferAction } from "@/lib/crm";
import { useAutomations } from "@/components/agent/useAutomations";

export const Route = createFileRoute("/agent/$id/sms-transfer")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(agentQuery(params.id)),
  component: SmsTransfer,
});

const SMS_TEMPLATES: Omit<SmsAction, "id">[] = [
  { name: "Delivery Ordering Link", message: "Hi {Name}! Order delivery from us here: {Link}", condition: "When the caller wants to order food for delivery", say: "I'm texting you our ordering link now." },
  { name: "Booking Link", message: "Hi {Name}, book your appointment anytime: {Link}", condition: "When the caller wants to book but prefers to do it online", say: "I'll send you a link so you can pick a time." },
  { name: "Directions", message: "Here's how to find us: {Link}", condition: "When the caller asks for the address or directions", say: "Let me text you our location." },
];

const blankT = { name: "", phone: "", condition: "", say: "" };
const blankS = { name: "", message: "", condition: "", say: "" };

function SmsTransfer() {
  const { id } = Route.useParams();
  const { auto, save } = useAutomations(id);
  const [tOpen, setTOpen] = useState(false);
  const [sOpen, setSOpen] = useState(false);
  const [t, setT] = useState<Omit<TransferAction, "id">>(blankT);
  const [s, setS] = useState<Omit<SmsAction, "id">>(blankS);
  const [owner, setOwner] = useState(auto.owner_phone);

  const addT = async () => {
    if (!t.name.trim() || !t.phone.trim()) return void toast.error("Name and phone number are required");
    await save({ transfers: [...auto.transfers, { id: uid(), ...t }] }, "Transfer action added");
    setTOpen(false); setT(blankT);
  };
  const addS = async () => {
    if (!s.name.trim() || !s.message.trim()) return void toast.error("Name and message are required");
    await save({ sms: [...auto.sms, { id: uid(), ...s }] }, "SMS action added");
    setSOpen(false); setS(blankS);
  };

  return (
    <div className="max-w-3xl space-y-10">
      <Section icon={PhoneForwarded} title="Call Transfer Actions" desc="Hand the call to a person when a condition is met." onAdd={() => setTOpen(true)}>
        {auto.transfers.length === 0 && <Empty>No transfer actions yet</Empty>}
        {auto.transfers.map((a) => (
          <Item key={a.id} title={a.name} sub={a.phone} onDelete={() => save({ transfers: auto.transfers.filter((x) => x.id !== a.id) }, "Removed")}>
            {a.condition && <p><span className="text-muted-foreground">When: </span>{a.condition}</p>}
            {a.say && <p><span className="text-muted-foreground">Says: </span>“{a.say}”</p>}
          </Item>
        ))}
      </Section>

      <Section icon={MessageSquareText} title="SMS Actions" desc="Text the caller a message during the call." onAdd={() => setSOpen(true)}>
        {auto.sms.length === 0 && <Empty>No SMS actions yet</Empty>}
        {auto.sms.map((a) => (
          <Item key={a.id} title={a.name} sub={a.message} onDelete={() => save({ sms: auto.sms.filter((x) => x.id !== a.id) }, "Removed")}>
            {a.condition && <p><span className="text-muted-foreground">When: </span>{a.condition}</p>}
            {a.say && <p><span className="text-muted-foreground">Says: </span>“{a.say}”</p>}
          </Item>
        ))}
      </Section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Send Confirmations</h2>
        <div className="divide-y rounded-xl border bg-card">
          <Toggle label="SMS confirmation to the caller" desc="Send the caller a recap after the call." checked={auto.confirm_caller} onChange={(v) => save({ confirm_caller: v })} />
          <Toggle label="SMS confirmation to the business owner" desc="Get a text with the caller's details after each call." checked={auto.confirm_owner} onChange={(v) => save({ confirm_owner: v })} />
          {auto.confirm_owner && (
            <div className="flex items-end gap-2 p-4">
              <div className="flex-1 space-y-1.5"><Label>Owner phone number</Label><Input value={owner} maxLength={30} onChange={(e) => setOwner(e.target.value)} placeholder="+1 555 123 4567" /></div>
              <Button variant="outline" onClick={() => save({ owner_phone: owner.trim() }, "Saved")}>Save</Button>
            </div>
          )}
        </div>
      </section>

      <Dialog open={tOpen} onOpenChange={setTOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add transfer action</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <Field label="Name"><Input value={t.name} maxLength={100} onChange={(e) => setT({ ...t, name: e.target.value })} placeholder="Transfer to manager" /></Field>
            <Field label="Phone number to transfer to"><Input value={t.phone} maxLength={30} onChange={(e) => setT({ ...t, phone: e.target.value })} placeholder="+1 555 123 4567" /></Field>
            <Field label="When to transfer"><Textarea value={t.condition} maxLength={500} onChange={(e) => setT({ ...t, condition: e.target.value })} placeholder="When the caller asks to speak with a person" /></Field>
            <Field label="What to say before transferring"><Textarea value={t.say} maxLength={500} onChange={(e) => setT({ ...t, say: e.target.value })} placeholder="Sure, let me connect you now." /></Field>
          </div>
          <DialogFooter><Button onClick={addT}>Add action</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={sOpen} onOpenChange={setSOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add SMS action</DialogTitle></DialogHeader>
          <div className="flex flex-wrap gap-2">
            {SMS_TEMPLATES.map((tp) => <button key={tp.name} className="chip text-xs" onClick={() => setS(tp)}>{tp.name}</button>)}
          </div>
          <div className="grid gap-3">
            <Field label="Name"><Input value={s.name} maxLength={100} onChange={(e) => setS({ ...s, name: e.target.value })} /></Field>
            <Field label="Message" hint="Use variables like {Name} and {Link}."><Textarea value={s.message} maxLength={640} onChange={(e) => setS({ ...s, message: e.target.value })} /></Field>
            <Field label="When to send"><Textarea value={s.condition} maxLength={500} onChange={(e) => setS({ ...s, condition: e.target.value })} /></Field>
            <Field label="What to say before sending"><Textarea value={s.say} maxLength={500} onChange={(e) => setS({ ...s, say: e.target.value })} /></Field>
          </div>
          <DialogFooter><Button onClick={addS}>Add action</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Section({ icon: Icon, title, desc, onAdd, children }: { icon: typeof Plus; title: string; desc: string; onAdd: () => void; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div className="flex items-start gap-3">
        <Icon className="mt-1 h-5 w-5 text-muted-foreground" />
        <div className="flex-1"><h2 className="text-lg font-semibold">{title}</h2><p className="text-sm text-muted-foreground">{desc}</p></div>
        <Button variant="outline" onClick={onAdd}><Plus className="h-4 w-4" /> Add action</Button>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
function Item({ title, sub, onDelete, children }: { title: string; sub: string; onDelete: () => void; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-xl border bg-card p-4">
      <div className="min-w-0 flex-1 space-y-1 text-sm"><div className="font-medium">{title}</div><div className="truncate text-muted-foreground">{sub}</div>{children}</div>
      <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>
    </div>
  );
}
function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">{children}</div>;
}
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}{hint && <p className="text-xs text-muted-foreground">{hint}</p>}</div>;
}
function Toggle({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-4 p-4">
      <div className="flex-1"><div className="text-sm font-medium">{label}</div><div className="text-xs text-muted-foreground">{desc}</div></div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}
