-- Per-account coloring library: each signed-in person's pages, books, plan and monthly counters live in their own rows.

CREATE TABLE public.books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'My coloring book',
  kind text NOT NULL DEFAULT 'book',
  page_count integer NOT NULL DEFAULT 0,
  share_id text,
  saved_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT books_kind_check CHECK (kind IN ('page', 'book'))
);

CREATE INDEX books_owner_idx ON public.books (owner_id, saved_at DESC);

CREATE TABLE public.book_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES public.books (id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  position integer NOT NULL,
  title text NOT NULL DEFAULT '',
  art text NOT NULL,
  paint text,
  CONSTRAINT book_pages_position_check CHECK (position >= 0),
  CONSTRAINT book_pages_book_position_key UNIQUE (book_id, position)
);

CREATE INDEX book_pages_owner_idx ON public.book_pages (owner_id);
CREATE INDEX book_pages_book_idx ON public.book_pages (book_id, position);

CREATE TABLE public.usage (
  owner_id uuid PRIMARY KEY,
  month text NOT NULL,
  pages integer NOT NULL DEFAULT 0,
  books integer NOT NULL DEFAULT 0,
  CONSTRAINT usage_pages_check CHECK (pages >= 0),
  CONSTRAINT usage_books_check CHECK (books >= 0)
);

CREATE TABLE public.account_plans (
  owner_id uuid PRIMARY KEY,
  plan text NOT NULL DEFAULT 'free',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT account_plans_plan_check CHECK (plan IN ('free', 'standard', 'premium'))
);

-- Data API access (Supabase grants no default privileges on public).
GRANT SELECT, INSERT, UPDATE, DELETE ON public.books TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.book_pages TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.usage TO authenticated;
GRANT SELECT ON public.account_plans TO authenticated;
GRANT ALL ON public.books TO service_role;
GRANT ALL ON public.book_pages TO service_role;
GRANT ALL ON public.usage TO service_role;
GRANT ALL ON public.account_plans TO service_role;

-- Every row is visible to the person it belongs to, and to nobody else.
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners can read their books" ON public.books
  FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "owners can add their books" ON public.books
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "owners can change their books" ON public.books
  FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "owners can delete their books" ON public.books
  FOR DELETE TO authenticated USING (owner_id = auth.uid());

CREATE POLICY "owners can read their pages" ON public.book_pages
  FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "owners can add their pages" ON public.book_pages
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "owners can change their pages" ON public.book_pages
  FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "owners can delete their pages" ON public.book_pages
  FOR DELETE TO authenticated USING (owner_id = auth.uid());

CREATE POLICY "owners can read their counters" ON public.usage
  FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "owners can start their counters" ON public.usage
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "owners can update their counters" ON public.usage
  FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "owners can read their plan" ON public.account_plans
  FOR SELECT TO authenticated USING (owner_id = auth.uid());
