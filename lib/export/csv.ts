import type { KeywordCollectData } from '@/types/keyword';

function escapeCsv(value: string): string {
  const escaped = value.replace(/"/g, '""');
  return `"${escaped}"`;
}

export function buildKeywordCsv(data: KeywordCollectData): string {
  const rows: string[] = [];
  rows.push(['keyword', 'source', 'value'].join(','));

  const pushRows = (source: string, values: string[]) => {
    for (const value of values) {
      rows.push(
        [escapeCsv(data.keyword), escapeCsv(source), escapeCsv(value)].join(',')
      );
    }
  };

  pushRows('suggest', data.suggest);
  pushRows('people_also_search', data.peopleAlsoSearch);
  pushRows('related_search', data.relatedSearch);

  return rows.join('\n');
}
