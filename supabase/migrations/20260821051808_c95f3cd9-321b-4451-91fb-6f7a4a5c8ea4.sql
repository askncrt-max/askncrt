ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS title_custom boolean NOT NULL DEFAULT false;