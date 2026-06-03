const BLOCKED_PATTERNS = [
  /@import/i,
  /@charset/i,
  /javascript:/i,
  /expression\s*\(/i,
  /behavior\s*:/i,
  /-moz-binding/i,
  /url\s*\(\s*["']?\s*data:/i,
];

export const MAX_SHELF_CSS_BYTES = 12_000;

export function sanitizeShelfCss(raw: string): string {
  const css = raw.trim();
  if (!css) return "";

  if (Buffer.byteLength(css, "utf8") > MAX_SHELF_CSS_BYTES) {
    throw new Error("Custom CSS must be 12 KB or smaller.");
  }

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(css)) {
      throw new Error("Custom CSS contains unsupported or unsafe rules.");
    }
  }

  return css;
}

export function scopeShelfCss(css: string, scopeSelector: string): string {
  const sanitized = sanitizeShelfCss(css);
  if (!sanitized) return "";

  return sanitized.replace(
    /(^|})\s*([^@{}][^{]*)\{/g,
    (_match, brace: string, selectors: string) => {
      const scoped = selectors
        .split(",")
        .map((selector) => {
          const trimmed = selector.trim();
          if (!trimmed) return trimmed;
          return `${scopeSelector} ${trimmed}`;
        })
        .join(", ");
      return `${brace} ${scoped} {`;
    },
  );
}

export function parseShelfCssFile(raw: string): string {
  return sanitizeShelfCss(raw);
}
