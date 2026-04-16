export type CollectPart = 'suggest' | 'peopleAlsoSearch' | 'relatedSearch';

export interface CollectErrors {
  suggest?: string;
  peopleAlsoSearch?: string;
  relatedSearch?: string;
}

export interface KeywordCollectData {
  keyword: string;
  suggest: string[];
  peopleAlsoSearch: string[];
  relatedSearch: string[];
}

export type CollectStatus = 'success' | 'partial_success' | 'failed';

export interface KeywordCollectResponse {
  status: CollectStatus;
  data: KeywordCollectData;
  errors?: CollectErrors;
  message?: string;
}
