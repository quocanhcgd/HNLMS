import type { ThemePreset, ThemeTokens } from "@hnlms/theme-presets";
import { defaultThemePreset } from "./preset";

const highContrast: ThemePreset = {
  ...defaultThemePreset,
  key: "hnlms-high-contrast",
  version: 1,
  light: { ...defaultThemePreset.light, foreground: "#071014", muted: "#40555f", border: "#8ca4ad", ring: "#005d66" },
  dark: { ...defaultThemePreset.dark, foreground: "#ffffff", muted: "#d5e5ea", border: "#6f8b98", ring: "#b8f8ff" },
};
export const themePresetRegistry = [defaultThemePreset, highContrast] as const;
export function getPreset(key: string): ThemePreset {
  return themePresetRegistry.find((preset) => preset.key === key) ?? defaultThemePreset;
}
export function tokenCssVariables(tokens: ThemeTokens, mode: "light" | "dark"): Record<string, string> {
  const variables: Record<string, string> = {};
  for (const [key, value] of Object.entries(tokens)) {
    if (typeof value === "string") variables[`--hn-${mode}-${key}`] = value;
  }
  for (const [key, value] of Object.entries(tokens.spacing)) variables[`--hn-${mode}-spacing-${key}`] = value;
  for (const [key, value] of Object.entries(tokens.typography)) variables[`--hn-${mode}-typography-${key}`] = value;
  return variables;
}
function luminance(hex: string): number {
  const rgb = hex
    .replace("#", "")
    .match(/.{2}/g)
    ?.map((part) => parseInt(part, 16) / 255) ?? [0, 0, 0];
  const linear = rgb.map((value) => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}
export function contrastRatio(foreground: string, background: string): number {
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
export function validateContrast(tokens: ThemeTokens): { valid: boolean; ratio: number } {
  const ratio = contrastRatio(tokens.foreground, tokens.background);
  return { ratio, valid: ratio >= 4.5 };
}
