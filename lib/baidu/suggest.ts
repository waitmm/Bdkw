import { normalizeKeywords } from './normalize';

/**
 * 百度下拉词接口（JSONP）
 * 示例：
 * https://suggestion.baidu.com/su?wd=关键词&cb=cb
 */
export async function fetchBaiduSuggest(keyword: string, timeoutMs = 8000): Promise<string[]> {
  const url = new URL('https://suggestion.baidu.com/su');
  url.searchParams.set('wd', keyword);
  url.searchParams.set('cb', 'cb');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url.toString(), {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`Suggest request failed: ${res.status}`);
    }

    const text = await res.text();

    const match = text.match(/\((.*)\)$/);
    if (!match?.[1]) {
      return [];
    }

    const json = JSON.parse(match[1]) as { s?: string[] };
    return normalizeKeywords(json.s ?? []);
  } finally {
    clearTimeout(timer);
  }
}
