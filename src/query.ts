/**
 * query.ts — builds a Gmail search query string from structured filters.
 * Pure and dependency-free so it can be unit-tested. Lets callers pass tidy
 * fields (from, subject, after, …) instead of hand-writing Gmail query syntax,
 * while still allowing a raw `query` passthrough.
 */
export interface SearchFilters {
  /** Raw Gmail query, merged with the structured filters below. */
  query?: string;
  from?: string;
  to?: string;
  subject?: string;
  label?: string;
  /** Relative window, e.g. "30d", "6m", "1y". */
  newer_than?: string;
  /** Absolute date YYYY/MM/DD (Gmail's `after:` syntax). */
  after?: string;
  /** Absolute date YYYY/MM/DD (Gmail's `before:` syntax). */
  before?: string;
  has_attachment?: boolean;
  is_unread?: boolean;
}

/** Wraps a value in quotes if it contains whitespace, so Gmail keeps it as one term. */
function term(value: string): string {
  const v = value.trim();
  return /\s/.test(v) ? `"${v}"` : v;
}

/**
 * Combines raw query + structured filters into a single Gmail query string.
 * Returns "" when no filters are supplied (callers should treat that as an error).
 */
export function buildQuery(f: SearchFilters): string {
  const parts: string[] = [];

  if (f.query && f.query.trim()) parts.push(f.query.trim());
  if (f.from) parts.push(`from:${term(f.from)}`);
  if (f.to) parts.push(`to:${term(f.to)}`);
  if (f.subject) parts.push(`subject:${term(f.subject)}`);
  if (f.label) parts.push(`label:${term(f.label)}`);
  if (f.newer_than) parts.push(`newer_than:${term(f.newer_than)}`);
  if (f.after) parts.push(`after:${term(f.after)}`);
  if (f.before) parts.push(`before:${term(f.before)}`);
  if (f.has_attachment) parts.push("has:attachment");
  if (f.is_unread) parts.push("is:unread");

  return parts.join(" ").trim();
}
