import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition, openBrowser } from "@remotion/renderer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const compositions = [
  { id: "vertical", suffix: "vertical" },
  { id: "square", suffix: "square" },
  { id: "horizontal", suffix: "horizontal" },
];

const bundled = await bundle({
  entryPoint: path.resolve(__dirname, "../src/index.ts"),
  webpackOverride: (config) => config,
});

const browser = await openBrowser("chrome", {
  browserExecutable: process.env.PUPPETEER_EXECUTABLE_PATH ?? "/bin/chromium",
  chromiumOptions: {
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  },
  chromeMode: "chrome-for-testing",
});

for (const comp of compositions) {
  const composition = await selectComposition({
    serveUrl: bundled,
    id: comp.id,
    puppeteerInstance: browser,
  });

  const outputLocation = `/mnt/documents/color-my-world-promo-${comp.suffix}.mp4`;
  await renderMedia({
    composition,
    serveUrl: bundled,
    codec: "h264",
    outputLocation,
    puppeteerInstance: browser,
    muted: true,
    concurrency: 1,
  });

  const stats = fs.statSync(outputLocation);
  console.log(`Rendered ${comp.id}: ${outputLocation} (${Math.round(stats.size / 1024 / 1024)} MB)`);
}

await browser.close({ silent: false });
