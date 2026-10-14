import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Download, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { leadsQuery, LEAD_TYPES, fmtDate } from "@/lib/crm";
import { toCsv, downloadFile } from "@/lib/csv";

export const Route = createFileRoute("/agent/$id/leads")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(leadsQuery(params.id)),
  component: LeadsTab,
});

function LeadsTab() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { data: leads } = useSuspenseQuery(leadsQuery(id));
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", email: "", phone: "", lead_type: "inquiry", details: "" });

  const rows = useMemo(() => {
    const s = q.toLowerCase();
    return leads.filter((l) => [l.name, l.email, l.phone, l.details, l.lead_type, l.source].some((v) => v?.toLowerCase().includes(s)));
  }, [leads, q]);

  const add = async () => {
    if (!f.name.trim() && !f.email.trim() && !f.phone.trim()) return void toast.error("Add a name, email or phone");
    const { error } = await supabase.from("leads").insert({ agent_id: id, ...f, source: "manual", data: {} });
    if (error) return void toast.error("Could not add lead", { description: error.message });
    toast.success("Lead added");
    setOpen(false);
    setF({ name: "", email: "", phone: "", lead_type: "inquiry", details: "" });
    qc.invalidateQueries({ queryKey: ["leads", id] });
  };

  const exportCsv = () => downloadFile("leads.csv", toCsv(rows.map((l) => ({ ...l, created_at: fmtDate(l.created_at) })), [
    { key: "name", label: "Name" }, { key: "email", label: "Email" }, { key: "phone", label: "Phone" },
    { key: "lead_type", label: "Type" }, { key: "details", label: "Details" }, { key: "created_at", label: "Date" }, { key: "source", label: "Source" },
  ]));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search leads" className="pl-9" />
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={exportCsv} disabled={!rows.length}><Download className="h-4 w-4" /> Export CSV</Button>
          <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add Lead</Button>
        </div>
      </div>
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Contact</TableHead><TableHead>Type</TableHead><TableHead>Details</TableHead><TableHead>Date</TableHead><TableHead>Source</TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.length === 0 && <TableRow><TableCell colSpan={6} className="py-12 text-center text-muted-foreground">No leads yet</TableCell></TableRow>}
            {rows.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="font-medium">{l.name || "—"}</TableCell>
                <TableCell className="text-sm"><div>{l.email}</div><div className="text-muted-foreground">{l.phone}</div></TableCell>
                <TableCell><Badge variant="secondary" className="capitalize">{l.lead_type}</Badge></TableCell>
                <TableCell className="max-w-xs truncate text-sm text-muted-foreground">{l.details || "—"}</TableCell>
                <TableCell className="whitespace-nowrap text-sm">{fmtDate(l.created_at)}</TableCell>
                <TableCell className="text-sm capitalize">{l.source}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add lead</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            {(["name", "email", "phone"] as const).map((k) => (
              <div key={k} className="space-y-1.5"><Label className="capitalize">{k}</Label><Input value={f[k]} maxLength={255} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></div>
            ))}
            <div className="space-y-1.5"><Label>Type</Label>
              <Select value={f.lead_type} onValueChange={(v) => setF({ ...f, lead_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{LEAD_TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Details</Label><Textarea value={f.details} maxLength={2000} onChange={(e) => setF({ ...f, details: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={add}>Add lead</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
