function buildLastOccurrence(pattern: string): Map<string, number> {
    const table = new Map<string, number>();
    for (let i = 0; i < pattern.length; i++) {
        table.set(pattern[i], i); 
    }

    return table;
}

export function bmSearch(text: string, pattern: string): { positions: number[]; comparisons: number } {
    const positions: number[] = [];
    let comparisons = 0;

    if (pattern.length === 0) return { positions, comparisons };
    if (pattern.length > text.length) return { positions, comparisons };

    // Build tabel LastOccur
    const lastOcc = buildLastOccurrence(pattern);

    // Selalu mulai dari karakter paling belakang pattern
    let it_text = pattern.length-1;
    let it_patt = pattern.length-1;  

    while (it_text < text.length){   //iterasi text kanan ke kiri bertahap dari awal
        comparisons++;
        
        if (pattern[it_patt] === text[it_text]){
            it_text--;
            it_patt--;

            if (it_patt < 0){    //find the solution, cari next solution
                positions.push(it_text+1);
                let d = pattern.length+1;
    
                it_text += d;
                it_patt = pattern.length-1;
            }
        } else { //missmatch
            let x = text[it_text];
            let lo = lastOcc.get(x) ?? -1;  //undefined -> -1

            let d;
            // Case tidak ada x
            if (lo === -1) { 
                // Buat indeks pertama pattern sejajar sama indeks text+1
                d = pattern.length;
            }
            // Case x ada di kiri
            else if (lo < it_patt){
                // Buat x di pattern sejajar sama x di text
                d = pattern.length - lo - 1;
            }
            // Case x ada di kanan
            else { //lo > it_patt)
                // Buat indeks terakhir pattern sejajar sama indeks terakhir text+1
                d = pattern.length - it_patt;
            }

            it_text += d;
            it_patt = pattern.length-1;
        }
    }
    
    return {positions, comparisons};
}