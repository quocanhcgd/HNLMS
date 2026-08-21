export interface PageInfo {
  limit: number;
  next_cursor: string | null;
  has_more: boolean;
}

export interface Paginated<T> {
  items: T[];
  page_info: PageInfo;
}

export interface PaginationOptions {
  limit?: number;
  cursor?: string | null;
}

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

function encodeCursor(index: number): string {
  return Buffer.from(JSON.stringify({ index }), "utf8").toString("base64url");
}

function decodeCursor(cursor: string): number {
  try {
    const value: unknown = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
    if (!value || typeof value !== "object" || !Number.isInteger((value as { index?: unknown }).index)) {
      throw new Error("invalid cursor");
    }
    const index = (value as { index: number }).index;
    if (index < 0) throw new Error("invalid cursor");
    return index;
  } catch {
    throw new Error("invalid_pagination_cursor");
  }
}

export function normalizePageLimit(limit?: number): number {
  if (limit === undefined) return DEFAULT_LIMIT;
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) throw new Error("invalid_page_limit");
  return limit;
}

/** Applies stable offset cursors to an already authorization-filtered collection. */
export function paginate<T>(items: readonly T[], options: PaginationOptions = {}): Paginated<T> {
  const limit = normalizePageLimit(options.limit);
  const start = options.cursor ? decodeCursor(options.cursor) : 0;
  if (start > items.length) throw new Error("invalid_pagination_cursor");
  const page = items.slice(start, start + limit);
  const next = start + page.length;
  const hasMore = next < items.length;
  return {
    items: page,
    page_info: { limit, next_cursor: hasMore ? encodeCursor(next) : null, has_more: hasMore },
  };
}
