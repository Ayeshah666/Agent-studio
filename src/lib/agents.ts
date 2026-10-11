import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Agent = Database["public"]["Tables"]["agents"]["Row"];
export type AgentUpdate = Database["public"]["Tables"]["agents"]["Update"];

export const agentsQuery = () =>
  queryOptions({
    queryKey: ["agents"],
    queryFn: async () => {
      const { data, error } = await supabase.from("agents").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const agentQuery = (id: string) =>
  queryOptions({
    queryKey: ["agent", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("agents").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export async function updateAgent(id: string, patch: AgentUpdate) {
  const { data, error } = await supabase.from("agents").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data;
}
