export type ThemeTokens = { background: string; foreground: string; primary: string; [key: string]: unknown };
export type ThemePreset = {
  key: string;
  version: number;
  light: ThemeTokens;
  dark: ThemeTokens;
  status: "draft" | "published" | "archived";
};
export type OrganizationContext = { organizationId: string; userId: string };
export type OrganizationSetting = { key: string; value: unknown; version: number; updatedAt: Date };
export type ThemeVersion = ThemePreset & { organizationId: string; id: string; createdAt: Date; publishedAt?: Date };
export type ThemeDraft = Omit<ThemeVersion, "status" | "publishedAt"> & { status: "draft" };

export type OrganizationBranchRepository = {
  getSetting(organizationId: string, key: string): Promise<OrganizationSetting | undefined>;
  saveSetting(input: {
    organizationId: string;
    key: string;
    value: unknown;
    expectedVersion?: number;
    userId: string;
  }): Promise<OrganizationSetting>;
  getCurrentTheme(organizationId: string): Promise<ThemeVersion | undefined>;
  getTheme(organizationId: string, version: number): Promise<ThemeVersion | undefined>;
  saveTheme(theme: ThemeDraft): Promise<ThemeDraft>;
  publishTheme(organizationId: string, version: number, userId: string): Promise<ThemeVersion>;
};

export function assertOrganizationContext(context: OrganizationContext): void {
  if (!context.organizationId || !context.userId) throw new Error("organization_context_required");
}

export function validateTheme(theme: Pick<ThemePreset, "light" | "dark">): void {
  for (const mode of ["light", "dark"] as const) {
    const tokens = theme[mode];
    if (!tokens.background || !tokens.foreground || !tokens.primary) throw new Error(`theme_${mode}_tokens_required`);
  }
}

export class OrganizationBranchService {
  constructor(private readonly repository: OrganizationBranchRepository) {}
  getSetting(context: OrganizationContext, key: string) {
    assertOrganizationContext(context);
    if (!key.trim()) throw new Error("setting_key_required");
    return this.repository.getSetting(context.organizationId, key);
  }
  saveSetting(context: OrganizationContext, key: string, value: unknown, expectedVersion?: number) {
    assertOrganizationContext(context);
    if (!key.trim()) throw new Error("setting_key_required");
    return this.repository.saveSetting({
      organizationId: context.organizationId,
      key,
      value,
      expectedVersion,
      userId: context.userId,
    });
  }
  getTheme(context: OrganizationContext) {
    assertOrganizationContext(context);
    return this.repository.getCurrentTheme(context.organizationId);
  }
  previewTheme(context: OrganizationContext, theme: ThemePreset) {
    assertOrganizationContext(context);
    validateTheme(theme);
    return this.repository.saveTheme({
      ...theme,
      version: theme.version + 1,
      status: "draft",
      organizationId: context.organizationId,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    });
  }
  async publishTheme(context: OrganizationContext, version: number) {
    assertOrganizationContext(context);
    const draft = await this.repository.getTheme(context.organizationId, version);
    if (!draft || draft.status !== "draft") throw new Error("theme_draft_not_found");
    return this.repository.publishTheme(context.organizationId, version, context.userId);
  }
  async rollbackTheme(context: OrganizationContext, version: number) {
    assertOrganizationContext(context);
    const target = await this.repository.getTheme(context.organizationId, version);
    if (!target || target.status === "draft") throw new Error("theme_published_version_not_found");
    return this.repository.publishTheme(context.organizationId, version, context.userId);
  }
}

export class InMemoryOrganizationBranchRepository implements OrganizationBranchRepository {
  private readonly settings = new Map<string, OrganizationSetting>();
  private readonly themes = new Map<string, ThemeVersion>();
  async getSetting(organizationId: string, key: string) {
    return this.settings.get(`${organizationId}:${key}`);
  }
  async saveSetting(input: {
    organizationId: string;
    key: string;
    value: unknown;
    expectedVersion?: number;
    userId: string;
  }) {
    const mapKey = `${input.organizationId}:${input.key}`;
    const previous = this.settings.get(mapKey);
    if (input.expectedVersion !== undefined && previous?.version !== input.expectedVersion)
      throw new Error("setting_version_conflict");
    const result = {
      key: input.key,
      value: structuredClone(input.value),
      version: (previous?.version ?? 0) + 1,
      updatedAt: new Date(),
    };
    this.settings.set(mapKey, result);
    return result;
  }
  async getCurrentTheme(organizationId: string) {
    return [...this.themes.values()]
      .filter((theme) => theme.organizationId === organizationId && theme.status === "published")
      .sort((a, b) => b.version - a.version)[0];
  }
  async getTheme(organizationId: string, version: number) {
    return this.themes.get(`${organizationId}:${version}`);
  }
  async saveTheme(theme: ThemeDraft) {
    this.themes.set(`${theme.organizationId}:${theme.version}`, theme);
    return theme;
  }
  async publishTheme(organizationId: string, version: number, _userId: string) {
    const target = this.themes.get(`${organizationId}:${version}`);
    if (!target) throw new Error("theme_version_not_found");
    for (const theme of this.themes.values())
      if (theme.organizationId === organizationId && theme.status === "published") theme.status = "archived";
    const published: ThemeVersion = { ...target, status: "published", publishedAt: new Date() };
    this.themes.set(`${organizationId}:${version}`, published);
    return published;
  }
}
