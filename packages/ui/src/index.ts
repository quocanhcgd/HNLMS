export type Locale = "vi" | "en";
export type ThemeMode = "light" | "dark" | "system";
export type NavigationItem = {
  key: string;
  labelKey: string;
  href: string;
  moduleKey?: string;
  permission?: string;
  children?: readonly NavigationItem[];
};
export type PageState = "loading" | "empty" | "error" | "forbidden" | "ready";
export type DataTableState = {
  page: number;
  pageSize: number;
  sort?: string;
  search?: string;
  filters?: Record<string, string>;
};
