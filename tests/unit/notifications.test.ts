import { describe, it, expect } from "vitest";
import {
  formatPendingMessage,
  hasNotifiableActivity,
  type PendingSummary,
} from "@/lib/notifications";

const base: PendingSummary = {
  savedToday: 0,
  pending: 0,
  forgottenGems: 0,
  readyToBuild: 0,
  topPending: [],
};

describe("notifications", () => {
  it("reports nothing-pending cleanly", () => {
    expect(hasNotifiableActivity(base)).toBe(false);
    const m = formatPendingMessage(base);
    expect(m.title).toBe("Musemint");
    expect(m.body).toMatch(/nothing pending/i);
  });

  it("leads with forgotten gems when present", () => {
    const s = { ...base, pending: 12, forgottenGems: 3, readyToBuild: 2 };
    expect(hasNotifiableActivity(s)).toBe(true);
    const m = formatPendingMessage(s);
    expect(m.title).toMatch(/3 forgotten gems waiting/);
    expect(m.body).toContain("12 pending");
    expect(m.body).toContain("3 older than 5 days");
    expect(m.body).toContain("2 ready to build");
  });

  it("falls back to pending count when no gems", () => {
    const s = { ...base, pending: 1 };
    const m = formatPendingMessage(s);
    expect(m.title).toBe("1 saved idea to review");
  });

  it("quotes the oldest pending item as a hook", () => {
    const s = {
      ...base,
      pending: 2,
      topPending: [{ id: "x", title: "Build a YouTube summarizer" }],
    };
    const m = formatPendingMessage(s);
    expect(m.body).toContain('"Build a YouTube summarizer"');
  });

  it("singularizes correctly", () => {
    expect(formatPendingMessage({ ...base, forgottenGems: 1 }).title).toBe(
      "1 forgotten gem waiting",
    );
  });
});
