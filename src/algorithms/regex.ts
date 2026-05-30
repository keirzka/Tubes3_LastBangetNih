export interface RegexMatch {
    matched: string;    
    index: number;      
    keyword: string;   
}

// Pattern: <kata><angka>
// Handle >=2 angka di belakang kata tanpa spasi
// Case-insensitive
// Global, tidak berenti abis nemu one match
const regex = /\b([a-zA-Z]+)(\d{2,})\b/g;   

export function regexSearch(text: string): RegexMatch[]{
    const output: RegexMatch[] = [];
    
    let result = text.matchAll(regex);  
    for (const r of result) {  
        const fullMatch = r[0];
        const keywordPart = r[1];
        //const numberPart = r[2];

        output.push({
            matched: fullMatch,
            index: r.index ?? 0,
            keyword: keywordPart,
        });
    }

    return output;
}