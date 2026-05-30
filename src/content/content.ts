import '../styles/tooltip.css';
import { initTooltip } from './tooltip';
import { clearAllHighlights } from './highlighter';
import { collectTextNodes, applyHighlights } from './scanner';
import type { ContentMessage, ScanStats } from '../types';
import { searchAlgorithm } from '../algorithms/searchAlgorithm';
import { clearAllBlurs } from './blurCensor';
import { scanImages, clearAllImageBlurs, reapplyImageBlurs } from './ocrScanner';

declare const chrome: any;

initTooltip();

async function runScan(): Promise<void> {
  clearAllHighlights();

  const { textNodes, fullText, nodeOffsets } = collectTextNodes();
  const stats: ScanStats = await searchAlgorithm(fullText);
  await applyHighlights(stats, textNodes, nodeOffsets, fullText);

  try {
    await scanImages(stats);
  } catch (err) {
    console.warn('[OCR] Error:', err);
  }

  await chrome.storage.local.set({ lastStats: stats, wasCleared: false });

  try {
    chrome.runtime.sendMessage({ type: 'SCAN_COMPLETE', stats });
  } catch {
  }
}

chrome.runtime.onMessage.addListener((message: ContentMessage) => {
  if (message.type === 'SCAN_START') runScan();

  if (message.type === 'SCAN_CLEAR') {
    clearAllHighlights();
    clearAllBlurs();
    clearAllImageBlurs();
    chrome.storage.local.set({ wasCleared: true });
    chrome.storage.local.remove('lastStats');
  }

  if (message.type === 'SET_BLUR') {
    if (message.blurEnabled) {
      const highlights = document.querySelectorAll('.judol-highlight');
      if (highlights.length > 0) {
        highlights.forEach(el => {
          (el.parentElement as HTMLElement)?.classList.add('judol-blur');
        });
        reapplyImageBlurs();
      } else {
        runScan();
      }
    } else {
      clearAllBlurs();
    }
  }
});

async function bluring(): Promise<void> {
  const storage = await chrome.storage.local.get(['blurEnabled', 'wasCleared']);
  const isBlurEnabled = storage.blurEnabled !== undefined ? storage.blurEnabled : false;
  const wasCleared = storage.wasCleared !== undefined ? storage.wasCleared : false;

  if (isBlurEnabled && !wasCleared) {
    runScan();
  }
}

bluring();