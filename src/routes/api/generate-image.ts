import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/generate-image")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { prompt, stream = true } = (await request.json()) as {
          prompt: string;
          stream?: boolean;
        };
        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        if (!prompt || typeof prompt !== "string") {
          return new Response("Missing prompt", { status: 400 });
        }

        const fullPrompt =
          `A coloring book page: clean black outline line art of ${prompt}. ` +
          `Bold even black contour lines, pure white background, no shading, no grey, no color, ` +
          `no text, large simple enclosed areas that are easy to color in, centered composition, ` +
          `printable coloring book illustration.`;

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3-pro-image",
            messages: [{ role: "user", content: fullPrompt }],
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
