import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { agentQuery, updateAgent } from "@/lib/agents";
import { resolveAutomations, type Automations } from "@/lib/crm";

export function useAutomations(id: string) {
  const qc = useQueryClient();
  const { data: agent } = useSuspenseQuery(agentQuery(id));
  const auto = resolveAutomations(agent?.automations);
  const save = async (patch: Partial<Automations>, msg?: string) => {
    try {
      const updated = await updateAgent(id, { automations: { ...auto, ...patch } });
      qc.setQueryData(agentQuery(id).queryKey, updated);
      if (msg) toast.success(msg);
    } catch (e) {
      toast.error("Save failed", { description: (e as Error).message });
    }
  };
  return { auto, save };
}
