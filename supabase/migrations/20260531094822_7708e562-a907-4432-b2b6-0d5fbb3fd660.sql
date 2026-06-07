-- New tables for v2 features

CREATE TABLE public.health_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  goal_type text NOT NULL,
  target_value text NOT NULL,
  current_value text,
  deadline date,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.health_goals TO authenticated;
GRANT ALL ON public.health_goals TO service_role;
ALTER TABLE public.health_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY hg_own ON public.health_goals FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

CREATE TABLE public.health_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_type text NOT NULL,
  title text NOT NULL,
  description text,
  date date NOT NULL,
  severity text NOT NULL DEFAULT 'low',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.health_timeline TO authenticated;
GRANT ALL ON public.health_timeline TO service_role;
ALTER TABLE public.health_timeline ENABLE ROW LEVEL SECURITY;
CREATE POLICY ht_own ON public.health_timeline FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'system',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY notif_own ON public.notifications FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

CREATE TABLE public.privacy_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  share_conditions boolean NOT NULL DEFAULT true,
  share_medications boolean NOT NULL DEFAULT true,
  share_lab_results boolean NOT NULL DEFAULT true,
  share_demographics boolean NOT NULL DEFAULT true,
  marketplace_enabled boolean NOT NULL DEFAULT true,
  data_retention_days integer NOT NULL DEFAULT 365,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.privacy_settings TO authenticated;
GRANT ALL ON public.privacy_settings TO service_role;
ALTER TABLE public.privacy_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY ps_own ON public.privacy_settings FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referred_email text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  reward_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY ref_own ON public.referrals FOR ALL TO authenticated USING (auth.uid()=referrer_id) WITH CHECK (auth.uid()=referrer_id);

CREATE TABLE public.leaderboard (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  display_name text,
  total_earned numeric NOT NULL DEFAULT 0,
  records_count integer NOT NULL DEFAULT 0,
  campaigns_joined integer NOT NULL DEFAULT 0,
  rank integer,
  badge text DEFAULT 'Rookie',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.leaderboard TO authenticated;
GRANT ALL ON public.leaderboard TO service_role;
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;
CREATE POLICY lb_read_all ON public.leaderboard FOR SELECT TO authenticated USING (true);
CREATE POLICY lb_own_write ON public.leaderboard FOR INSERT TO authenticated WITH CHECK (auth.uid()=user_id);
CREATE POLICY lb_own_update ON public.leaderboard FOR UPDATE TO authenticated USING (auth.uid()=user_id);