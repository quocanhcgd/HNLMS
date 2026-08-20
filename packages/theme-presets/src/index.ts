export const semanticColorRoles = [
  "background",
  "foreground",
  "surface",
  "surfaceMuted",
  "popover",
  "primary",
  "primaryForeground",
  "secondary",
  "muted",
  "border",
  "input",
  "ring",
  "success",
  "warning",
  "danger",
  "info",
  "disabledForeground",
  "disabledBackground",
  "validation",
  "destructiveForeground",
] as const;
export type SemanticColorRole = (typeof semanticColorRoles)[number];
export const spacingScale = ["xs", "sm", "md", "lg", "xl"] as const;
export type SpacingToken = (typeof spacingScale)[number];
export const typographyScale = ["xs", "sm", "base", "lg", "xl", "2xl"] as const;
export type TypographyToken = (typeof typographyScale)[number];
export type ThemeTokens = Record<SemanticColorRole, string> & {
  fontFamily: string;
  radiusScale: "sm" | "md" | "lg";
  spacing: Record<SpacingToken, string>;
  typography: Record<TypographyToken, string>;
};
export type ThemePreset = {
  key: string;
  version: number;
  light: ThemeTokens;
  dark: ThemeTokens;
  status: "draft" | "published" | "archived";
};
export const requiredThemeTokenKeys = [
  ...semanticColorRoles,
  "fontFamily",
  "radiusScale",
  "spacing",
  "typography",
] as const;
export function validateRequiredTokens(tokens: Partial<ThemeTokens>): string[] {
  return requiredThemeTokenKeys
    .filter((key) => tokens[key] === undefined || tokens[key] === null || tokens[key] === "")
    .map(String);
}
