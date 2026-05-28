import '../styles/tooltip.css';
import { initTooltip } from './tooltip';
import { clearAllHighlights } from './highlighter';
import { collectTextNodes, applyHighlights } from './scanner';
import type { ContentMessage, ScanStats } from '../types';
import { searchAlgorithm } from '../algorithms/searchAlgorithm';

declare const chrome: any;

initTooltip();

async function runScan(): Promise<void> {
  clearAllHighlights();

  // Kumpulkan teks dari DOM
  const { textNodes, fullText, nodeOffsets } = collectTextNodes();

  // Pass teks ke algoritma
  const stats: ScanStats = await searchAlgorithm(fullText);

  // Terapkan highlight berdasarkan hasil matching
  applyHighlights(stats, textNodes, nodeOffsets, fullText);

  // simpan ke storage
  chrome.storage.session.set({ lastStats: stats });
  
  chrome.runtime.sendMessage({ type: 'SCAN_COMPLETE', stats });
}

// aksi button
chrome.runtime.onMessage.addListener((message: ContentMessage) => {
  if (message.type === 'SCAN_START') runScan();
  if (message.type === 'SCAN_CLEAR') clearAllHighlights();
});