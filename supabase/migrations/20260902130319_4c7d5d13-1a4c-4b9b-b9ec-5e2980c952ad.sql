
-- ROLES
CREATE TYPE public.app_role AS ENUM ('super_admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id, 'super_admin'::public.app_role);
$$;

CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Super admin manages roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

-- Auto-grant super_admin to the verified owner account
CREATE OR REPLACE FUNCTION public.grant_super_admin_for_owner()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL AND lower(NEW.email) = 'askncrt@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'super_admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created_grant_super_admin
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.grant_super_admin_for_owner();

CREATE TRIGGER on_auth_user_confirmed_grant_super_admin
AFTER UPDATE OF email_confirmed_at ON auth.users FOR EACH ROW
WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
EXECUTE FUNCTION public.grant_super_admin_for_owner();

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin' FROM auth.users WHERE lower(email) = 'askncrt@gmail.com' AND email_confirmed_at IS NOT NULL
ON CONFLICT DO NOTHING;

-- PROFILES additions
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS last_active_at timestamptz;

CREATE POLICY "Super admin manages profiles" ON public.profiles FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

-- PLANS
CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  price_inr integer NOT NULL DEFAULT 0,
  ai_daily_limit integer NOT NULL DEFAULT 30,
  ocr_daily_limit integer NOT NULL DEFAULT 5,
  quiz_daily_limit integer NOT NULL DEFAULT 3,
  upload_mb_limit integer NOT NULL DEFAULT 10,
  storage_mb_limit integer NOT NULL DEFAULT 100,
  ads_enabled boolean NOT NULL DEFAULT true,
  features jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.plans TO anon, authenticated;
GRANT ALL ON public.plans TO service_role;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads active plans" ON public.plans FOR SELECT USING (active = true);
CREATE POLICY "Super admin manages plans" ON public.plans FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE TRIGGER plans_set_updated_at BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.plans (code, name, price_inr, ai_daily_limit, ocr_daily_limit, quiz_daily_limit, upload_mb_limit, storage_mb_limit, ads_enabled, sort_order) VALUES
  ('free','Free',0,30,5,3,10,100,true,1),
  ('plus','Plus',99,200,50,20,25,1000,false,2),
  ('pro','Pro',249,1000,200,100,50,5000,false,3);

-- SUBSCRIPTIONS
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_code text NOT NULL DEFAULT 'free' REFERENCES public.plans(code),
  status text NOT NULL DEFAULT 'active',
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own subscription" ON public.subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Super admin manages subscriptions" ON public.subscriptions FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE TRIGGER subscriptions_set_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_subscriptions_plan ON public.subscriptions(plan_code);

-- FEATURE FLAGS
CREATE TABLE public.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  maintenance boolean NOT NULL DEFAULT false,
  daily_limit integer,
  min_plan text NOT NULL DEFAULT 'free',
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.feature_flags TO anon, authenticated;
GRANT ALL ON public.feature_flags TO service_role;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads feature flags" ON public.feature_flags FOR SELECT USING (true);
CREATE POLICY "Super admin manages feature flags" ON public.feature_flags FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE TRIGGER feature_flags_set_updated_at BEFORE UPDATE ON public.feature_flags FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.feature_flags (key, label, description, min_plan, daily_limit) VALUES
  ('ai_chat','AI Chat','Conversational NCERT tutor','free',30),
  ('ai_answers','AI Question Answering','Direct question solving','free',30),
  ('ocr','OCR / Image Question Input','Extract questions from photos and PDFs','free',5),
  ('quiz','Quiz Generator','AI generated MCQ practice','free',3),
  ('notes','Saved Notes','Save and organise notes','free',NULL),
  ('study_material','Study Material','Admin published chapter material','free',NULL),
  ('planner','Study Planner','AI timetable and tasks','free',NULL),
  ('reminders','Study Reminders','Push and scheduled reminders','free',NULL),
  ('memory','AI Memory','Personalised long term memory','free',NULL),
  ('web_search','Live Web Search','Up-to-date grounded answers','free',NULL),
  ('chat_history','Chat History','Threaded conversation history','free',NULL);

-- CURRICULUM
CREATE TABLE public.classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level integer NOT NULL UNIQUE,
  name text NOT NULL,
  published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.classes TO anon, authenticated;
GRANT ALL ON public.classes TO service_role;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads published classes" ON public.classes FOR SELECT USING (published = true);
CREATE POLICY "Super admin manages classes" ON public.classes FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE TRIGGER classes_set_updated_at BEFORE UPDATE ON public.classes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.classes (level, name, sort_order) VALUES
  (5,'Class 5',5),(6,'Class 6',6),(7,'Class 7',7),(8,'Class 8',8),
  (9,'Class 9',9),(10,'Class 10',10),(11,'Class 11',11),(12,'Class 12',12);

CREATE TABLE public.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  name text NOT NULL,
  board text NOT NULL DEFAULT 'NCERT',
  language text NOT NULL DEFAULT 'english',
  published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subjects TO anon, authenticated;
GRANT ALL ON public.subjects TO service_role;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads published subjects" ON public.subjects FOR SELECT USING (published = true);
CREATE POLICY "Super admin manages subjects" ON public.subjects FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE TRIGGER subjects_set_updated_at BEFORE UPDATE ON public.subjects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_subjects_class ON public.subjects(class_id);

CREATE TABLE public.chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  name text NOT NULL,
  topics text[] NOT NULL DEFAULT '{}'::text[],
  published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.chapters TO anon, authenticated;
GRANT ALL ON public.chapters TO service_role;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads published chapters" ON public.chapters FOR SELECT USING (published = true);
CREATE POLICY "Super admin manages chapters" ON public.chapters FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE TRIGGER chapters_set_updated_at BEFORE UPDATE ON public.chapters FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_chapters_subject ON public.chapters(subject_id);

-- STUDY MATERIAL (admin authored)
CREATE TABLE public.study_material (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  kind text NOT NULL DEFAULT 'notes',
  class_level integer,
  subject text,
  chapter text,
  language text NOT NULL DEFAULT 'english',
  published boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.study_material TO anon, authenticated;
GRANT ALL ON public.study_material TO service_role;
ALTER TABLE public.study_material ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads published material" ON public.study_material FOR SELECT USING (published = true);
CREATE POLICY "Super admin reads all material" ON public.study_material FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()));
CREATE POLICY "Super admin manages material" ON public.study_material FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE TRIGGER study_material_set_updated_at BEFORE UPDATE ON public.study_material FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ADMIN QUESTION BANK
CREATE TABLE public.admin_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text,
  class_level integer,
  subject text,
  chapter text,
  difficulty text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'published',
  ask_count integer NOT NULL DEFAULT 0,
  reported boolean NOT NULL DEFAULT false,
  report_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_questions TO anon, authenticated;
