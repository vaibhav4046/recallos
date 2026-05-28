// Backfill embeddings for existing captures.
// Run with: DATABASE_URL=... GOOGLE_API_KEY=... npx tsx prisma/backfill-embeddings.ts

import { PrismaClient } from "@prisma/client";
import { embedText, vectorLiteral } from "../src/lib/embed";
import { parseJson } from "../src/lib/utils";

const prisma = new PrismaClient();

async function main() {
  if (!process.env.GOOGLE_API_KEY) {
    console.error("GOOGLE_API_KEY missing — cannot embed.");
    process.exit(1);
  }
  const items = await prisma.capturedItem.findMany();
  console.log(`→ embedding ${items.length} items`);
  let ok = 0;
  let skip = 0;
  for (const it of items) {
    const tags = parseJson<string[]>(it.tagsJson, []);
    const text = [it.title, it.summary, it.rawContent, tags.join(" "), it.category]
      .filter(Boolean)
      .join("\n");
    const vec = await embedText(text);
    if (!vec) {
      skip += 1;
      console.log(`  skip ${it.id} (${it.title.slice(0, 50)})`);
      continue;
    }
    await prisma.$executeRawUnsafe(
      `UPDATE "CapturedItem" SET embedding = $1::vector WHERE id = $2`,
      vectorLiteral(vec),
      it.id,
    );
    ok += 1;
    console.log(`  ok ${it.id} (${it.title.slice(0, 50)})`);
  }
  console.log(`✓ embedded ${ok}, skipped ${skip}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
