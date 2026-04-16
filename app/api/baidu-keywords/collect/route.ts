import { NextResponse } from 'next/server';
import { fetchBaiduSuggest } from '@/lib/baidu/suggest';
import { fetchBaiduSerpKeywordBlocks } from '@/lib/baidu/serp';
import type { CollectErrors, KeywordCollectResponse } from '@/types/keyword';

export const runtime = 'nodejs';

type Body = {
  keyword?: string;
};

export async function POST(req: Request) {
  let body: Body;

  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json(
      {
        status: 'failed',
        message: '请求体不是合法 JSON。',
      },
      { status: 400 }
    );
  }

  const keyword = body.keyword?.trim();

  if (!keyword) {
    return NextResponse.json(
      {
        status: 'failed',
        message: 'keyword 不能为空。',
      },
      { status: 400 }
    );
  }

  const errors: CollectErrors = {};
  let suggest: string[] = [];
  let peopleAlsoSearch: string[] = [];
  let relatedSearch: string[] = [];

  const [suggestResult, serpResult] = await Promise.allSettled([
    fetchBaiduSuggest(keyword),
    fetchBaiduSerpKeywordBlocks(keyword),
  ]);

  if (suggestResult.status === 'fulfilled') {
    suggest = suggestResult.value;
  } else {
    errors.suggest = suggestResult.reason?.message || '下拉词抓取失败';
  }

  if (serpResult.status === 'fulfilled') {
    peopleAlsoSearch = serpResult.value.peopleAlsoSearch;
    relatedSearch = serpResult.value.relatedSearch;
  } else {
    errors.peopleAlsoSearch = serpResult.reason?.message || '大家还在搜抓取失败';
    errors.relatedSearch = serpResult.reason?.message || '相关搜索抓取失败';
  }

  const hasAnyData =
    suggest.length > 0 || peopleAlsoSearch.length > 0 || relatedSearch.length > 0;
  const hasError = Object.keys(errors).length > 0;

  let status: KeywordCollectResponse['status'] = 'success';

  if (hasError && hasAnyData) {
    status = 'partial_success';
  } else if (hasError && !hasAnyData) {
    status = 'failed';
  }

  const response: KeywordCollectResponse = {
    status,
    data: {
      keyword,
      suggest,
      peopleAlsoSearch,
      relatedSearch,
    },
    errors: hasError ? errors : undefined,
    message:
      status === 'partial_success'
        ? '部分数据抓取成功。'
        : status === 'failed'
          ? '抓取失败，请稍后重试。'
          : '抓取成功。',
  };

  const httpCode = status === 'failed' ? 502 : 200;

  return NextResponse.json(response, { status: httpCode });
}
