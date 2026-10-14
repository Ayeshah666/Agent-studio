import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type T<N extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][N]["Row"];
export type Lead = T<"leads">;
export type Contact = T<"contacts">;
export type Conversation = T<"conversations">;
export type Call = T<"calls">;
export type Msg = { role: "user" | "assistant" | "agent"; content: string; at?: string };

export const LEAD_TYPES = ["appointment", "order", "booking", "inquiry"] as const;

export const leadsQuery = (agentId: string) => queryOptions({
  queryKey: ["leads", agentId],
  queryFn: async () => {
    const { data, error } = await supabase.from("leads").select("*").eq("agent_id", agentId).order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
});

export const contactsQuery = (agentId: string) => queryOptions({
  queryKey: ["contacts", agentId],
  queryFn: async () => {
    const { data, error } = await supabase.from("contacts").select("*").eq("agent_id", agentId).order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
});

export const conversationsQuery = (agentId: string) => queryOptions({
  queryKey: ["conversations", agentId],
  queryFn: async () => {
    const { data, error } = await supabase.from("conversations").select("*, contacts(name, email, phone)").eq("agent_id", agentId).order("updated_at", { ascending: false });
    if (error) throw error;
    return data;
  },
});

export const callsQuery = (agentId: string) => queryOptions({
  queryKey: ["calls", agentId],
  queryFn: async () => {
    const { data, error } = await supabase.from("calls").select("*, contacts(name, email, phone)").eq("agent_id", agentId).order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
});

export const msgs = (v: unknown): Msg[] => (Array.isArray(v) ? (v as Msg[]) : []);

export function fmtDate(s: string) {
  return new Date(s).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export function fmtDuration(sec: number | null) {
  const s = sec ?? 0;
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

// Per-agent automations (SMS, transfers, integrations)
export type TransferAction = { id: string; name: string; phone: string; condition: string; say: string };
export type SmsAction = { id: string; name: string; message: string; condition: string; say: string };
export type Webhook = { id: string; name: string; url: string; timing: "during" | "after" | "both"; fields: string[] };
export type Automations = {
  transfers: TransferAction[];
  sms: SmsAction[];
  confirm_caller: boolean;
  confirm_owner: boolean;
  owner_phone: string;
  webhooks: Webhook[];
};

export function resolveAutomations(raw: unknown): Automations {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<Automations>;
  return {
    transfers: Array.isArray(r.transfers) ? r.transfers : [],
    sms: Array.isArray(r.sms) ? r.sms : [],
    confirm_caller: !!r.confirm_caller,
    confirm_owner: !!r.confirm_owner,
    owner_phone: r.owner_phone ?? "",
    webhooks: Array.isArray(r.webhooks) ? r.webhooks : [],
  };
}

export const uid = () => crypto.randomUUID();
