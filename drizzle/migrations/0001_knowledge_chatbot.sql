CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

ALTER TABLE public.knowledge_items ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'ready';
ALTER TABLE public.knowledge_items ADD COLUMN IF NOT EXISTS error text;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS chatbot jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS allowed_domain text;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE TABLE public.knowledge_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.knowledge_items(id) ON DELETE CASCADE,
  content text NOT NULL,
  embedding extensions.vector(768) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.knowledge_chunks TO service_role;
ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;
CREATE INDEX knowledge_chunks_agent_idx ON public.knowledge_chunks(agent_id);

CREATE OR REPLACE FUNCTION public.match_knowledge_chunks(_agent_id uuid, _embedding extensions.vector(768), _count int DEFAULT 5)
RETURNS TABLE(content text, similarity float)
LANGUAGE sql STABLE SET search_path = public, extensions AS $$
  SELECT c.content, 1 - (c.embedding <=> _embedding) AS similarity
  FROM public.knowledge_chunks c
  WHERE c.agent_id = _agent_id
  ORDER BY c.embedding <=> _embedding
  LIMIT _count;
$$;
REVOKE EXECUTE ON FUNCTION public.match_knowledge_chunks(uuid, extensions.vector, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.match_knowledge_chunks(uuid, extensions.vector, int) TO service_role;