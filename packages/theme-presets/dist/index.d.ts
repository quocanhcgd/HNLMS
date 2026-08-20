export type SemanticColorRole = "background" | "foreground" | "surface" | "surfaceMuted" | "primary" | "secondary" | "muted" | "border" | "ring" | "success" | "warning" | "danger" | "info";
export type ThemeTokens = Record<SemanticColorRole, string> & {
    fontFamily: string;
    radiusScale: "sm" | "md" | "lg";
};
export type ThemePreset = {
    key: string;
    version: number;
    light: ThemeTokens;
    dark: ThemeTokens;
    status: "draft" | "published" | "archived";
};
export declare function validateRequiredTokens(tokens: Partial<ThemeTokens>): string[];
