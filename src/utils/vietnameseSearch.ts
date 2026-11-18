export function removeVietnameseDiacritics(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

export function matchesSearchQuery(query: string, ...fields: (string | string[] | undefined)[]): boolean {
  const normalizedQuery = removeVietnameseDiacritics(query);
  if (!normalizedQuery) return true;
  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);

  const combined = fields
    .flatMap((f) => (Array.isArray(f) ? f : f ? [f] : []))
    .map((s) => removeVietnameseDiacritics(s))
    .join(' ');

  return tokens.every((token) => combined.includes(token));
}
