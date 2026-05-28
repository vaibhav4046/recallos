// Rasterizes public/icon.svg into the PNG sizes the PWA manifest references.
// Run: node scripts/gen-icons.mjs
import sharp from "sharp";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pub = join(root, "public");
const svg = readFileSync(join(pub, "icon.svg"));

const tasks = [
  { name: "icon-192.png", size: 192, flatten: false },
  { name: "icon-512.png", size: 512, flatten: false },
  { name: "icon-maskable-512.png", size: 512, flatten: true },
  { name: "apple-touch-icon.png", size: 180, flatten: true },
];

for (const t of tasks) {
  let pipe = sharp(svg, { density: 512 }).resize(t.size, t.size);
  if (t.flatten) pipe = pipe.flatten({ background: "#07090d" });
  await pipe.png().toFile(join(pub, t.name));
  console.log("wrote", t.name);
}
console.log("done");
