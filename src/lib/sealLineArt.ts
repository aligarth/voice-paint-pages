/**
 * Turns raw AI line art into a page whose shapes are actually closed, so the
 * bucket fill can never leak. Runs in the browser on a canvas.
 */

const MAX_SIDE = 1400;

/** Anything darker than this on the flattened image counts as an outline. */
const LINE_LUM = 200;

/** Longest break (in px) the endpoint bridger will join. */
const BRIDGE_MAX = 26;

/** Grows a binary mask by `radius` px (8-neighbour / square kernel). */
function dilate(mask: Uint8Array, w: number, h: number, radius: number) {
  let current = mask;
  for (let step = 0; step < radius; step++) {
    const next = new Uint8Array(current);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (current[i]) continue;
        let hit = false;
        for (let dy = -1; dy <= 1 && !hit; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
            if (current[ny * w + nx]) {
              hit = true;
              break;
            }
          }
        }
        if (hit) next[i] = 1;
      }
    }
    current = next;
  }
  return current;
}

/** Shrinks a binary mask by `radius` px (8-neighbour); page edge counts as outside. */
function erode(mask: Uint8Array, w: number, h: number, radius: number) {
  let current = mask;
  for (let step = 0; step < radius; step++) {
    const next = new Uint8Array(current);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (!current[i]) continue;
        let keep = true;
        for (let dy = -1; dy <= 1 && keep; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= w || ny >= h || !current[ny * w + nx]) {
              keep = false;
              break;
            }
          }
        }
        if (!keep) next[i] = 0;
      }
    }
    current = next;
  }
  return current;
}

function neighbourCount(mask: Uint8Array, w: number, h: number, x: number, y: number) {
  let count = 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      if (mask[ny * w + nx]) count++;
    }
  }
  return count;
}

/** Draws a filled line of the given radius into the mask. */
function stroke(
  mask: Uint8Array,
  w: number,
  h: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  radius: number,
) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let s = 0; s <= steps; s++) {
    const x = Math.round(x0 + ((x1 - x0) * s) / steps);
    const y = Math.round(y0 + ((y1 - y0) * s) / steps);
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        mask[ny * w + nx] = 1;
      }
    }
  }
}

/**
 * Joins dangling line ends to the nearest nearby line so open contours close.
 * Endpoints are line pixels with a single 8-neighbour.
 */
function bridgeEndpoints(mask: Uint8Array, w: number, h: number, lineRadius: number) {
  const ends: Array<[number, number]> = [];
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      if (!mask[y * w + x]) continue;
      if (neighbourCount(mask, w, h, x, y) <= 1) ends.push([x, y]);
    }
  }
  // Cap the work on very busy pages.
  const list = ends.length > 4000 ? ends.slice(0, 4000) : ends;
  for (const [x, y] of list) {
    let best: [number, number] | null = null;
    let bestDist = Infinity;
    for (let dy = -BRIDGE_MAX; dy <= BRIDGE_MAX; dy++) {
      for (let dx = -BRIDGE_MAX; dx <= BRIDGE_MAX; dx++) {
        const dist = Math.hypot(dx, dy);
        // Skip our own line's immediate neighbourhood.
        if (dist < lineRadius * 2 + 3 || dist > BRIDGE_MAX || dist >= bestDist) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        if (!mask[ny * w + nx]) continue;
        bestDist = dist;
        best = [nx, ny];
      }
    }
    if (best) stroke(mask, w, h, x, y, best[0], best[1], Math.max(0, lineRadius - 1));
  }
}

/**
 * True when white paper starting from the page corners can reach the middle of
 * the picture — the signature of a shape that is still open.
 */
