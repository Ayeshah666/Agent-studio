export type AgentType = "voice" | "chatbot" | "both";
export type AgentStatus = "draft" | "active" | "paused";

export const AGENT_TYPE_LABEL: Record<AgentType, string> = {
  voice: "Voice Only",
  chatbot: "Chatbot Only",
  both: "Voice + Chatbot",
};

export const INDUSTRIES = [
  "Retail & E-commerce", "Healthcare", "Finance", "Real Estate", "Education",
  "Hospitality & Travel", "Automotive", "Professional Services", "Technology",
  "Food & Beverage", "Fitness & Wellness", "Legal", "Non-Profit", "Media", "Other",
] as const;

export const INDUSTRY_GOALS: Record<string, string> = {
  "Retail & E-commerce": "Answer product questions, help customers track orders, handle returns and exchanges, and recommend products.",
  Healthcare: "Answer general questions about services and hours, book or reschedule appointments, and collect patient contact details. Never give medical advice.",
  Finance: "Explain services and account options, answer common questions, and schedule consultations with an advisor.",
  "Real Estate": "Answer questions about listings, qualify buyers and renters, and book property viewings.",
  Education: "Answer questions about programs, admissions and fees, and schedule campus tours or info sessions.",
  "Hospitality & Travel": "Answer questions about rooms and amenities, take reservations, and handle booking changes.",
  Automotive: "Answer questions about vehicles and services, book service appointments and test drives.",
  "Professional Services": "Explain services, qualify leads, and book discovery calls.",
  Technology: "Answer product questions, help with basic troubleshooting, and route complex issues to support.",
  "Food & Beverage": "Answer menu and hours questions, take reservations and takeout orders.",
  "Fitness & Wellness": "Answer questions about classes and memberships, book sessions, and capture new member leads.",
  Legal: "Answer general questions about practice areas, collect case details, and schedule consultations. Never give legal advice.",
  "Non-Profit": "Explain the mission and programs, answer donor and volunteer questions, and collect contact details.",
  Media: "Answer audience questions, handle subscription inquiries, and route partnership requests.",
  Other: "Answer customer questions, collect contact details, and help book appointments.",
};

export const LANGUAGES = [
  { value: "en-US", label: "English (US)" },
  { value: "en-GB", label: "English (UK)" },
  { value: "es-ES", label: "Spanish" },
  { value: "fr-FR", label: "French" },
  { value: "de-DE", label: "German" },
  { value: "pt-BR", label: "Portuguese (BR)" },
  { value: "it-IT", label: "Italian" },
  { value: "hi-IN", label: "Hindi" },
  { value: "ur-PK", label: "Urdu" },
  { value: "ar-SA", label: "Arabic" },
];

export const LLM_MODELS = [
  { value: "google/gemini-3-flash-preview", label: "Gemini 3 Flash" },
  { value: "google/gemini-3.1-pro-preview", label: "Gemini 3.1 Pro" },
  { value: "openai/gpt-5.6-terra", label: "GPT-5.6 Terra" },
  { value: "openai/gpt-5.6-luna", label: "GPT-5.6 Luna" },
  { value: "anthropic/claude-sonnet-5", label: "Claude Sonnet 5" },
];

export const TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Phoenix", label: "Arizona (MST)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HT)" },
  { value: "UTC", label: "Coordinated Universal Time (UTC)" },
];

export const COLLECT_OPTIONS = [
  "Name", "Email", "Address", "Company", "Order Details",
  "Appointment Date & Time", "Reservation Date & Time",
];

export const VOICES = [
  { id: "aria", name: "Aria", description: "Warm, friendly female · American" },
  { id: "marcus", name: "Marcus", description: "Calm, confident male · American" },
  { id: "elena", name: "Elena", description: "Bright, upbeat female · British" },
  { id: "theo", name: "Theo", description: "Deep, reassuring male · British" },
  { id: "sofia", name: "Sofia", description: "Soft, professional female · Spanish accent" },
  { id: "kai", name: "Kai", description: "Young, energetic male · Australian" },
  { id: "noor", name: "Noor", description: "Clear, articulate female · Neutral" },
  { id: "jonah", name: "Jonah", description: "Relaxed, conversational male · Neutral" },
];

export type AdvancedSettings = {
  max_call_minutes: number;
  silence_timeout_seconds: number;
  interruption_sensitivity: number;
  llm_temperature: number;
  voice_speed: number;
  voice_temperature: number;
};

export const DEFAULT_SETTINGS: AdvancedSettings = {
  max_call_minutes: 15,
  silence_timeout_seconds: 15,
  interruption_sensitivity: 0.75,
  llm_temperature: 0,
  voice_speed: 1,
  voice_temperature: 0.2,
};

export const ADVANCED_FIELDS: {
  key: keyof AdvancedSettings; label: string; min: number; max: number; step: number; unit: string;
}[] = [
  { key: "max_call_minutes", label: "Maximum call time", min: 1, max: 120, step: 1, unit: " min" },
  { key: "silence_timeout_seconds", label: "End call after silence", min: 10, max: 1000, step: 1, unit: " s" },
  { key: "interruption_sensitivity", label: "Interruption sensitivity", min: 0, max: 1, step: 0.05, unit: "" },
  { key: "llm_temperature", label: "LLM temperature", min: 0, max: 1, step: 0.05, unit: "" },
  { key: "voice_speed", label: "Voice speed", min: 0.5, max: 2, step: 0.05, unit: "x" },
  { key: "voice_temperature", label: "Voice temperature", min: 0, max: 1, step: 0.05, unit: "" },
];

export const WORKSPACE_TABS = [
  { slug: "", label: "Agent" },
  { slug: "sms-transfer", label: "SMS & Transfer" },
  { slug: "integrations", label: "Integrations" },
  { slug: "knowledge-base", label: "Knowledge Base" },
  { slug: "chatbot-builder", label: "Chatbot Builder" },
  { slug: "conversations", label: "Conversations" },
  { slug: "leads", label: "Leads" },
  { slug: "contacts", label: "Contacts" },
  { slug: "analysis", label: "Analysis" },
  { slug: "connect", label: "Connect" },
];
