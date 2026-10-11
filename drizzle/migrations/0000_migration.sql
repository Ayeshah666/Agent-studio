CREATE TABLE public.agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  agent_type text NOT NULL DEFAULT 'voice' CHECK (agent_type IN ('voice','chatbot','both')),
  industry text,
  business_name text,
  website text,
  goal text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','paused')),
  first_message text DEFAULT '',
  system_prompt text DEFAULT '',
  language text DEFAULT 'en-US',
  llm_model text DEFAULT 'google/gemini-3-flash-preview',
  timezone text DEFAULT 'America/New_York',
  voice_id text,
  collect_fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  call_count integer NOT NULL DEFAULT 0,
  chat_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES public.agents(id) ON DELETE CASCADE,
  name text, email text, phone text, company text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES public.agents(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  status text DEFAULT 'new',
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES public.agents(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  channel text NOT NULL DEFAULT 'chat',
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES public.agents(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  direction text DEFAULT 'inbound',
  from_number text, to_number text,
  duration_seconds integer DEFAULT 0,
  transcript jsonb NOT NULL DEFAULT '[]'::jsonb,
  recording_url text, summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.knowledge_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES public.agents(id) ON DELETE CASCADE,
  source_type text NOT NULL DEFAULT 'text',
  title text, content text, source_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER agents_touch BEFORE UPDATE ON public.agents FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['agents','contacts','leads','conversations','calls','knowledge_items'] LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO anon, authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "personal app full access" ON public.%I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;