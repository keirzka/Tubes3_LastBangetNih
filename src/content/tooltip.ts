import type { MatchResult } from '../types';

let tooltipEl: HTMLElement | null = null;


// Inisialisasi tooltip : panggil sekali saat content script load

export function initTooltip(): void {
    tooltipEl = document.createElement('div');
    tooltipEl.id = 'judol-tooltip';
    // masukkan ke halaman web
    document.body.appendChild(tooltipEl);
}


// Tampilkan tooltip saat hover keyword yang dihighlight

export function showTooltip(event: MouseEvent, result: MatchResult): void {
  if (!tooltipEl) return;
    tooltipEl.innerHTML = ``;

    // judul : keyword
    const keywordEl = document.createElement('h3');
    keywordEl.textContent = `Keyword : "${result.keyword}"`;
    tooltipEl.appendChild(keywordEl);

    // algoritma
    const algoEl = document.createElement('div');
    algoEl.textContent = `Algorithm : ${result.algorithm}`;
    tooltipEl.appendChild(algoEl);

    // count keyword
    const countEl = document.createElement('div');
    countEl.textContent = `Count : ${result.count}`;
    tooltipEl.appendChild(countEl);

    // waktu eksekusi
    const timeEl = document.createElement('div');
    timeEl.textContent = `Execution Time : ${(result.executionTime * 1000).toFixed(3)} µs`;
    tooltipEl.appendChild(timeEl);

    // similarity Fuzzy matching (kalau ada)
    if(result.isFuzzy && result.similarity != undefined){
        const fuzzyEl = document.createElement('div');
        fuzzyEl.textContent = `Fuzzy Similarity : ${(result.similarity * 100).toFixed(0)}%`;
        tooltipEl.appendChild(fuzzyEl);
    }

    // set posisi tooltip
    const offset = 12; // Jarak aman agar kotak tooltip tidak tertutup tepat di bawah kursor
    const tooltipWidth = 200; // lebar tooltip
    const tooltipHeight = 120; // tinggi tooltip

    const left = event.clientX + offset + tooltipWidth > window.innerWidth
      ? event.clientX - tooltipWidth - offset 
      : event.clientX + offset;

    const top = event.clientY + offset + tooltipHeight > window.innerHeight
      ? event.clientY - tooltipHeight - offset
      : event.clientY + offset;

    tooltipEl.style.left = `${left}px`;
    tooltipEl.style.top = `${top}px`;

    // tampilkan ke layar
    tooltipEl.style.display = 'block';
}


export function hideTooltip(): void {
  if (tooltipEl) tooltipEl.style.display = 'none';
}
