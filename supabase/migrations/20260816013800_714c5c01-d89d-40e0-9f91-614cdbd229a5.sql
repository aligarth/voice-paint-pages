CREATE TABLE public.shared_galleries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'My coloring book',
  pages jsonb NOT NULL DEFAULT '[]'::jsonb,
  view_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.shared_galleries TO anon;
GRANT SELECT, INSERT ON public.shared_galleries TO authenticated;
GRANT ALL ON public.shared_galleries TO service_role;

ALTER TABLE public.shared_galleries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view shared galleries"
  ON public.shared_galleries
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can create a shared gallery"
  ON public.shared_galleries
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);