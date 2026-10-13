import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Copy, Check, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { agentQuery, updateAgent } from "@/lib/agents";

export const Route = createFileRoute("/agent/$id/connect")({ component: Connect });

function Connect() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { data: agent } = useSuspenseQuery(agentQuery(id));
  const [origin, setOrigin] = useState("");
  const [domain, setDomain] = useState(agent?.allowed_domain ?? "");
  const [copied, setCopied] = useState(false);
  useEffect(() => setOrigin(window.location.origin), []);
  const snippet = `<script src="${origin}/api/public/widget/script" data-agent="${id}" async></script>`;

  const copy = async () => { await navigator.clipboard.writeText(snippet); setCopied(true); toast.success("Copied"); setTimeout(() => setCopied(false), 1500); };
  const saveDomain = async () => {
    try { const u = await updateAgent(id, { allowed_domain: domain.trim() || null }); qc.setQueryData(agentQuery(id).queryKey, u); toast.success("Saved"); }
    catch (e) { toast.error((e as Error).message); }
  };

  return (
    <div className="max-w-3xl rounded-2xl border bg-card p-6 shadow-soft">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary"><MessageSquare className="h-5 w-5" /></span>
        <div><h2 className="font-semibold">Connect Chatbot</h2><p className="text-sm text-muted-foreground">Paste this line just before the closing &lt;/body&gt; tag of your website.</p></div>
      </div>
      <div className="relative mt-5">
        <pre className="overflow-x-auto rounded-xl bg-muted p-4 pr-14 font-mono text-[13px]">{snippet}</pre>
        <Button size="icon" variant="outline" className="absolute right-2 top-2" onClick={copy} aria-label="Copy snippet">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</Button>
      </div>
      <div className="mt-6 space-y-2">
        <Label>Allowed website domain (optional)</Label>
        <div className="flex gap-2">
          <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="example.com" />
          <Button onClick={saveDomain} disabled={(agent?.allowed_domain ?? "") === domain.trim()}>Save</Button>
        </div>
        <p className="text-xs text-muted-foreground">When set, the chatbot only works on this domain and its subdomains. Leave empty to allow any site.</p>
      </div>
    </div>
  );
}
