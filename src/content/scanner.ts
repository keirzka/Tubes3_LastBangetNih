import type { ScanStats } from '../types';
import { highlightTextNode } from './highlighter';
import { applyBlurToElement } from './blurCensor';

declare const chrome: any;

function collectAllTextNodes(): { textNodes: Text[]; fullText: string; nodeOffsets: number[] } {
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

        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') {
          return NodeFilter.FILTER_REJECT;
        }

        if (parent?.id === 'judol-tooltip') {
          return NodeFilter.FILTER_REJECT;
        }

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
    nodeOffsets.push(fullText.length);
    fullText += node.textContent ?? '';
    textNodes.push(node);
    current = walker.nextNode();
  }

  return { textNodes, fullText, nodeOffsets };
}

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

        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') {
          return NodeFilter.FILTER_REJECT;
        }

        if (parent?.id === 'judol-tooltip' || parent?.classList?.contains('judol-highlight')) {
          return NodeFilter.FILTER_REJECT;
        }

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
    nodeOffsets.push(fullText.length);
    fullText += node.textContent ?? '';
    textNodes.push(node);
    current = walker.nextNode();
  }

  return { textNodes, fullText, nodeOffsets };
}

export async function applyHighlights(
  stats: ScanStats,
  textNodes: Text[],
  nodeOffsets: number[],
  fullText: string
): Promise<void> {
  const storage = await chrome.storage.local.get('blurEnabled');
  const isBlurEnabled = !!storage.blurEnabled;

  function highlightResults(
    resArray: typeof stats.results,
    nodes: Text[],
    offsets: number[],
    text: string
  ): void {
    resArray.forEach((res) => {
      const positionsPerNode = new Map<number, number[]>();

      res.positions.forEach((pos) => {
        if (pos < 0 || pos >= text.length) return;

        let targetIdx = -1;
        for (let i = 0; i < offsets.length; i++) {
          const start = offsets[i];
          const end = i + 1 < offsets.length ? offsets[i + 1] : text.length;
          if (pos >= start && pos < end) { targetIdx = i; break; }
        }
        if (targetIdx === -1) return;

        const localPos = pos - offsets[targetIdx];
        const nodeText = nodes[targetIdx].textContent ?? '';
        if (localPos + res.keyword.length > nodeText.length) return;

        if (!positionsPerNode.has(targetIdx)) positionsPerNode.set(targetIdx, []);
        positionsPerNode.get(targetIdx)!.push(localPos);
      });

      positionsPerNode.forEach((localPositions, nodeIdx) => {
        highlightTextNode(nodes[nodeIdx], res.matchedToken ?? res.keyword, res, localPositions);
        if (isBlurEnabled) {
          const parentEl = nodes[nodeIdx].parentElement;
          if (parentEl) applyBlurToElement(parentEl);
        }
      });
    });
  }

  const exactResults = stats.results.filter(r => !r.isFuzzy);
  highlightResults(exactResults, textNodes, nodeOffsets, fullText);

  const fuzzyResults = stats.results.filter(r => r.isFuzzy);
  if (fuzzyResults.length > 0) {
    const { textNodes: newNodes, fullText: newText, nodeOffsets: newOffsets } = collectAllTextNodes();
    highlightResults(fuzzyResults, newNodes, newOffsets, newText);
  }
}

export function getFullPageText(): { textNodes: Text[]; fullText: string; nodeOffsets: number[] } {
  return collectTextNodes();
}