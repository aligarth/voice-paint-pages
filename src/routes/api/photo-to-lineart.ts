import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/photo-to-lineart")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { image, stream = true } = (await request.json()) as {
          image?: string;
          stream?: boolean;
        };
        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        if (!image || typeof image !== "string" || !image.startsWith("data:image/")) {
          return new Response("Missing photo", { status: 400 });
        }

        const instruction =
          "Turn this photo into a coloring book page: clean bold black outline line art of the " +
          "same subject and composition, pure white background, no shading, no grey, no color, " +
          "no text, large simple enclosed areas that are easy to color in, printable coloring page.";

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3-pro-image",
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: instruction },
                  { type: "image_url", image_url: { url: image } },
                ],
              },
            ],
            modalities: ["image", "text"],
            ...(stream ? { stream: true } : {}),
          }),
        });

        if (!upstream.ok || !upstream.body) {
          return new Response(await upstream.text(), { status: upstream.status });
        }
        if (!stream) {
          return new Response(upstream.body, {
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response(upstream.body, {
          headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
        });
      },
    },
  },
});
