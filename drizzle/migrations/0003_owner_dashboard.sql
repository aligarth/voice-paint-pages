CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users can read their own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Owner-only customer numbers. Refuses anyone who isn't an admin.
CREATE OR REPLACE FUNCTION public.admin_customer_stats(_days integer DEFAULT 30)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE
  since timestamptz := now() - make_interval(days => greatest(1, least(_days, 3650)));
  result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;
  SELECT jsonb_build_object(
    'signups_total', (SELECT count(*) FROM auth.users),
    'signups_period', (SELECT count(*) FROM auth.users WHERE created_at >= since),
    'confirmed_total', (SELECT count(*) FROM auth.users WHERE email_confirmed_at IS NOT NULL),
    'confirmed_period', (SELECT count(*) FROM auth.users WHERE email_confirmed_at >= since),
    'paid_by_plan', COALESCE((SELECT jsonb_object_agg(plan, n) FROM (
        SELECT plan, count(*) n FROM public.account_plans WHERE plan <> 'free' GROUP BY plan) p), '{}'::jsonb),
    'upgrades_period', (SELECT count(*) FROM public.account_plans WHERE plan <> 'free' AND updated_at >= since),
    'printed_books_total', (SELECT count(*) FROM public.book_purchases),
    'printed_books_period', (SELECT count(*) FROM public.book_purchases WHERE created_at >= since),
    'recent', COALESCE((SELECT jsonb_agg(r) FROM (
        SELECT u.email, u.created_at, u.email_confirmed_at IS NOT NULL AS confirmed,
               COALESCE(ap.plan, 'free') AS plan, ap.environment
        FROM auth.users u LEFT JOIN public.account_plans ap ON ap.owner_id = u.id
        ORDER BY u.created_at DESC LIMIT 25) r), '[]'::jsonb)
  ) INTO result;
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_customer_stats(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_customer_stats(integer) TO authenticated;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'alimagarsa@icloud.com'
ON CONFLICT DO NOTHING;