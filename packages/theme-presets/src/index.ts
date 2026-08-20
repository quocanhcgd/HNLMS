export type SemanticColorRole =
  | "background"
  | "foreground"
  | "surface"
  | "surfaceMuted"
  | "primary"
  | "secondary"
  | "muted"
  | "border"
  | "ring"
  | "success"
  | "warning"
  | "danger"
  | "info";
export type ThemeTokens = Record<SemanticColorRole, string> & { fontFamily: string; radiusScale: "sm" | "md" | "lg" };
export type ThemePreset = {
  key: string;
  version: number;
  light: ThemeTokens;
  dark: ThemeTokens;
  status: "draft" | "published" | "archived";
};

export function validateRequiredTokens(tokens: Partial<ThemeTokens>): string[] {
  const required: SemanticColorRole[] = [
    "background",
    "foreground",
    "surface",
    "surfaceMuted",
    "primary",
    "border",
    "ring",
    "success",
    "warning",
    "danger",
    "info",
  ];
  return required.filter((key) => !tokens[key]);
}
