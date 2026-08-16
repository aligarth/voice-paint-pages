type OnImage = (dataUrl: string, isFinal: boolean) => void;

function collectImages(payload: unknown): string[] {
  const out: string[] = [];
  const walk = (node: unknown) => {
    if (!node) return;
    if (typeof node === "string") {
      if (node.startsWith("data:image/")) out.push(node);
      return;
    }
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (typeof node === "object") {
      const record = node as Record<string, unknown>;
      const b64 = record["b64_json"];
      if (typeof b64 === "string" && b64.length > 100) {
        out.push(`data:image/png;base64,${b64}`);
      }
      for (const [key, value] of Object.entries(record)) {
        if (key === "b64_json") continue;
        walk(value);
      }
    }
  };
  walk(payload);
  return out;
}

async function readSse(res: Response, onImage: OnImage): Promise<boolean> {
  if (!res.body) return false;
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  let got = false;
  let last: string | null = null;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";
    for (const frame of frames) {
      for (const line of frame.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (!data || data === "[DONE]") continue;
        let parsed: unknown;
        try {
          parsed = JSON.parse(data);
        } catch {
          continue;
        }
        const images = collectImages(parsed);
        const latest = images[images.length - 1];
        if (latest) {
          last = latest;
          got = true;
          onImage(latest, false);
        }
      }
    }
  }
  if (got && last) onImage(last, true);
  return got;
}

export async function streamImage(
  endpoint: string,
  prompt: string,
  onImage: OnImage,
): Promise<void> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => `Request failed (${res.status})`));

  const got = await readSse(res, onImage);
  if (got) return;

  // Fallback: retry once without streaming.
  const retry = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, stream: false }),
  });
  if (!retry.ok) throw new Error(await retry.text().catch(() => "Image generation failed"));
  const json = await retry.json();
  const images = collectImages(json);
  const final = images[images.length - 1];
  if (!final) throw new Error("No image was returned");
  onImage(final, true);
}

export async function streamImageFromPhoto(
  endpoint: string,
  image: string,
  onImage: OnImage,
): Promise<void> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image }),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => `Request failed (${res.status})`));

  const got = await readSse(res, onImage);
  if (got) return;

  const retry = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image, stream: false }),
  });
  if (!retry.ok) throw new Error(await retry.text().catch(() => "Image generation failed"));
  const json = await retry.json();
  const images = collectImages(json);
  const final = images[images.length - 1];
  if (!final) throw new Error("No image was returned");
  onImage(final, true);
}
