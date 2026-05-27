// src/content/highlighter.ts

import type { MatchResult } from '../types';
import {showTooltip, hideTooltip} from './tooltip';

// Nama class ini dipakai untuk cleanup — jangan ganti sembarangan
const HIGHLIGHT_CLASS = 'judol-highlight';
const HIGHLIGHT_ATTR = 'data-judol-keyword';

/**
 * Highlight semua teks yang cocok di dalam sebuah text node.
 * Fungsi ini memecah text node menjadi beberapa node:
 * teks-sebelum | <mark>teks-cocok</mark> | teks-sesudah
 *
 * Yang perlu kamu pahami:
 * - Kita tidak boleh langsung ubah innerHTML (bisa break event listener)
 * - Kita pakai splitText() untuk memecah text node secara aman
 * - positions[] dari MatchResult adalah posisi dalam string teks penuh halaman,
 *   tapi kamu perlu posisi DALAM node ini — perlu offset mapping dari scanner.ts
 */
export function highlightTextNode(
  node: Text,
  keyword: string,
  result: MatchResult,
  localPositions: number[]  // posisi relatif dalam node ini, bukan halaman
): void {
  // TODO: implementasikan logika split text node di sini
  // Petunjuk: gunakan node.splitText(start) lalu node.splitText(end) 
  // untuk mengisolasi bagian yang cocok, lalu bungkus dengan <mark>
  
  // Pastikan kamu bekerja dari posisi paling belakang ke depan
  // supaya offset tidak bergeser saat kamu memotong

  const parent = node.parentNode;
  if(parent == null) return;

  // loop mundur dari posisi keyword terakhir ditemukan
  for(const start of [...localPositions].reverse()){
    // panjang keyword
    const keyLen = keyword.length;
    // node : teks sebelum bagian split, after : teks keyword + setelahnya
    const after = node.splitText(start);
    // after : teks keyword, sisa : teks sesudah keyword
    after.splitText(keyLen);
    // buat mark
    const mark = createHighlightElement(keyword, result);
    // tambahkan teks setelah keyword
    after.parentNode!.insertBefore(mark, after);
    // masukkan kalimat yang sudah dimark
    mark.appendChild(after);

    // listener mouse
    mark.addEventListener('mouseenter', (e) => showTooltip(e as MouseEvent, result));
    mark.addEventListener('mouseleave', hideTooltip);
  }
}

/**
 * Buat elemen <mark> dengan atribut yang diperlukan tooltip.
 * Styling warna di CSS, bukan di sini.
 */
function createHighlightElement(keyword: string, result: MatchResult): HTMLElement {
  const mark = document.createElement('mark');
  mark.className = HIGHLIGHT_CLASS;
  mark.setAttribute(HIGHLIGHT_ATTR, keyword);
  // TODO: simpan data result ke elemen untuk diakses tooltip
  // Petunjuk: pakai mark.dataset atau simpan di WeakMap external
  mark.dataset.algo = result.algorithm;
  mark.dataset.time = result.executionTime.toString();
  mark.dataset.count = result.count.toString();
  mark.dataset.keyword = keyword;
  return mark;
}

/**
 * Hapus SEMUA highlight dari halaman — dipanggil sebelum rescan.
 * Harus mengembalikan DOM ke kondisi persis seperti sebelum highlight.
 */
export function clearAllHighlights(): void {
  const marks = document.querySelectorAll(`.${HIGHLIGHT_CLASS}`);
  marks.forEach(mark => {
    const parent = mark.parentNode;
    if (!parent) return;
    // hapus mark-mark
    mark.replaceWith(...mark.childNodes);
    // satukan teks kembali
    parent.normalize();
  });
}