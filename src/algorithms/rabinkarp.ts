
const BASE = 101;
const MOD = 1_000_000_007;

// hitung hash awal string s panjang m pake polynomial rolling hash: hash = s[0]*BASE^(m-1) + s[1]*BASE^(m-2) + ... + s[m-1]* BASE^0  (mod MOD)
function initialHash(s: string, m: number): number {
    let h = 0;
    for (let i = 0; i < m; i++) {
        h = (h * BASE + s.charCodeAt(i)) % MOD;
    }
    return h;
}

// hitung BASE^(m-1) mod MOD utk rolling hash (hapus karakter paling kiri)
function highPow(m: number): number {
    let result = 1;
    for (let i = 0; i < m - 1; i++) {
        result = (result * BASE) % MOD;
    }
    return result;
}

// geser window ke kanan, hapus karakter palingkiri trus tambah yg baru
// newHash = (hash - oldChar * BASE^(m-1)) * BASE + newChar  (mod MOD)
function rollHash(hash: number, oldChar: number, newChar: number, hp: number): number {
    let h = (hash - oldChar * hp % MOD + MOD) % MOD;
    h = (h * BASE + newChar) % MOD;
    return h;
}

export interface RabinKarpResult {
    positions: number[];   
    comparisons: number;   
}

export function rabinKarpSearch(
    text: string,
    pattern: string
): RabinKarpResult {
    const positions: number[] = [];
    let comparisons = 0;

    const n = text.length;
    const m = pattern.length;

    if (m === 0) return { positions, comparisons };
    if (m > n) return { positions, comparisons };

    const hp = highPow(m);
    const patHash = initialHash(pattern, m);
    let winHash = initialHash(text, m);

    for (let i = 0; i <= n - m; i++) {
        comparisons++; 

        if (winHash === patHash) {
            let match = true;
            for (let j = 0; j < m; j++) {
                comparisons++; 
                if (text[i + j] !== pattern[j]) {
                    match = false;
                    break;
                }
            }
            if (match) {
                positions.push(i);
            }
        }

        if (i < n - m) {
            winHash = rollHash(
                winHash,
                text.charCodeAt(i),
                text.charCodeAt(i + m),
                hp
            );
        }
    }

    return { positions, comparisons };
}