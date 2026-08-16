import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

export const Route = createFileRoute("/api/public/gallery/$id/view")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const url = new URL(request.url);
        const projectId = url.hostname.includes("lovable.app")
          ? url.hostname.split("--")[1]?.split("-")[0]
          : import.meta.env["VITE_SUPABASE_PROJECT_ID"];

        const supabaseUrl = `https://fhhfdzskovbwmqirgvsk.supabase.co`;
        const supabaseKey = process.env["SUPABASE_SERVICE_ROLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"]!;

        const supabase = createClient(supabaseUrl, supabaseKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });

        const { error } = await supabase.rpc("increment_shared_gallery_views", {
          gallery_id: params.id,
        });

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ ok: true }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
