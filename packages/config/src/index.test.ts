import { describe, expect, it } from "vitest";
import { EnvironmentConfigError, readPublicWebEnv, readServerEnv } from "./index";

describe("typed environment contracts", () => {
  it("parses safe local defaults and public URL", () => {
    expect(readServerEnv({ NODE_ENV: "development" })).toMatchObject({ apiPort: 4000, webOrigin: "http://localhost:3100" });
    expect(readPublicWebEnv({ NEXT_PUBLIC_SITE_URL: "https://example.test" }).siteUrl).toBe("https://example.test");
  });
  it("fails fast for invalid ports, URLs and production secrets", () => {
    expect(() => readServerEnv({ API_PORT: "0" })).toThrow(EnvironmentConfigError);
    expect(() => readServerEnv({ WEB_ORIGIN: "not-a-url" })).toThrow("WEB_ORIGIN_must_be_url");
    expect(() => readServerEnv({ NODE_ENV: "production", SESSION_SECRET: "short" })).toThrow("SESSION_SECRET_must_be_32_chars_in_production");
  });
});
