import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Loader2, PhoneOff, Sparkles as Wand } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { callsQuery, conversationsQuery, fmtDate, fmtDuration, msgs } from "@/lib/crm";
import { summarizeRecord } from "@/lib/crm.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/agent/$id/analysis")({
  loader: ({ context, params }) => Promise.all([
    context.queryClient.ensureQueryData(callsQuery(params.id)),
    context.queryClient.ensureQueryData(conversationsQuery(params.id)),
  ]),
  component: Analysis,
});

type Row = { id: string; kind: "call" | "conversation"; date: string; duration: number; channel: string; outcome: string | null; summary: string | null; extracted: Record<string, string | null>; transcript: ReturnType<typeof msgs>; who: string };

const DETAIL_LABELS: Record<string, string> = { name: "Name", phone: "Phone", email: "Email", order: "Order", appointment_time: "Appointment time" };

function Analysis() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { data: calls } = useSuspenseQuery(callsQuery(id));
  const { data: convs } = useSuspenseQuery(conversationsQuery(id));
  const summarize = useServerFn(summarizeRecord);
  const [sel, setSel] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);

  const rows = useMemo<Row[]>(() => [
    ...calls.map((c) => ({ id: c.id, kind: "call" as const, date: c.created_at, duration: c.duration_seconds ?? 0, channel: "Call", outcome: c.outcome, summary: c.summary, extracted: (c.extracted ?? {}) as Row["extracted"], transcript: msgs(c.transcript), who: c.contacts?.name || c.from_number || "Caller" })),
    ...convs.map((c) => {
      const m = msgs(c.messages);
      const times = m.map((x) => (x.at ? Date.parse(x.at) : NaN)).filter((n) => !isNaN(n));
      const dur = times.length > 1 ? Math.round((Date.parse(c.updated_at) - Date.parse(c.created_at)) / 1000) : 0;
      return { id: c.id, kind: "conversation" as const, date: c.created_at, duration: Math.max(dur, 0), channel: c.channel === "sms" ? "SMS" : "Chat", outcome: c.outcome, summary: c.summary, extracted: (c.extracted ?? {}) as Row["extracted"], transcript: m, who: c.contacts?.name || "Website visitor" };
    }),
  ].sort((a, b) => b.date.localeCompare(a.date)), [calls, convs]);

  const run = async (r: Row) => {
    setBusy(true);
    try {
      const j = await summarize({ data: { kind: r.kind, id: r.id } });
      const { summary, outcome, ...extracted } = j;
      setSel({ ...r, summary, outcome, extracted });
      qc.invalidateQueries({ queryKey: [r.kind === "call" ? "calls" : "conversations", id] });
    } catch (e) {
      toast.error("Could not summarize", { description: (e as Error).message });
    } finally { setBusy(false); }
  };

  if (rows.length === 0) {
    return (
      <div className="grid place-items-center rounded-2xl border border-dashed p-16 text-center">
        <PhoneOff className="mb-3 h-6 w-6 text-muted-foreground" />
        <h2 className="font-semibold">No calls yet</h2>
        <p className="mt-1 text-sm text-muted-foreground">Calls and chats handled by this agent will show up here.</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>With</TableHead><TableHead>Duration</TableHead><TableHead>Channel</TableHead><TableHead>Outcome</TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id} className="cursor-pointer" onClick={() => setSel(r)}>
                <TableCell className="whitespace-nowrap text-sm">{fmtDate(r.date)}</TableCell>
                <TableCell className="text-sm">{r.who}</TableCell>
                <TableCell className="text-sm tabular-nums">{fmtDuration(r.duration)}</TableCell>
                <TableCell><Badge variant="secondary">{r.channel}</Badge></TableCell>
                <TableCell className="text-sm text-muted-foreground">{r.outcome || "Not analyzed"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Sheet open={!!sel} onOpenChange={(o) => !o && setSel(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {sel && (
            <>
              <SheetHeader><SheetTitle>{sel.channel} with {sel.who}</SheetTitle><p className="text-sm text-muted-foreground">{fmtDate(sel.date)} · {fmtDuration(sel.duration)}</p></SheetHeader>
              <div className="mt-6 space-y-6 px-4 pb-6">
                <section className="rounded-xl border bg-muted/40 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">AI summary</h3>
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => run(sel)}>
                      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand className="h-3.5 w-3.5" />} {sel.summary ? "Regenerate" : "Generate"}
                    </Button>
                  </div>
                  {sel.summary ? (
                    <>
                      <p className="text-sm">{sel.summary}</p>
                      {sel.outcome && <Badge className="mt-3">{sel.outcome}</Badge>}
                      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        {Object.entries(DETAIL_LABELS).map(([k, l]) => (
                          <div key={k}><dt className="text-xs text-muted-foreground">{l}</dt><dd>{sel.extracted[k] || "—"}</dd></div>
                        ))}
                      </dl>
                    </>
                  ) : <p className="text-sm text-muted-foreground">No summary yet. Generate one to extract the name, order and appointment time.</p>}
                </section>
                <section>
                  <h3 className="mb-3 text-sm font-semibold">Transcript</h3>
                  <div className="space-y-2">
                    {sel.transcript.length === 0 && <p className="text-sm text-muted-foreground">No transcript.</p>}
                    {sel.transcript.map((m, i) => (
                      <div key={i} className={cn("rounded-lg px-3 py-2 text-sm", m.role === "user" ? "bg-muted" : "border")}>
                        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{m.role === "user" ? "Customer" : m.role === "agent" ? "You" : "Agent"}</div>
                        <div className="whitespace-pre-wrap">{m.content}</div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
