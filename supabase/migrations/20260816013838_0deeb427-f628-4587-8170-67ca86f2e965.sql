CREATE OR REPLACE FUNCTION public.increment_shared_gallery_views(gallery_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.shared_galleries
  SET view_count = view_count + 1
  WHERE id = gallery_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_shared_gallery_views(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_shared_gallery_views(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_shared_gallery_views(uuid) TO service_role;