GRANT ALL ON public.admin_questions TO service_role;
ALTER TABLE public.admin_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads published questions" ON public.admin_questions FOR SELECT USING (status = 'published');
CREATE POLICY "Super admin manages questions" ON public.admin_questions FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE TRIGGER admin_questions_set_updated_at BEFORE UPDATE ON public.admin_questions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- FEATURE USAGE / AI USAGE / OCR
CREATE TABLE public.feature_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  feature_key text NOT NULL,
  count integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.feature_usage TO authenticated;
GRANT ALL ON public.feature_usage TO service_role;
ALTER TABLE public.feature_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users insert own usage" ON public.feature_usage FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users read own usage" ON public.feature_usage FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Super admin manages usage" ON public.feature_usage FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE INDEX idx_feature_usage_created ON public.feature_usage(created_at);
CREATE INDEX idx_feature_usage_key ON public.feature_usage(feature_key);

CREATE TABLE public.ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  provider text NOT NULL DEFAULT 'lovable-ai',
  model text NOT NULL,
  kind text NOT NULL DEFAULT 'chat',
  input_tokens integer NOT NULL DEFAULT 0,
  output_tokens integer NOT NULL DEFAULT 0,
  duration_ms integer,
  success boolean NOT NULL DEFAULT true,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ai_usage TO authenticated;
GRANT ALL ON public.ai_usage TO service_role;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own ai usage" ON public.ai_usage FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Super admin manages ai usage" ON public.ai_usage FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE INDEX idx_ai_usage_created ON public.ai_usage(created_at);

CREATE TABLE public.ai_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  model text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  priority integer NOT NULL DEFAULT 1,
  daily_request_limit integer,
  timeout_ms integer NOT NULL DEFAULT 60000,
  max_retries integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.ai_providers TO service_role;
GRANT SELECT ON public.ai_providers TO authenticated;
ALTER TABLE public.ai_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admin manages providers" ON public.ai_providers FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE TRIGGER ai_providers_set_updated_at BEFORE UPDATE ON public.ai_providers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
INSERT INTO public.ai_providers (name, model, priority) VALUES
  ('Lovable AI Gateway','google/gemini-3.6-flash',1);

CREATE TABLE public.ocr_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  file_name text,
  file_size_kb integer,
  mime_type text,
  success boolean NOT NULL DEFAULT true,
  error text,
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.ocr_requests TO authenticated;
GRANT ALL ON public.ocr_requests TO service_role;
ALTER TABLE public.ocr_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users insert own ocr" ON public.ocr_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users read own ocr" ON public.ocr_requests FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Super admin manages ocr" ON public.ocr_requests FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE INDEX idx_ocr_created ON public.ocr_requests(created_at);

