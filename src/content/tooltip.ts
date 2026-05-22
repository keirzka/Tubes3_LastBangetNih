// src/content/tooltip.ts

import type { MatchResult } from '../types';

// Tooltip adalah elemen tunggal yang berpindah-pindah, bukan dibuat per highlight
let tooltipEl: HTMLElement | null = null;

/**
 * Inisialisasi tooltip — panggil sekali saat content script load.
 * Tooltip dibuat sebagai custom DOM element, bukan menggunakan title attribute.
 */
export function initTooltip(): void {
    tooltipEl = document.createElement('div');
    tooltipEl.id = 'judol-tooltip';

    // TODO: tambahkan style inline atau class CSS
    // Penting: gunakan position:fixed agar tidak terpengaruh scroll
    // z-index harus sangat tinggi (misal 999999) agar selalu di atas konten
    // pointer-events: none agar tidak menghalangi interaksi user

    // masukkan ke halaman web
    document.body.appendChild(tooltipEl);
}

/**
 * Tampilkan tooltip saat hover pada elemen highlight.
 * Kamu perlu attach listener ini ke setiap mark yang dibuat highlighter.
 */
export function showTooltip(event: MouseEvent, result: MatchResult): void {
  if (!tooltipEl) return;
  
  // TODO: isi konten tooltip dengan 4 info wajib:
  // - Keyword yang terdeteksi
  // - Algoritma yang digunakan  
  // - Jumlah kemunculan
  // - Waktu eksekusi
  // Petunjuk: gunakan innerHTML atau buat child element secara programatik
  
  // TODO: posisikan tooltip di dekat cursor
  // Petunjuk: event.clientX dan event.clientY adalah posisi cursor
  // Tambahkan offset kecil (misal +12px) agar tidak tepat di bawah cursor
  
    tooltipEl.innerHTML = ``;

    // judul : keyword
    const keywordEl = document.createElement('h3');
    keywordEl.textContent = `Keyword: ${result.keyword}`;
    tooltipEl.appendChild(keywordEl);

    // algoritma
    const algoEl = document.createElement('div');
    algoEl.textContent = `Algorithm: ${result.algorithm}`;
    tooltipEl.appendChild(algoEl);

    // waktu eksekusi
    const timeEl = document.createElement('div');
    timeEl.textContent = `Execution Time: ${result.executionTime}`;
    tooltipEl.appendChild(timeEl);

    // count keyword
    const countEl = document.createElement('div');
    countEl.textContent = `Count: ${result.count}`;
    tooltipEl.appendChild(countEl);

    // similarity Fuzzy matching (kalau ada)
    if(result.isFuzzy && result.similarity != undefined){
        const fuzzyEl = document.createElement('div');
        fuzzyEl.textContent = `Fuzzy Similarity : ${(result.similarity * 100).toFixed(0)}%`;
        tooltipEl.appendChild(fuzzyEl);
    }

    // set posisi tooltip
    const offset = 12; // Jarak aman agar kotak tooltip tidak tertutup tepat di bawah kursor
    tooltipEl.style.left = `${event.clientX + offset}px`;
    tooltipEl.style.top = `${event.clientY + offset}px`;

    // tampilkan ke layar
    tooltipEl.style.display = 'block';
}


export function hideTooltip(): void {
  if (tooltipEl) tooltipEl.style.display = 'none';
}
