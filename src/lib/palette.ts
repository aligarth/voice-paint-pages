export type Swatch = { name: string; hex: string };

/** Classic crayon-box style named colors. */
export const CRAYON_COLORS: Swatch[] = [
  { name: "Red", hex: "#ED0A3F" },
  { name: "Scarlet", hex: "#FD0E35" },
  { name: "Brick Red", hex: "#C62D42" },
  { name: "Maroon", hex: "#C32148" },
  { name: "Cerise", hex: "#DA3287" },
  { name: "Carnation Pink", hex: "#FFA6C9" },
  { name: "Magenta", hex: "#F653A6" },
  { name: "Hot Magenta", hex: "#FF00CC" },
  { name: "Orchid", hex: "#E29CD2" },
  { name: "Plum", hex: "#843179" },
  { name: "Violet", hex: "#8359A3" },
  { name: "Purple Heart", hex: "#652DC1" },
  { name: "Indigo", hex: "#4F69C6" },
  { name: "Navy Blue", hex: "#0066CC" },
  { name: "Blue", hex: "#0066FF" },
  { name: "Cerulean", hex: "#02A4D3" },
  { name: "Sky Blue", hex: "#76D7EA" },
  { name: "Turquoise", hex: "#6CDAE7" },
  { name: "Teal", hex: "#008080" },
  { name: "Sea Green", hex: "#93DFB8" },
  { name: "Green", hex: "#01A368" },
  { name: "Forest Green", hex: "#5FA777" },
  { name: "Olive", hex: "#B5B35C" },
  { name: "Yellow Green", hex: "#C5E17A" },
  { name: "Lime", hex: "#B0E313" },
  { name: "Canary", hex: "#FFFF99" },
  { name: "Yellow", hex: "#FBE870" },
  { name: "Goldenrod", hex: "#FCD667" },
  { name: "Gold", hex: "#E6BE8A" },
  { name: "Apricot", hex: "#FDD5B1" },
  { name: "Peach", hex: "#FFCBA4" },
  { name: "Orange", hex: "#FF8833" },
  { name: "Burnt Orange", hex: "#FF7034" },
  { name: "Mahogany", hex: "#CA3435" },
  { name: "Sienna", hex: "#A0522D" },
  { name: "Brown", hex: "#AF593E" },
  { name: "Sepia", hex: "#9E5B40" },
  { name: "Tan", hex: "#D99A6C" },
  { name: "Beaver", hex: "#926F5B" },
  { name: "Copper", hex: "#DA8A67" },
  { name: "Silver", hex: "#C9C0BB" },
  { name: "Gray", hex: "#8B8680" },
  { name: "Slate", hex: "#5D6B7A" },
  { name: "Charcoal", hex: "#36454F" },
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FFFFFF" },
];

function hslToHex(h: number, s: number, l: number): string {
  const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l / 100 - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

/** Full spectrum grid: every hue, tint and shade. */
export const SPECTRUM: string[][] = (() => {
  const rows: string[][] = [];
  const lightnesses = [95, 85, 75, 65, 55, 45, 35, 25, 15];
  const grays = lightnesses.map((l) => hslToHex(0, 0, l));
  rows.push(grays);
  for (let h = 0; h < 360; h += 15) {
    rows.push(lightnesses.map((l) => hslToHex(h, l > 70 ? 90 : 78, l)));
  }
  return rows;
})();

export const BRUSH_SIZES = [3, 6, 12, 24, 40, 64, 96];
