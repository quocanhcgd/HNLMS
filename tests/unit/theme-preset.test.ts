import { describe, expect, it } from "vitest";
import { defaultThemePreset } from "../../apps/web/src/lib/theme/preset";
import { getPreset, themePresetRegistry, validateContrast } from "../../apps/web/src/lib/theme/registry";

describe("theme preset lifecycle", () => {
  it("keeps a registry with a stable default and contrast-valid presets", () => {
    expect(themePresetRegistry.length).toBeGreaterThanOrEqual(2);
    expect(getPreset("missing").key).toBe(defaultThemePreset.key);
    for (const preset of themePresetRegistry) {
      expect(validateContrast(preset.light).valid).toBe(true);
      expect(validateContrast(preset.dark).valid).toBe(true);
    }
  });
});
