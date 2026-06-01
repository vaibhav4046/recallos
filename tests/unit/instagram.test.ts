import { describe, it, expect, beforeEach } from "vitest";
import {
  isInstagramEnabled,
  instagramRedirectUri,
  buildAuthUrl,
} from "@/lib/instagram";

describe("Instagram integration (pure helpers)", () => {
  beforeEach(() => {
    delete process.env.INSTAGRAM_APP_ID;
    delete process.env.INSTAGRAM_APP_SECRET;
    delete process.env.INSTAGRAM_REDIRECT_URI;
  });

  it("is dormant until both app credentials are set", () => {
    expect(isInstagramEnabled()).toBe(false);
    process.env.INSTAGRAM_APP_ID = "123";
    expect(isInstagramEnabled()).toBe(false); // secret still missing
    process.env.INSTAGRAM_APP_SECRET = "shh";
    expect(isInstagramEnabled()).toBe(true);
  });

  it("derives the callback redirect URI from the origin", () => {
    expect(instagramRedirectUri("https://example.com")).toBe(
      "https://example.com/api/integrations/instagram/callback",
    );
  });

  it("honors INSTAGRAM_REDIRECT_URI override", () => {
    process.env.INSTAGRAM_REDIRECT_URI = "https://app.test/cb";
    expect(instagramRedirectUri("https://ignored.com")).toBe("https://app.test/cb");
  });

  it("builds an official Instagram authorize URL with CSRF state + minimal scope", () => {
    process.env.INSTAGRAM_APP_ID = "appid123";
    const url = new URL(buildAuthUrl("statetoken", "https://example.com/cb"));
    expect(url.origin + url.pathname).toBe("https://www.instagram.com/oauth/authorize");
    expect(url.searchParams.get("client_id")).toBe("appid123");
    expect(url.searchParams.get("redirect_uri")).toBe("https://example.com/cb");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("state")).toBe("statetoken");
    expect(url.searchParams.get("scope")).toBe("instagram_business_basic");
  });
});
