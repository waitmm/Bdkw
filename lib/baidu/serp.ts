import { chromium } from 'playwright';
import { normalizeKeywords } from './normalize';

export interface SerpResult {
  peopleAlsoSearch: string[];
  relatedSearch: string[];
}

/**
 * 抓取 PC 百度 SERP：
 * - 大家还在搜
 * - 相关搜索
 */
export async function fetchBaiduSerpKeywordBlocks(keyword: string): Promise<SerpResult> {
  const browser = await chromium.launch({
    headless: true,
  });

  try {
    const page = await browser.newPage({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      viewport: { width: 1366, height: 900 },
    });

    page.setDefaultTimeout(15000);

    const url = `https://www.baidu.com/s?wd=${encodeURIComponent(keyword)}`;
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // 给异步渲染一些时间，避免漏抓
    await page.waitForTimeout(1200);

    const peopleAlsoSearchRaw = await page
      .locator('[class*="cos-col"] a, [class*="c-span"] a, [class*="se-common-mod"] a')
      .allTextContents();

    const relatedSearchRaw = await page
      .locator('#rs a, [id*="rs"] a, [class*="related-search"] a')
      .allTextContents();

    // 通过标题过滤更稳妥地提取“大家还在搜”
    const headingBasedPeopleAlsoSearch = await page.evaluate(() => {
      const blocks = Array.from(document.querySelectorAll('div, section'));
      const textList: string[] = [];

      for (const block of blocks) {
        const title = (block.textContent || '').slice(0, 30);
        if (!title.includes('大家还在搜')) continue;

        const links = Array.from(block.querySelectorAll('a'));
        for (const a of links) {
          const t = (a.textContent || '').trim();
          if (t) textList.push(t);
        }
      }

      return textList;
    });

    return {
      peopleAlsoSearch: normalizeKeywords([
        ...headingBasedPeopleAlsoSearch,
        ...peopleAlsoSearchRaw,
      ]).filter((v) => v.length <= 40),
      relatedSearch: normalizeKeywords(relatedSearchRaw).filter((v) => v.length <= 40),
    };
  } finally {
    await browser.close();
  }
}
