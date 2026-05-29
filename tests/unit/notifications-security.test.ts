import { describe, it, expect } from "vitest";
import { escapeHtml } from "@/lib/html";
import { isPushEnabled, broadcastPush } from "@/lib/push";
import { isEmailEnabled } from "@/lib/email";

describe("escapeHtml (digest-email XSS guard)", () => {
  it("neutralizes an HTML/JS injection payload", () => {
    expect(escapeHtml('<img src=x onerror="alert(1)">')).toBe(
      "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;",
    );
  });
  it("escapes ampersands and single quotes", () => {
    expect(escapeHtml("Tom & Jerry's <b>")).toBe("Tom &amp; Jerry&#39;s &lt;b&gt;");
  });
  it("leaves benign text untouched", () => {
    expect(escapeHtml("Build a habit tracker")).toBe("Build a habit tracker");
  });
});

describe("notification senders stay dormant without keys", () => {
  it("push is disabled when VAPID env is unset", () => {
    expect(isPushEnabled()).toBe(false);
  });
  it("broadcastPush is a no-op (0 sent) when disabled — never touches the DB", async () => {
    expect(await broadcastPush("user_test", { title: "t", body: "b" })).toBe(0);
  });
  it("email is disabled when RESEND env is unset", () => {
    expect(isEmailEnabled()).toBe(false);
  });
});
