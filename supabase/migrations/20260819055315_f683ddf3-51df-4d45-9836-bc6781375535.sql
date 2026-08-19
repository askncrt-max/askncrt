DROP INDEX IF EXISTS public.messages_conversation_client_id_key;
ALTER TABLE public.messages
  ADD CONSTRAINT messages_conversation_client_id_key UNIQUE (conversation_id, client_id);