import type { ScanStats } from '../types';
import { highlightTextNode } from './highlighter';
import { applyBlurToElement } from './blurCensor';

declare const chrome: any;

// Scan semua text node dari DOM, return array text node untuk highlight dan teks gabungan seluruh page untuk algoritma matching

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


// Memetakan setiap posisi match ke text node yang tepat untuk highlight

export async function applyHighlights(
  stats: ScanStats,
  textNodes: Text[],
  nodeOffsets: number[],
  fullText: string
): Promise<void> {
  const storage = await chrome.storage.local.get('blurEnabled');
  const isBlurEnabled = !!storage.blurEnabled;

  stats.results.forEach((res) => {
    // simpan semua posisi node untuk keyword ini
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
          
      // Blur teks
      if (isBlurEnabled) {
        const parentEl = textNodes[nodeIdx].parentElement;
        if (parentEl) {
          applyBlurToElement(parentEl);
        }
      }
    });
  });
}


// Getter untuk fullTextn untuk passing full text ke algoritma

export function getFullPageText(): { textNodes: Text[]; fullText: string; nodeOffsets: number[] } {
  return collectTextNodes();
}