-- FILES
CREATE TABLE public.files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'user_upload',
  mime_type text,
  size_kb integer NOT NULL DEFAULT 0,
  url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.files TO authenticated;
GRANT ALL ON public.files TO service_role;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own files" ON public.files FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Super admin manages files" ON public.files FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  kind text NOT NULL DEFAULT 'announcement',
  status text NOT NULL DEFAULT 'draft',
  target_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  scheduled_at timestamptz,
  sent_at timestamptz,
  expires_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read their notifications" ON public.notifications FOR SELECT TO authenticated
  USING (status = 'sent' AND (target_user_id IS NULL OR target_user_id = auth.uid())
         AND (expires_at IS NULL OR expires_at > now()));
CREATE POLICY "Super admin manages notifications" ON public.notifications FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE TRIGGER notifications_set_updated_at BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- AUDIT LOGS
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_email text,
  action text NOT NULL,
  target_type text,
  target_id text,
  previous_value jsonb,
  new_value jsonb,
  result text NOT NULL DEFAULT 'success',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admin reads audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()));
CREATE POLICY "Super admin writes audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (public.is_super_admin(auth.uid()));
CREATE INDEX idx_audit_created ON public.audit_logs(created_at DESC);

-- SECURITY EVENTS
CREATE TABLE public.security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text,
  event_type text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  detail text,
  ip text,
  user_agent text,
  reviewed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.security_events TO authenticated;
GRANT ALL ON public.security_events TO service_role;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admin manages security events" ON public.security_events FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE INDEX idx_security_created ON public.security_events(created_at DESC);

-- ADVERTISEMENTS
CREATE TABLE public.ad_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  placement text NOT NULL UNIQUE,
  enabled boolean NOT NULL DEFAULT false,
  frequency integer NOT NULL DEFAULT 5,
  show_to_free boolean NOT NULL DEFAULT true,
  show_to_premium boolean NOT NULL DEFAULT false,
  impressions integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  revenue_inr numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ad_settings TO anon, authenticated;
GRANT ALL ON public.ad_settings TO service_role;
ALTER TABLE public.ad_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads ad settings" ON public.ad_settings FOR SELECT USING (true);
CREATE POLICY "Super admin manages ads" ON public.ad_settings FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE TRIGGER ad_settings_set_updated_at BEFORE UPDATE ON public.ad_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
INSERT INTO public.ad_settings (placement, enabled) VALUES
  ('chat_footer', false), ('dashboard_banner', false), ('notes_list', false), ('quiz_result', false);

-- SYSTEM SETTINGS
CREATE TABLE public.system_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.system_settings TO anon, authenticated;
GRANT ALL ON public.system_settings TO service_role;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads system settings" ON public.system_settings FOR SELECT USING (true);
CREATE POLICY "Super admin manages system settings" ON public.system_settings FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE TRIGGER system_settings_set_updated_at BEFORE UPDATE ON public.system_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
INSERT INTO public.system_settings (key, value) VALUES
  ('general', '{"app_name":"AskNCERT","logo_url":"","maintenance_message":"AskNCERT is under maintenance. We will be back shortly."}'::jsonb),
  ('user', '{"registrations_enabled":true,"email_verification_required":false,"upload_mb_limit":10,"session_hours":720}'::jsonb),
  ('ai', '{"default_model":"google/gemini-3.6-flash","timeout_ms":60000,"max_retries":1,"daily_request_limit":0}'::jsonb),
  ('notifications', '{"push_enabled":true,"email_enabled":false}'::jsonb);

-- EMERGENCY MODE
CREATE TABLE public.emergency_settings (
  id boolean PRIMARY KEY DEFAULT true,
  maintenance_mode boolean NOT NULL DEFAULT false,
  ai_disabled boolean NOT NULL DEFAULT false,
  ocr_disabled boolean NOT NULL DEFAULT false,
  uploads_disabled boolean NOT NULL DEFAULT false,
  registrations_disabled boolean NOT NULL DEFAULT false,
  message text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT emergency_singleton CHECK (id)
);
GRANT SELECT ON public.emergency_settings TO anon, authenticated;
GRANT ALL ON public.emergency_settings TO service_role;
ALTER TABLE public.emergency_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads emergency settings" ON public.emergency_settings FOR SELECT USING (true);
CREATE POLICY "Super admin manages emergency settings" ON public.emergency_settings FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE TRIGGER emergency_set_updated_at BEFORE UPDATE ON public.emergency_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
INSERT INTO public.emergency_settings (id) VALUES (true);
