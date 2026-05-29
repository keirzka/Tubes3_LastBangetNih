import type { MatchResult, ScanStats, Algorithm } from '../types';
import { loadKeywords } from '../content/keywordLoader';
import { kmpSearch } from './kmp';
import { bmSearch } from './bm';
import { regexSearch } from './regex';
import { fuzzySearch } from './weightedLevenshtein';
import { ahoCorasickSearch } from './ahocorasick';
import { rabinKarpSearch } from './rabinkarp';

function kmpFindAll(text: string, pattern: string): number[] {
    const positions: number[] = [];
    if (pattern.length === 0 || pattern.length > text.length) return positions;

    const lps = new Array<number>(pattern.length).fill(0);
    let len = 0, i = 1;
    while (i < pattern.length) {
        if (pattern[i] === pattern[len]) { lps[i] = ++len; i++; }
        else { len === 0 ? i++ : (len = lps[len - 1]); }
    }

    let it = 0, ip = 0;
    while (it < text.length) {
        if (pattern[ip] === text[it]) { ip++; it++; }
        else { ip === 0 ? it++ : (ip = lps[ip - 1]); }
        if (ip === pattern.length) {
            positions.push(it - ip);
            ip = lps[ip - 1];
        }
    }
    return positions;
}

export async function searchAlgorithm(text: string): Promise<ScanStats> {
    const keywords = await loadKeywords();    
    const normalizedText = text.toLowerCase();
    const results: MatchResult[] = [];

    const byAlgorithm: Record<Algorithm, number> = {
        KMP: 0, BoyerMoore: 0, RegEx: 0, Fuzzy: 0, AhoCorasick: 0, RabinKarp: 0,
    };
    const executionByAlgorithm: Record<Algorithm, number> = {
        KMP: 0, BoyerMoore: 0, RegEx: 0, Fuzzy: 0, AhoCorasick: 0, RabinKarp: 0,
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

        byAlgorithm['KMP'] += kmpResult.positions.length;
        executionByAlgorithm['KMP'] += kmpTime;
        byAlgorithm['BoyerMoore'] += bmResult.positions.length;
        executionByAlgorithm['BoyerMoore'] += bmTime;

        if (kmpResult.positions.length === 0 && bmResult.positions.length === 0) {
            keywordsWithNoExactMatch.push(keyword);
        }

        if (kmpResult.positions.length > 0) {
            console.log(`[KMP] "${keyword}" → ${kmpResult.positions.length} match`);
            console.log(`[BM]  "${keyword}" → ${bmResult.positions.length} match`);
            results.push({
                keyword,
                count: kmpResult.positions.length,
                positions: kmpResult.positions,
                isFuzzy: false,
                executionTimes: {
                    KMP: kmpTime,
                    BoyerMoore: bmTime,
                },
            });
        }
    }

    // Aho-Corasick
    const acStart = performance.now();
    const acResults = ahoCorasickSearch(normalizedText, keywords);
    const acTime = performance.now() - acStart;

    for (const keyword of keywords) {
        const acCount = acResults.get(keyword)!.positions.length;
        byAlgorithm['AhoCorasick'] += acCount;
        if (acCount > 0) console.log(`[AC]  "${keyword}" → ${acCount} match`);
    }
    executionByAlgorithm['AhoCorasick'] += acTime;

    for (const result of results) {
        result.executionTimes.AhoCorasick = acTime;
    }

    // Rabin Karp
    for (const result of results) {
        const rkStart = performance.now();
        const rkResult = rabinKarpSearch(normalizedText, result.keyword);
        const rkTime = performance.now() - rkStart;

        byAlgorithm['RabinKarp'] += rkResult.positions.length;
        executionByAlgorithm['RabinKarp'] += rkTime;
        result.executionTimes.RabinKarp = rkTime;
        if (rkResult.positions.length > 0) console.log(`[RK]  "${result.keyword}" → ${rkResult.positions.length} match`);
    }

    // Regex matching 
    const regexStart = performance.now();
    const regexResult = regexSearch(text);
    const regexTime = performance.now() - regexStart;

    for (const r of regexResult) {
        console.log(`[RegEx] "${r.matched}" → pos: ${r.index}`);
        results.push({
            keyword: r.matched,
            count: 1,
            positions: [r.index],
            isFuzzy: false,
            executionTimes: { RegEx: regexTime },
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
            const alreadyExact = results.some(r => r.keyword === keyword && !r.isFuzzy);
            if (alreadyExact) continue;

            const tokenPositions = kmpFindAll(normalizedText, data.token);

            console.log(`[Fuzzy] "${keyword}" <- token:"${data.token}" sim:${data.similarity.toFixed(3)} pos:[${tokenPositions}]`);

            if (tokenPositions.length === 0) continue;

            results.push({
                keyword,
                matchedToken: data.token,
                count: tokenPositions.length,
                positions: tokenPositions,
                isFuzzy: true,
                similarity: data.similarity,
                executionTimes: { Fuzzy: fuzzyTime },
            });
            byAlgorithm['Fuzzy'] += tokenPositions.length;
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