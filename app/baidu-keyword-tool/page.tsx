'use client';

import { useMemo, useState } from 'react';
import type { KeywordCollectResponse } from '@/types/keyword';
import { buildKeywordCsv } from '@/lib/export/csv';

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function ResultList({ title, list }: { title: string; list: string[] }) {
  return (
    <section style={{ marginTop: 20 }}>
      <h3 style={{ marginBottom: 8 }}>{title}（{list.length}）</h3>
      {list.length === 0 ? (
        <p style={{ color: '#666' }}>暂无数据</p>
      ) : (
        <ul style={{ lineHeight: 1.8, paddingLeft: 20 }}>
          {list.map((item, idx) => (
            <li key={`${item}-${idx}`}>{item}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function BaiduKeywordToolPage() {
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<KeywordCollectResponse | null>(null);

  const canExport = Boolean(response?.data);

  const statusColor = useMemo(() => {
    if (!response) return '#111';
    if (response.status === 'success') return '#0a7a2f';
    if (response.status === 'partial_success') return '#b36b00';
    return '#c1121f';
  }, [response]);

  const handleCollect = async () => {
    setError(null);
    setResponse(null);

    const kw = keyword.trim();
    if (!kw) {
      setError('请输入关键词');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/baidu-keywords/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: kw }),
      });

      const json = (await res.json()) as KeywordCollectResponse;
      setResponse(json);

      if (!res.ok) {
        setError(json.message || '请求失败');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '网络异常');
    } finally {
      setLoading(false);
    }
  };

  const handleExportJson = () => {
    if (!response) return;
    downloadFile(
      JSON.stringify(response, null, 2),
      `baidu-keywords-${response.data.keyword}.json`,
      'application/json;charset=utf-8;'
    );
  };

  const handleExportCsv = () => {
    if (!response) return;
    downloadFile(
      buildKeywordCsv(response.data),
      `baidu-keywords-${response.data.keyword}.csv`,
      'text/csv;charset=utf-8;'
    );
  };

  return (
    <main style={{ maxWidth: 900, margin: '32px auto', padding: '0 16px 40px' }}>
      <h1 style={{ marginBottom: 8 }}>百度关键词采集 MVP（PC）</h1>
      <p style={{ color: '#555', marginBottom: 20 }}>
        输入单个关键词，采集：下拉词、大家还在搜、相关搜索。
      </p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="请输入关键词，例如：新能源汽车"
          style={{
            flex: '1 1 320px',
            height: 40,
            padding: '0 12px',
            border: '1px solid #ccc',
            borderRadius: 6,
          }}
        />
        <button
          onClick={handleCollect}
          disabled={loading}
          style={{
            height: 40,
            padding: '0 14px',
            borderRadius: 6,
            border: '1px solid #1677ff',
            background: '#1677ff',
            color: '#fff',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? '采集中...' : '开始采集'}
        </button>

        <button
          onClick={handleExportJson}
          disabled={!canExport}
          style={{ height: 40, padding: '0 14px' }}
        >
          导出 JSON
        </button>
        <button
          onClick={handleExportCsv}
          disabled={!canExport}
          style={{ height: 40, padding: '0 14px' }}
        >
          导出 CSV
        </button>
      </div>

      {error && <p style={{ color: '#c1121f', marginTop: 16 }}>错误：{error}</p>}

      {response && (
        <section style={{ marginTop: 20 }}>
          <p style={{ marginBottom: 4 }}>
            状态：<strong style={{ color: statusColor }}>{response.status}</strong>
          </p>
          {response.message && <p style={{ color: '#333' }}>{response.message}</p>}

          {response.errors && (
            <div
              style={{
                marginTop: 10,
                padding: 10,
                border: '1px solid #f5c2c7',
                background: '#fff5f6',
                borderRadius: 6,
              }}
            >
              <strong>错误详情：</strong>
              <ul style={{ marginTop: 6, paddingLeft: 20 }}>
                {Object.entries(response.errors).map(([k, v]) => (
                  <li key={k}>
                    {k}: {v}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <ResultList title="1) 下拉词" list={response.data.suggest} />
          <ResultList title="2) 大家还在搜" list={response.data.peopleAlsoSearch} />
          <ResultList title="3) 相关搜索" list={response.data.relatedSearch} />
        </section>
      )}
    </main>
  );
}
