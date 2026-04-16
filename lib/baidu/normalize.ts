/**
 * 去重 + 清洗关键词列表
 */
export function normalizeKeywords(input: Array<string | null | undefined>): string[] {
  const set = new Set<string>();

  for (const item of input) {
    if (!item) continue;

    const cleaned = item
      .replace(/\s+/g, ' ')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .trim();

    if (cleaned) {
      set.add(cleaned);
    }
  }

  return Array.from(set);
}
