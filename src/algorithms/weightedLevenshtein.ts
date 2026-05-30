
const VISUAL_SUB_COST = 0.2;
const NORMAL_SUB_COST = 1.0;
const INSERT_DELETE_COST = 1.0;

// set karakter yg mirip scr visual
const VISUAL_PAIRS = new Set<string>([
    'o|0',
    '0|o',
    'a|4',
    '4|a',
    'i|1',
    '1|i',
    'l|1',
    '1|l',
    'e|3',
    '3|e',
    's|5',
    '5|s',
    'b|8',
    '8|b',
    'g|9',
    '9|g',
    'z|2',
    '2|z',
    'i|!',
    '!|i',
    '\u03B1|a', 'a|\u03B1',  // α (alpha)
    '\u03BF|o', 'o|\u03BF',  // ο (omicron)
    '\u03B9|i', 'i|\u03B9',  // ι (iota)
    '\u0435|e', 'e|\u0435'  // // е (cyrillic e)
]);

function subCost(a: string, b: string): number{
    if (a == b) return 0;
    const key = `${a}|${b}`;
    if (VISUAL_PAIRS.has(key)) return VISUAL_SUB_COST;
    else return NORMAL_SUB_COST;
}

export function weightedLevenshtein(a: string, b: string): number{
    const m = a.length;
    const n = b.length;

    if (m == 0) return n * INSERT_DELETE_COST;
    if (n == 0) return m * INSERT_DELETE_COST;

    let prev = new Array<number>(n+1).fill(0);
    let curr = new Array<number>(n+1).fill(0);

    for (let i=0; i<=n; i++){
        prev[i] = i * INSERT_DELETE_COST;
    }

    for (let i=1; i<=m; i++){
        curr[0] = i * INSERT_DELETE_COST;
        for (let j=1; j<=n; j++){
            curr[j] = Math.min(prev[j] + INSERT_DELETE_COST, curr[j-1] + INSERT_DELETE_COST, prev[j-1] + subCost(a[i-1], b[j-1]));
        }
        [prev, curr] = [curr, prev];
    }
    return prev[n];
}

// 1: identik, 0: ga mirip sama sekali
export function similarity(a: string, b: string): number{
    const d = weightedLevenshtein(a, b);
    const maxLength = Math.max(a.length, b.length);
    if (maxLength == 0) return 1;
    return (1 - d/(maxLength*Math.max(NORMAL_SUB_COST, INSERT_DELETE_COST)));
}

export const THRESHOLD = 0.75;

export interface FuzzyMatch{
    keyword: string;
    token: string;
    similarity: number;
    index: number;
}

// pecah teks jd kata"
function tokenize(text: string): Array<{token: string; index: number}>{
    const tokens: Array<{token:string; index:number}> = [];
    const re = /[a-zA-Z0-9\u00C0-\u024F\u0370-\u03FF\u0400-\u04FF]+/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) != null){
        tokens.push({token:m[0].toLowerCase(), index:m.index});
    }
    return tokens;
}

export function fuzzySearch(text:string, candidateKey:string[]): FuzzyMatch[]{
    if (candidateKey.length === 0) return [];

    const tokens = tokenize(text);
    const matches:FuzzyMatch[] = [];
    // set keyword dan token yg udh dicek
    const seen = new Set<string>();

    for (const { token, index } of tokens) {
        for (const keyword of candidateKey) {
            // skip keyword yg udh pernah dicek
            const dupKey = `${keyword}|${token}`;
            if (seen.has(dupKey)) continue;
            
            // skip kalau panjang token dan keyword beda jauh (>50%)
            const lenRatio = Math.min(token.length, keyword.length) / Math.max(token.length, keyword.length);
            if (lenRatio < 0.5) continue;
        
            const sim = similarity(token, keyword);
            if (sim >= THRESHOLD) {
                matches.push({ keyword, token, similarity: sim, index });
                seen.add(dupKey);
            }
        }
    }
    return matches;
}