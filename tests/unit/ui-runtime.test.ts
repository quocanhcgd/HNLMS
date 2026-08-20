import { describe, expect, it } from "vitest";
import { isLocale, messages } from "../../apps/web/src/lib/i18n/messages";
import { defaultThemePreset } from "../../apps/web/src/lib/theme/preset";
import { validateRequiredTokens } from "@hnlms/theme-presets";

describe("UI runtime contracts", () => {
  it("keeps vi/en message keys in parity", () => {
    expect(Object.keys(messages.vi).sort()).toEqual(Object.keys(messages.en).sort());
  });
  it("uses Vietnamese and dark as defaults", () => {
    expect(isLocale("vi")).toBe(true);
    expect(defaultThemePreset.dark.background).toBe("#0a1016");
  });
  it("publishes complete semantic token sets", () => {
    expect(validateRequiredTokens(defaultThemePreset.light)).toEqual([]);
    expect(validateRequiredTokens(defaultThemePreset.dark)).toEqual([]);
  });
});
