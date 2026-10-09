ALTER TABLE public.profiles
  ADD COLUMN legal_terms_version text,
  ADD COLUMN legal_privacy_version text,
  ADD COLUMN legal_accepted_at timestamptz;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  terms_version text := NULLIF(NEW.raw_user_meta_data->>'legal_terms_version', '');
  privacy_version text := NULLIF(NEW.raw_user_meta_data->>'legal_privacy_version', '');
BEGIN
  INSERT INTO public.profiles (
    id, display_name, avatar_url, email,
    legal_terms_version, legal_privacy_version, legal_accepted_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.email,
    terms_version,
    privacy_version,
    CASE WHEN terms_version IS NOT NULL AND privacy_version IS NOT NULL THEN now() ELSE NULL END
  );
  RETURN NEW;
END; $function$;