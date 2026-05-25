// Pre-process array supaya tau jumlah karakter untuk diskip pada KMP
// lps[i] adalah longest proper prefix of pat[0..i] yang juga suffix of pat[0..i]
function buildLps(pat: string): number[] {
    const lps = new Array(pat.length).fill(0);  //inisiasi lps

    let len_checked = 0; 
    let it = 1;

    while (it < pat.length){
        if (pat[len_checked] === pat[it]){
            len_checked++;
            lps[it] = len_checked;
            it++;
        } else {
            if (len_checked === 0){
                lps[it] = 0;
                it++;
            } else {  //missmatch setelah proses, mundur untuk cek kemungkinan lps yang lebih pendek
                len_checked = lps[len_checked-1]
            }
        }
    }
  
    return lps;
}

export function kmpSearch(text: string, patt: string): { positions: number[]; comparisons: number } {
    const positions: number[] = [];
    let comparisons = 0;

    if (patt.length === 0) return { positions, comparisons };
    if (patt.length > text.length) return { positions, comparisons };

    // Build lps
    const lps = buildLps(patt);

    let it_text = 0;
    let it_patt = 0;

    while (it_text<text.length){  //iterasi text
        comparisons++;

        if (patt[it_patt] === text[it_text]){
            it_patt++;
            it_text++;

            if (it_patt === patt.length){  //find the solution, cari next solution
                positions.push(it_text - it_patt);
                it_patt = lps[it_patt-1];
            }
        } 
        else {
            if (it_patt === 0){  
                it_text++;  
            } else {  //missmatch setelah proses, cari longest prefix match pada it_patt-1 untuk mulai dari situ 
                it_patt = lps[it_patt-1];
            }
        }
    }

    return { positions, comparisons };
}