// src/algorithms/searchAlgorithm.ts
import { MatchResult, ScanStats, Algorithm } from '../types';
import { loadKeywords } from '../content/keywordLoader';
import { kmpSearch } from './kmp';
import { bmSearch } from './bm';
import { regexSearch } from './regex';
import { fuzzySearch, THRESHOLD } from './weightedLevenshtein';

export async function searchAlgorithm(text: string): Promise<ScanStats> {
    const keywords = await loadKeywords();    
    const normalizedText = text.toLowerCase();
    const results: MatchResult[] = [];

    const byAlgorithm: Record<Algorithm, number> = {
        KMP: 0, BoyerMoore: 0, RegEx: 0, Fuzzy: 0,
    };
    const executionByAlgorithm: Record<Algorithm, number> = {
        KMP: 0, BoyerMoore: 0, RegEx: 0, Fuzzy: 0,
    };
    const keywordsWithNoExactMatch: string[] = [];

    // Exact Matching untuk setiap pattern di keywords.txt
    for (const keyword of keywords) {
        // KMP
        const kmpStart = performance.now();
        const kmpResult = kmpSearch(normalizedText, keyword);
        const kmpTime = performance.now() - kmpStart;
        // Boyer Moore
        const bmStart = performance.now();
        const bmResult = bmSearch(normalizedText, keyword);
        const bmTime = performance.now() - bmStart;

        if (kmpResult.positions.length > 0) {  //KMP sebagai primary result, harusnya result sama dgn bm
            results.push({
                keyword,
                algorithm: 'KMP',
                count: kmpResult.positions.length, 
                positions: kmpResult.positions,
                executionTime: kmpTime,
                isFuzzy: false,
            });
        }

        byAlgorithm['KMP'] += kmpResult.positions.length;
        executionByAlgorithm['KMP'] += kmpTime;

        byAlgorithm['BoyerMoore'] += bmResult.positions.length;        
        executionByAlgorithm['BoyerMoore'] += bmTime;

        // Catat sbg kandidat fuzzy kalau exact matching tidak menemukan keyword sama sekali
        if (kmpResult.positions.length === 0 && bmResult.positions.length === 0) {
            keywordsWithNoExactMatch.push(keyword);
        }
    }

    // Regex matching 
    const regexStart = performance.now();
    const regexResult = regexSearch(text); 
    const regexTime = performance.now() - regexStart;

    for (const r of regexResult) {
        results.push({
            keyword: r.matched,
            algorithm: 'RegEx',
            count: 1,
            positions: [r.index],
            executionTime: regexTime,
            isFuzzy: false,
        });
        byAlgorithm['RegEx'] += 1;
    }
    executionByAlgorithm['RegEx'] += regexTime;

    // Fuzzy matching
    if (keywordsWithNoExactMatch.length > 0) {
        const fuzzyStart = performance.now();
        const fuzzyMatches = fuzzySearch(normalizedText, keywordsWithNoExactMatch);
        const fuzzyTime = performance.now() - fuzzyStart;

        const fuzzyGrouped = new Map<string, { positions: number[]; similarity: number; token: string }>();

        for (const fm of fuzzyMatches) {
            if (!fuzzyGrouped.has(fm.keyword)) {
                fuzzyGrouped.set(fm.keyword, {
                    positions: [],
                    similarity: fm.similarity,
                    token: fm.token,
                });
            }
            fuzzyGrouped.get(fm.keyword)!.positions.push(fm.index);
            if (fm.similarity > fuzzyGrouped.get(fm.keyword)!.similarity) {
                fuzzyGrouped.get(fm.keyword)!.similarity = fm.similarity;
                fuzzyGrouped.get(fm.keyword)!.token = fm.token;
            }
        }

        for (const [keyword, data] of fuzzyGrouped) {
            const alreadyExact = results.some(
                r => r.keyword === keyword && !r.isFuzzy
            );
            if (alreadyExact) continue;

            results.push({
                keyword,
                algorithm: 'Fuzzy',
                count: data.positions.length,
                positions: data.positions,
                executionTime: fuzzyTime,
                isFuzzy: true,
                similarity: data.similarity,
            });
            byAlgorithm['Fuzzy'] += data.positions.length;
        }

        executionByAlgorithm['Fuzzy'] += fuzzyTime;
    }

    return {
        totalMatches: results.reduce((sum, r) => sum + r.count, 0),
        byAlgorithm,
        executionByAlgorithm,
        results,
    };
}