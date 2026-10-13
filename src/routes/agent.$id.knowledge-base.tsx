import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link2, FileUp, FileText, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { addKnowledge } from "@/lib/kb.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const itemsQuery = (agentId: string) => queryOptions({
  queryKey: ["knowledge", agentId],
  queryFn: async () => {
    const { data, error } = await supabase.from("knowledge_items").select("id,title,source_type,source_url,status,error,created_at").eq("agent_id", agentId).order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
});

export const Route = createFileRoute("/agent/$id/knowledge-base")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(itemsQuery(params.id)),
  component: KnowledgeBase,
});

async function extractFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".txt") || name.endsWith(".md")) return file.text();
  const buf = await file.arrayBuffer();
  if (name.endsWith(".pdf")) {
    const pdfjs = await import("pdfjs-dist");
    const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    const doc = await pdfjs.getDocument({ data: buf }).promise;
    const pages: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const tc = await (await doc.getPage(i)).getTextContent();
      pages.push(tc.items.map((it) => ("str" in it ? it.str : "")).join(" "));
    }
    return pages.join("\n\n");
  }
  if (name.endsWith(".docx")) {
    const mammoth = await import("mammoth/mammoth.browser");
    return (await mammoth.extractRawText({ arrayBuffer: buf })).value;
  }
  throw new Error("Only PDF, TXT and DOCX files are supported");
}

function KnowledgeBase() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { data: items } = useSuspenseQuery(itemsQuery(id));
  const add = useServerFn(addKnowledge);
  const [dialog, setDialog] = useState<"url" | "text" | null>(null);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const refresh = () => qc.invalidateQueries({ queryKey: ["knowledge", id] });

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    const p = fn();
    setTimeout(refresh, 300);
    try { await p; toast.success(ok); setDialog(null); setUrl(""); setTitle(""); setText(""); }
    catch (e) { toast.error((e as Error).message); }
    setBusy(false); refresh();
  };

  const onFiles = async (files: FileList | null) => {
    if (!files) return;
    for (const f of Array.from(files)) {
      if (f.size > 15 * 1024 * 1024) { toast.error(`${f.name} is larger than 15 MB`); continue; }
      await run(async () => add({ data: { agentId: id, type: "file", title: f.name, content: await extractFile(f) } }), `${f.name} added`);
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const remove = async (itemId: string) => {
    const { error } = await supabase.from("knowledge_items").delete().eq("id", itemId);
    if (error) toast.error(error.message); else { toast.success("Deleted"); refresh(); }
  };

  const cards = [
    { icon: Link2, title: "Add URL", desc: "Import the text of a web page", onClick: () => setDialog("url") },
    { icon: FileUp, title: "Add Files", desc: "PDF, TXT or DOCX", onClick: () => fileRef.current?.click() },
    { icon: FileText, title: "Create Text", desc: "Write or paste information", onClick: () => setDialog("text") },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <button key={c.title} onClick={c.onClick} disabled={busy} className="flex items-start gap-3 rounded-2xl border bg-card p-5 text-left shadow-soft transition hover:border-primary disabled:opacity-60">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary"><c.icon className="h-5 w-5" /></span>
            <span><span className="block font-semibold">{c.title}</span><span className="text-sm text-muted-foreground">{c.desc}</span></span>
          </button>
        ))}
      </div>
      <input ref={fileRef} type="file" multiple accept=".pdf,.txt,.md,.docx" className="hidden" onChange={(e) => onFiles(e.target.files)} />

      <div className="rounded-2xl border bg-card shadow-soft">
        <div className="border-b px-5 py-3 font-semibold">Knowledge items</div>
        {items.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">Nothing added yet. Add a URL, file or text so your chatbot can answer from it.</p>
        ) : (
          <ul className="divide-y">
            {items.map((it) => (
              <li key={it.id} className="flex items-center gap-4 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{it.title || it.source_url || "Untitled"}</p>
                  {it.status === "failed" && <p className="truncate text-xs text-destructive">{it.error}</p>}
                </div>
                <Badge variant="outline" className="capitalize">{it.source_type}</Badge>
                <Badge variant={it.status === "failed" ? "destructive" : "secondary"} className="capitalize">
                  {it.status === "processing" && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}{it.status}
                </Badge>
                <Button size="icon" variant="ghost" onClick={() => remove(it.id)} aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog open={dialog === "url"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add URL</DialogTitle></DialogHeader>
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/about" autoFocus />
          <DialogFooter><Button disabled={busy || !url.trim()} onClick={() => run(() => add({ data: { agentId: id, type: "url", url: url.trim() } }), "Page added")}>{busy && <Loader2 className="h-4 w-4 animate-spin" />} Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={dialog === "text"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle>Create Text</DialogTitle></DialogHeader>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title, e.g. Opening hours" />
          <Textarea value={text} onChange={(e) => setText(e.target.value)} className="min-h-60" placeholder="Paste or write the information…" />
          <DialogFooter><Button disabled={busy || text.trim().length < 20} onClick={() => run(() => add({ data: { agentId: id, type: "text", title, content: text } }), "Text added")}>{busy && <Loader2 className="h-4 w-4 animate-spin" />} Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
