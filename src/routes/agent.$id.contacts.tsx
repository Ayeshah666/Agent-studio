import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { Download, Plus, Search, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { contactsQuery, fmtDate } from "@/lib/crm";
import { toCsv, parseCsv, downloadFile } from "@/lib/csv";

export const Route = createFileRoute("/agent/$id/contacts")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(contactsQuery(params.id)),
  component: ContactsTab,
});

const sourceOf = (d: unknown) => ((d && typeof d === "object" ? (d as Record<string, unknown>)["source"] : null) as string | null) ?? "manual";

function ContactsTab() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { data: contacts } = useSuspenseQuery(contactsQuery(id));
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", email: "", phone: "", company: "" });
  const fileRef = useRef<HTMLInputElement>(null);
  const refresh = () => qc.invalidateQueries({ queryKey: ["contacts", id] });

  const rows = useMemo(() => {
    const s = q.toLowerCase();
    return contacts.filter((c) => [c.name, c.email, c.phone, c.company].some((v) => v?.toLowerCase().includes(s)));
  }, [contacts, q]);

  const create = async () => {
    if (!f.name.trim() && !f.email.trim() && !f.phone.trim()) return void toast.error("Add a name, email or phone");
    const { error } = await supabase.from("contacts").insert({ agent_id: id, ...f, data: { source: "manual" } });
    if (error) return void toast.error("Could not create contact", { description: error.message });
    toast.success("Contact created");
    setOpen(false); setF({ name: "", email: "", phone: "", company: "" }); refresh();
  };

  const importCsv = async (file: File) => {
    const parsed = parseCsv(await file.text());
    const items = parsed.map((r) => ({
      agent_id: id,
      name: (r["name"] || r["full name"] || "").slice(0, 200) || null,
      email: (r["email"] || "").slice(0, 255) || null,
      phone: (r["phone"] || r["phone number"] || "").slice(0, 50) || null,
      company: (r["company"] || "").slice(0, 200) || null,
      data: { source: "import" },
    })).filter((r) => r.name || r.email || r.phone);
    if (!items.length) return void toast.error("No contacts found", { description: "Use columns: name, email, phone, company" });
    const { error } = await supabase.from("contacts").insert(items);
    if (error) return void toast.error("Import failed", { description: error.message });
    toast.success(`Imported ${items.length} contacts`); refresh();
  };

  const exportCsv = () => downloadFile("contacts.csv", toCsv(rows.map((c) => ({ ...c, source: sourceOf(c.data), created_at: fmtDate(c.created_at) })), [
    { key: "name", label: "name" }, { key: "email", label: "email" }, { key: "phone", label: "phone" }, { key: "company", label: "company" }, { key: "source", label: "source" }, { key: "created_at", label: "created" },
  ]));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search contacts" className="pl-9" />
        </div>
        <div className="ml-auto flex gap-2">
          <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={(e) => { const fl = e.target.files?.[0]; if (fl) void importCsv(fl); e.target.value = ""; }} />
          <Button variant="outline" onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4" /> Import CSV</Button>
          <Button variant="outline" onClick={exportCsv} disabled={!rows.length}><Download className="h-4 w-4" /> Export CSV</Button>
          <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Create Contact</Button>
        </div>
      </div>
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>Company</TableHead><TableHead>Source</TableHead><TableHead>Created</TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.length === 0 && <TableRow><TableCell colSpan={6} className="py-12 text-center text-muted-foreground">No contacts yet. They appear automatically from chats and calls.</TableCell></TableRow>}
            {rows.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name || "—"}</TableCell>
                <TableCell className="text-sm">{c.email || "—"}</TableCell>
                <TableCell className="text-sm">{c.phone || "—"}</TableCell>
                <TableCell className="text-sm">{c.company || "—"}</TableCell>
                <TableCell className="text-sm capitalize">{sourceOf(c.data)}</TableCell>
                <TableCell className="whitespace-nowrap text-sm">{fmtDate(c.created_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create contact</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            {(["name", "email", "phone", "company"] as const).map((k) => (
              <div key={k} className="space-y-1.5"><Label className="capitalize">{k}</Label><Input value={f[k]} maxLength={255} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></div>
            ))}
          </div>
          <DialogFooter><Button onClick={create}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