function leaksToCentre(mask: Uint8Array, w: number, h: number, margin = 0) {
  const seen = new Uint8Array(w * h);
  const stack: number[] = [];
  const push = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = y * w + x;
    if (mask[i] || seen[i]) return;
    seen[i] = 1;
    stack.push(i);
  };
  // Seed just inside the sealed frame, not on the page edge itself.
  const m = Math.min(margin, Math.floor(Math.min(w, h) / 3));
  for (let x = m; x < w - m; x++) {
    push(x, m);
    push(x, h - 1 - m);
  }
  for (let y = m; y < h - m; y++) {
    push(m, y);
    push(w - 1 - m, y);
  }

  const cx0 = Math.round(w * 0.45);
  const cx1 = Math.round(w * 0.55);
  const cy0 = Math.round(h * 0.45);
  const cy1 = Math.round(h * 0.55);
  let centreHits = 0;
  const centreArea = Math.max(1, (cx1 - cx0) * (cy1 - cy0));
  while (stack.length) {
    const i = stack.pop()!;
    const x = i % w;
    const y = (i - x) / w;
    if (x >= cx0 && x <= cx1 && y >= cy0 && y <= cy1) {
      centreHits++;
      if (centreHits / centreArea > 0.5) return true;
    }
    if (x > 0) push(x - 1, y);
    if (x < w - 1) push(x + 1, y);
    if (y > 0) push(x, y - 1);
    if (y < h - 1) push(x, y + 1);
  }
  return false;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read that page"));
    img.src = src;
  });
}
/** Seals diagonal-only line contacts so a 4-way flood fill can't slip through. */
function plugDiagonals(mask: Uint8Array, w: number, h: number) {
  for (let y = 0; y < h - 1; y++) {
    for (let x = 0; x < w - 1; x++) {
      const a = mask[y * w + x];
      const b = mask[y * w + x + 1];
      const c = mask[(y + 1) * w + x];
      const d = mask[(y + 1) * w + x + 1];
      if (a && d && !b && !c) mask[y * w + x + 1] = 1;
      else if (b && c && !a && !d) mask[y * w + x] = 1;
    }
  }
}


/** One sealing pass at the given strength. Returns the mask and canvas size. */
function sealPass(px: Uint8ClampedArray, w: number, h: number, strength: number) {
  const mask = new Uint8Array(w * h);
  for (let i = 0; i < mask.length; i++) {
    const o = i * 4;
    const r = px[o] ?? 255;
    const g = px[o + 1] ?? 255;
    const b = px[o + 2] ?? 255;
    const a = px[o + 3] ?? 255;
    const lum = a < 32 ? 255 : 0.299 * r + 0.587 * g + 0.114 * b;
    if (lum < LINE_LUM) mask[i] = 1;
  }

  // Morphological close with a square kernel: bridges gaps up to 2x strength
  // while keeping the original line weight.
  const closed = erode(dilate(mask, w, h, strength), w, h, strength);
  for (let i = 0; i < mask.length; i++) if (closed[i]) mask[i] = 1;

  bridgeEndpoints(mask, w, h, 1);

  // Lines that only touch diagonally still let a 4-way flood fill squeeze
  // through the corner, so plug every diagonal staircase.
  plugDiagonals(mask, w, h);



  // Closed frame just inside the page edge so paint can never run off.
  const inset = frameInset(w, h);
  const frame = 3;
  stroke(mask, w, h, inset, inset, w - 1 - inset, inset, frame);
  stroke(mask, w, h, w - 1 - inset, inset, w - 1 - inset, h - 1 - inset, frame);
  stroke(mask, w, h, w - 1 - inset, h - 1 - inset, inset, h - 1 - inset, frame);
  stroke(mask, w, h, inset, h - 1 - inset, inset, inset, frame);
  plugDiagonals(mask, w, h);

  return mask;
}

/** Distance from the page edge to the sealed frame. */
function frameInset(w: number, h: number) {
  return Math.max(3, Math.round(Math.min(w, h) * 0.012));
}


/**
 * Cleans a generated coloring page: pure black lines on pure white paper, gaps
 * closed, dangling ends bridged and a sealed frame around the page. Falls back
 * to the original image if anything goes wrong.
 */
export async function sealLineArt(src: string): Promise<string> {
  if (typeof document === "undefined" || !src) return src;
  try {
    const img = await loadImage(src);
    const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return src;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h);

    // Escalate the sealing strength until paper outside the drawing can no
    // longer reach the middle of the page.
    const margin = frameInset(w, h) + 12;
    let mask = sealPass(data.data, w, h, 2);
    for (const strength of [3, 4, 6, 8, 11, 14, 18]) {
      if (!leaksToCentre(mask, w, h, margin)) break;
      mask = sealPass(data.data, w, h, strength);
    }




    const out = ctx.createImageData(w, h);
    for (let i = 0; i < mask.length; i++) {
      const o = i * 4;
      const v = mask[i] ? 0 : 255;
      out.data[o] = v;
      out.data[o + 1] = v;
      out.data[o + 2] = v;
      out.data[o + 3] = 255;
    }
    ctx.putImageData(out, 0, 0);
    return canvas.toDataURL("image/png");
  } catch {
    return src;
  }
}
