ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS parts jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS client_id text;

CREATE UNIQUE INDEX IF NOT EXISTS messages_conversation_client_id_key
  ON public.messages (conversation_id, client_id)
  WHERE client_id IS NOT NULL;