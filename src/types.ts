export type Algorithm = 'KMP' | 'BoyerMoore' | 'RegEx' | 'Fuzzy' | 'AhoCorasick' | 'RabinKarp';

export interface MatchResult {
  keyword: string;
  matchedToken?: string;
  count: number;

  positions: number[];

  isFuzzy: boolean;
  similarity?: number;

  executionTimes: Partial<Record<Algorithm, number>>;
}

export interface ScanStats {
  totalMatches: number;
  byAlgorithm: Record<Algorithm, number>;
  executionByAlgorithm: Record<Algorithm, number>;
  results: MatchResult[];
}

export interface ContentMessage {
  type: 'SCAN_START' | 'SCAN_COMPLETE' | 'SCAN_CLEAR' | 'SET_BLUR';
  stats?: ScanStats;
  blurEnabled?: boolean;
}