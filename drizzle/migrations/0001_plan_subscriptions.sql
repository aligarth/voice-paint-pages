ALTER TABLE public.account_plans
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS environment text,
  ADD COLUMN IF NOT EXISTS subscription_status text;
GRANT ALL ON public.account_plans TO service_role;
CREATE UNIQUE INDEX IF NOT EXISTS account_plans_owner_uidx ON public.account_plans(owner_id);