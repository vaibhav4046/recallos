import { describe, it, expect } from "vitest";
import { buildSearchFilter } from "@/lib/queries";

describe("buildSearchFilter", () => {
  it("returns null for empty / whitespace queries", () => {
    expect(buildSearchFilter("")).toBeNull();
    expect(buildSearchFilter("   \t  ")).toBeNull();
  });

  it("lowercases tokens and matches case-insensitively", () => {
    // Regression: "never gonna" must be able to find "Never Gonna Give You Up".
    const and = buildSearchFilter("Never Gonna");
    expect(and).toHaveLength(2);
    for (const clause of and!) {
      for (const field of clause.OR) {
        const [[, cond]] = Object.entries(field);
        expect(cond).toMatchObject({ mode: "insensitive" });
        expect((cond as { contains: string }).contains).toBe(
          (cond as { contains: string }).contains.toLowerCase(),
        );
      }
    }
    const firstToken = (Object.values(and![0].OR[0])[0] as { contains: string }).contains;
    const secondToken = (Object.values(and![1].OR[0])[0] as { contains: string }).contains;
    expect([firstToken, secondToken]).toEqual(["never", "gonna"]);
  });

  it("ANDs tokens so loose, out-of-order keywords still match", () => {
    const and = buildSearchFilter("rick astley");
    expect(and).toHaveLength(2); // both tokens required
  });

  it("searches across all memory fields incl. rawContent", () => {
    const and = buildSearchFilter("dashboard");
    const fields = and![0].OR.map((o) => Object.keys(o)[0]);
    expect(fields).toEqual(
      expect.arrayContaining([
        "title",
        "summary",
        "category",
        "sourcePlatform",
        "tagsJson",
        "rawContent",
      ]),
    );
  });

  it("caps tokens to bound query work", () => {
    const and = buildSearchFilter("a b c d e f g h i j k");
    expect(and!.length).toBeLessThanOrEqual(8);
  });
});
