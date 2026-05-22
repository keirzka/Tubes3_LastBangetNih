// src/content/scanner.ts

import type { ScanStats } from '../types';
import { highlightTextNode } from './highlighter';

/**
 * Kumpulkan semua text node yang relevan dari DOM.
 * Mengembalikan dua hal: array text node, dan string teks gabungan seluruh halaman.
 * 
 * Mengapa kita butuh keduanya?
 * - textNodes: dipakai untuk memanggil highlightTextNode (butuh node asli)
 * - fullText: dipakai oleh Orang A untuk menjalankan algoritma matching di atasnya
 *   (KMP, BM, RegEx semuanya bekerja pada string biasa, bukan DOM)
 */
export function collectTextNodes(): { textNodes: Text[]; fullText: string; nodeOffsets: number[] } {
  const textNodes: Text[] = [];
  const nodeOffsets: number[] = [];
  let fullText = '';

  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        const parent = node.parentNode as HTMLElement;
        const tag = parent?.nodeName;

        // Jangan scan konten dari tag-tag ini
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') {
          return NodeFilter.FILTER_REJECT;
        }

        // Jangan scan elemen milik extension kita sendiri
        if (parent?.id === 'judol-tooltip' || parent?.classList?.contains('judol-highlight')) {
          return NodeFilter.FILTER_REJECT;
        }

        // Lewati text node yang hanya berisi whitespace
        if (!node.textContent?.trim()) {
          return NodeFilter.FILTER_SKIP;
        }

        return NodeFilter.FILTER_ACCEPT;
      },
    }
  );

  let current = walker.nextNode();
  while (current) {
    const node = current as Text;
    nodeOffsets.push(fullText.length); // catat di mana node ini mulai dalam fullText
    fullText += node.textContent ?? '';
    textNodes.push(node);
    current = walker.nextNode();
  }

  return { textNodes, fullText, nodeOffsets };
}

/**
 * Setelah Orang A menjalankan algoritma dan menghasilkan ScanStats,
 * fungsi ini memetakan setiap posisi match ke text node yang tepat,
 * lalu memanggil highlightTextNode.
 * 
 * Inilah "jembatan" antara dunia algoritma string (Orang A)
 * dengan dunia DOM manipulation (kamu, Orang B).
 */
export function applyHighlights(
  stats: ScanStats,
  textNodes: Text[],
  nodeOffsets: number[],
  fullText: string
): void {
  stats.results.forEach((res) => {
    // Kumpulkan dulu semua localPosition per node untuk keyword ini
    // Kenapa dikumpulkan dulu? Karena highlightTextNode harus menerima
    // semua posisi dalam satu node sekaligus (untuk diproses mundur/reverse)
    const positionsPerNode = new Map<number, number[]>();

    res.positions.forEach((pos) => {
      // Validasi: posisi tidak boleh melebihi panjang teks
      if (pos < 0 || pos >= fullText.length) return;

      // Cari node mana yang mengandung posisi ini
      let targetIdx = -1;
      for (let i = 0; i < nodeOffsets.length; i++) {
        const start = nodeOffsets[i];
        const end = i + 1 < nodeOffsets.length ? nodeOffsets[i + 1] : fullText.length;

        if (pos >= start && pos < end) {
          targetIdx = i;
          break;
        }
      }

      if (targetIdx === -1) return;

      // Hitung posisi lokal dalam node ini
      const localPos = pos - nodeOffsets[targetIdx];

      // Pastikan keyword tidak melewati batas node
      // (kasus edge: keyword terpotong antar dua text node)
      const nodeText = textNodes[targetIdx].textContent ?? '';
      if (localPos + res.keyword.length > nodeText.length) return;

      // Kumpulkan per node
      if (!positionsPerNode.has(targetIdx)) {
        positionsPerNode.set(targetIdx, []);
      }
      positionsPerNode.get(targetIdx)!.push(localPos);
    });

    // Sekarang highlight per node
    positionsPerNode.forEach((localPositions, nodeIdx) => {
      highlightTextNode(textNodes[nodeIdx], res.keyword, res, localPositions);
    });
  });
}

/**
 * Getter untuk fullText — dipakai Orang A saat integrasi.
 * Orang A akan memanggil fungsi ini untuk mendapatkan teks halaman,
 * lalu menjalankan KMP/BM/RegEx di atasnya.
 */
export function getFullPageText(): { textNodes: Text[]; fullText: string; nodeOffsets: number[] } {
  return collectTextNodes();
}