import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { MessageSquare, Search, Send, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { conversationsQuery, fmtDate, msgs, type Msg } from "@/lib/crm";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/agent/$id/conversations")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(conversationsQuery(params.id)),
  component: Inbox,
});

function Inbox() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { data: convs } = useSuspenseQuery({ ...conversationsQuery(id), refetchInterval: 10000 });
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const list = useMemo(() => {
    const s = q.toLowerCase();
    return convs.filter((c) => !s || c.contacts?.name?.toLowerCase().includes(s) || msgs(c.messages).some((m) => m.content.toLowerCase().includes(s)));
  }, [convs, q]);
  const current = convs.find((c) => c.id === sel) ?? null;
  const unread = convs.reduce((n, c) => n + (c.unread_count > 0 ? 1 : 0), 0);
  const thread = current ? msgs(current.messages) : [];

  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [sel, thread.length]);

  const open = async (cid: string) => {
    setSel(cid);
    const c = convs.find((x) => x.id === cid);
    if (c && c.unread_count > 0) {
      await supabase.from("conversations").update({ unread_count: 0 }).eq("id", cid);
      qc.invalidateQueries({ queryKey: ["conversations", id] });
    }
  };

  const send = async () => {
    if (!current || !reply.trim()) return;
    setSending(true);
    const now = new Date().toISOString();
    const next: Msg[] = [...thread, { role: "agent", content: reply.trim().slice(0, 4000), at: now }];
    const { error } = await supabase.from("conversations").update({ messages: next, updated_at: now }).eq("id", current.id);
    setSending(false);
    if (error) return void toast.error("Could not send", { description: error.message });
    setReply("");
    qc.invalidateQueries({ queryKey: ["conversations", id] });
  };

  const label = (c: (typeof convs)[number]) => c.contacts?.name || c.contacts?.email || c.contacts?.phone || "Website visitor";

  return (
    <div className="grid h-[calc(100vh-14rem)] min-h-[480px] grid-cols-[320px_1fr] overflow-hidden rounded-xl border bg-card">
      <aside className="flex min-h-0 flex-col border-r">
        <div className="flex items-center gap-2 border-b p-3">
          <h2 className="font-semibold">Inbox</h2>
          {unread > 0 && <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">{unread}</span>}
        </div>
        <div className="relative p-3">
          <Search className="absolute left-6 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search threads" className="pl-9" />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {list.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No conversations yet</p>}
          {list.map((c) => {
            const last = msgs(c.messages).at(-1);
            return (
              <button key={c.id} onClick={() => open(c.id)} className={cn("flex w-full gap-3 border-b px-3 py-3 text-left hover:bg-accent", sel === c.id && "bg-accent")}>
                <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted">
                  {c.channel === "sms" ? <Smartphone className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={cn("truncate text-sm", c.unread_count > 0 && "font-semibold")}>{label(c)}</span>
                    <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">{fmtDate(c.updated_at)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="truncate text-xs text-muted-foreground">{last?.content ?? "No messages"}</p>
                    {c.unread_count > 0 && <span className="ml-auto rounded-full bg-primary px-1.5 text-[10px] font-medium text-primary-foreground">{c.unread_count}</span>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </aside>
      <section className="flex min-h-0 flex-col">
        {!current ? (
          <div className="grid flex-1 place-items-center text-sm text-muted-foreground">Select a conversation</div>
        ) : (
          <>
            <div className="border-b p-4">
              <div className="font-semibold">{label(current)}</div>
              <div className="text-xs capitalize text-muted-foreground">{current.channel} · started {fmtDate(current.created_at)}</div>
            </div>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
              {thread.map((m, i) => (
                <div key={i} className={cn("flex", m.role === "user" ? "justify-start" : "justify-end")}>
                  <div className={cn("max-w-[75%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm", m.role === "user" ? "bg-muted" : m.role === "agent" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground")}>
                    <div className="mb-0.5 text-[10px] uppercase tracking-wide opacity-60">{m.role === "user" ? "Customer" : m.role === "agent" ? "You" : "AI"}</div>
                    {m.content}
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>
            <form className="flex gap-2 border-t p-3" onSubmit={(e) => { e.preventDefault(); void send(); }}>
              <Textarea value={reply} onChange={(e) => setReply(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }} placeholder="Type a reply…" className="min-h-10 resize-none" rows={1} />
              <Button type="submit" disabled={sending || !reply.trim()}><Send className="h-4 w-4" /> Send</Button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
