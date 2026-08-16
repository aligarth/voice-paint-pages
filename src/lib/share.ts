import { supabase } from "@/integrations/supabase/client";

export type SharedPage = {
  src: string;
  title: string;
  paint?: string | null;
};

export type SharedGallery = {
  id: string;
  title: string;
  pages: SharedPage[];
  view_count: number;
  created_at: string;
};

export async function createSharedGallery(
  title: string,
  pages: SharedPage[],
): Promise<{ id: string; url: string }> {
  const { data, error } = await supabase
    .from("shared_galleries")
    .insert({ title, pages })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create gallery");
  }

  const url = `${window.location.origin}/gallery/${data.id}`;
  return { id: data.id, url };
}

export async function fetchSharedGallery(id: string): Promise<SharedGallery | null> {
  const { data, error } = await supabase
    .from("shared_galleries")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as SharedGallery;
}

export async function incrementGalleryViews(id: string) {
  // Views are incremented server-side via a public API route to keep anon writes minimal.
  await fetch(`/api/public/gallery/${id}/view`, { method: "POST" });
}
