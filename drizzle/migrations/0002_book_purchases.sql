CREATE TABLE public.book_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  book_id uuid NOT NULL,
  stripe_session_id text NOT NULL UNIQUE,
  environment text NOT NULL,
  status text NOT NULL DEFAULT 'paid',
  bonus_added boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX book_purchases_owner_book ON public.book_purchases(owner_id, book_id);
GRANT SELECT ON public.book_purchases TO authenticated;
GRANT ALL ON public.book_purchases TO service_role;
ALTER TABLE public.book_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners can read their purchases" ON public.book_purchases
  FOR SELECT TO authenticated USING (owner_id = auth.uid());