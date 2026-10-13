// Shared (browser + server safe) chatbot widget configuration.
export type ResponseStyle = "concise" | "balanced" | "detailed";
export type WidgetSize = "compact" | "normal" | "large";
export type WidgetIcon = "chat" | "dots" | "stack" | "bubbles" | "phone";
export type AvatarChoice = "female" | "male" | "upload";

export type ChatbotColors = { accent: string; background: string; bubble: string; text: string };

export type ChatbotConfig = {
  bot_name: string;
  business_name: string;
  website: string;
  wait_seconds: number;
  response_style: ResponseStyle;
  personality: string;
  goal: string;
  additional_info: string;
  first_message: string;
  placeholder: string;
  status_text: string;
  position: "bottom-right" | "bottom-left";
  quick_replies: string[];
  lead_form: { enabled: boolean; fields: { name: boolean; email: boolean; phone: boolean } };
  theme: string;
  colors: ChatbotColors;
  size: WidgetSize;
  icon: WidgetIcon;
  avatar: AvatarChoice;
  avatar_url: string;
};

export const THEMES: { id: string; label: string; colors: ChatbotColors }[] = [
  { id: "classic", label: "Classic", colors: { accent: "#2563eb", background: "#ffffff", bubble: "#f1f5f9", text: "#0f172a" } },
  { id: "dark-night", label: "Dark Night", colors: { accent: "#8b5cf6", background: "#111827", bubble: "#1f2937", text: "#f9fafb" } },
  { id: "ocean", label: "Ocean", colors: { accent: "#0891b2", background: "#f0fdff", bubble: "#cffafe", text: "#083344" } },
  { id: "sunset", label: "Sunset", colors: { accent: "#ea580c", background: "#fffaf5", bubble: "#ffedd5", text: "#431407" } },
  { id: "forest", label: "Forest", colors: { accent: "#15803d", background: "#f7fdf8", bubble: "#dcfce7", text: "#052e16" } },
  { id: "royal", label: "Royal", colors: { accent: "#4338ca", background: "#fafaff", bubble: "#e0e7ff", text: "#1e1b4b" } },
  { id: "rose", label: "Rose", colors: { accent: "#e11d48", background: "#fff8f9", bubble: "#ffe4e6", text: "#4c0519" } },
  { id: "neon", label: "Neon", colors: { accent: "#22d3ee", background: "#0a0a0a", bubble: "#18181b", text: "#e4e4e7" } },
  { id: "minimal", label: "Minimal", colors: { accent: "#171717", background: "#ffffff", bubble: "#f5f5f5", text: "#171717" } },
  { id: "custom", label: "Custom", colors: { accent: "#2563eb", background: "#ffffff", bubble: "#f1f5f9", text: "#0f172a" } },
];

export const DEFAULT_CHATBOT: ChatbotConfig = {
  bot_name: "Assistant",
  business_name: "",
  website: "",
  wait_seconds: 1,
  response_style: "balanced",
  personality: "",
  goal: "",
  additional_info: "",
  first_message: "Hi there! How can I help you today?",
  placeholder: "Type your message…",
  status_text: "Online · replies instantly",
  position: "bottom-right",
  quick_replies: [],
  lead_form: { enabled: false, fields: { name: true, email: true, phone: false } },
  theme: "classic",
  colors: { accent: "#2563eb", background: "#ffffff", bubble: "#f1f5f9", text: "#0f172a" },
  size: "normal",
  icon: "chat",
  avatar: "female",
  avatar_url: "",
};

export function resolveChatbot(raw: unknown, agent?: { name?: string | null; business_name?: string | null; website?: string | null; goal?: string | null; first_message?: string | null }): ChatbotConfig {
  const c = (raw && typeof raw === "object" ? raw : {}) as Partial<ChatbotConfig>;
  return {
    ...DEFAULT_CHATBOT,
    bot_name: agent?.name || DEFAULT_CHATBOT.bot_name,
    business_name: agent?.business_name || "",
    website: agent?.website || "",
    goal: agent?.goal || "",
    first_message: agent?.first_message || DEFAULT_CHATBOT.first_message,
    ...c,
    lead_form: { ...DEFAULT_CHATBOT.lead_form, ...(c.lead_form ?? {}), fields: { ...DEFAULT_CHATBOT.lead_form.fields, ...(c.lead_form?.fields ?? {}) } },
    colors: { ...DEFAULT_CHATBOT.colors, ...(c.colors ?? {}) },
    quick_replies: (c.quick_replies ?? []).slice(0, 3),
  };
}

export const SIZE_DIMENSIONS: Record<WidgetSize, { w: number; h: number }> = {
  compact: { w: 330, h: 470 },
  normal: { w: 370, h: 560 },
  large: { w: 420, h: 640 },
};

export const ICON_SVGS: Record<WidgetIcon, string> = {
  chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  dots: '<path d="M21 12a9 9 0 1 1-3.2-6.9L21 4v5h-5"/><circle cx="8" cy="12" r=".6" fill="currentColor"/><circle cx="12" cy="12" r=".6" fill="currentColor"/><circle cx="16" cy="12" r=".6" fill="currentColor"/>',
  stack: '<rect x="3" y="4" width="18" height="6" rx="2"/><rect x="3" y="14" width="12" height="6" rx="2"/>',
  bubbles: '<path d="M14 9a2 2 0 0 1-2 2H6l-3 3V4a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2z"/><path d="M18 9h1a2 2 0 0 1 2 2v10l-3-3h-6a2 2 0 0 1-2-2v-1"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
};

// Simple illustrated avatars (data URIs) so no external images are needed.
const avatarSvg = (skin: string, hair: string, female: boolean) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#e8eef7"/>${
      female ? `<path d="M14 40c0-18 8-28 18-28s18 10 18 28v12H14z" fill="${hair}"/>` : ""
    }<circle cx="32" cy="28" r="12" fill="${skin}"/>${
      female ? "" : `<path d="M20 26c0-9 6-13 12-13s12 4 12 13c-3-4-7-6-12-6s-9 2-12 6z" fill="${hair}"/>`
    }<path d="M12 64c2-12 10-18 20-18s18 6 20 18z" fill="${female ? "#6366f1" : "#0ea5e9"}"/></svg>`,
  )}`;

export const AVATARS = {
  female: avatarSvg("#f2c7a5", "#3b2a20", true),
  male: avatarSvg("#d9a77f", "#1f1a17", false),
};

export function avatarSrc(c: ChatbotConfig) {
  if (c.avatar === "upload" && c.avatar_url) return c.avatar_url;
  return c.avatar === "male" ? AVATARS.male : AVATARS.female;
}
