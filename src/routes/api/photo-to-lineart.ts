import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/photo-to-lineart")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { image, stream = true, variant } = (await request.json()) as {
          image?: string;
          stream?: boolean;
          variant?: string;
        };
        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        if (!image || typeof image !== "string" || !image.startsWith("data:image/")) {
          return new Response("Missing photo", { status: 400 });
        }

        const instruction =
          "Turn this photo into a coloring book page: clean bold black outline line art of the " +
          "same subject and composition. CRITICAL: every outline must be one continuous unbroken " +
          "loop - all shapes fully closed, every line meets another line, absolutely no gaps, no " +
          "breaks, no open ends, no sketchy or dashed strokes, so each area is completely sealed " +
          "and can be filled with color without leaking into neighboring areas. " +
          "Uniform line thickness, pure white background, no shading, no hatching, no grey, no " +
          "color, no text, large simple enclosed areas that are easy to color in, printable " +
          "coloring page. " +
          "Keep the rectangular border already present around the photo: reproduce it as four " +
          "straight, unbroken, uniform black lines forming a fully closed frame at the edge of " +
          "the page. If the photo has no border, add one. Do not crop the border away, do not " +
          "leave gaps in the corners, and do not add any extra frames or decoration.";

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
