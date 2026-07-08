
-- Enums
DO $$ BEGIN
  CREATE TYPE public.task_priority AS ENUM ('low','med','high');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.task_status AS ENUM ('pending','done','missed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.goal_kind AS ENUM ('weekly','monthly');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.reminder_repeat AS ENUM ('none','daily','weekly');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Exams
CREATE TABLE public.exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  subject text,
  exam_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exams TO authenticated;
GRANT ALL ON public.exams TO service_role;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own exams" ON public.exams FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER exams_set_updated_at BEFORE UPDATE ON public.exams FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Planner tasks
CREATE TABLE public.planner_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  subject text,
  priority public.task_priority NOT NULL DEFAULT 'med',
  scheduled_for date NOT NULL,
  scheduled_time time,
  duration_min integer NOT NULL DEFAULT 30,
  status public.task_status NOT NULL DEFAULT 'pending',
  exam_id uuid REFERENCES public.exams(id) ON DELETE SET NULL,
  is_revision boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.planner_tasks TO authenticated;
GRANT ALL ON public.planner_tasks TO service_role;
ALTER TABLE public.planner_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own tasks" ON public.planner_tasks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX planner_tasks_user_date_idx ON public.planner_tasks(user_id, scheduled_for);
CREATE TRIGGER planner_tasks_set_updated_at BEFORE UPDATE ON public.planner_tasks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Study sessions
CREATE TABLE public.study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subject text,
  kind text NOT NULL DEFAULT 'chat',
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  duration_min integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_sessions TO authenticated;
GRANT ALL ON public.study_sessions TO service_role;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own sessions" ON public.study_sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX study_sessions_user_started_idx ON public.study_sessions(user_id, started_at DESC);

-- Goals
CREATE TABLE public.goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind public.goal_kind NOT NULL DEFAULT 'weekly',
  target_min integer NOT NULL DEFAULT 300,
  subject text,
  period_start date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.goals TO authenticated;
GRANT ALL ON public.goals TO service_role;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own goals" ON public.goals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER goals_set_updated_at BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Achievements
CREATE TABLE public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  code text NOT NULL,
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, code)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.achievements TO authenticated;
GRANT ALL ON public.achievements TO service_role;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own achievements" ON public.achievements FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Extend reminders
ALTER TABLE public.reminders
  ADD COLUMN IF NOT EXISTS repeat public.reminder_repeat NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS push_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notify_at timestamptz;
