// src/content/content.ts

import '../styles/tooltip.css';
import { initTooltip } from './tooltip';
import { clearAllHighlights } from './highlighter';
import { collectTextNodes, applyHighlights } from './scanner';
import type { ContentMessage, ScanStats } from '../types';
import { getMockStats } from '../mock/mockResult';

declare const chrome: any;

initTooltip();

async function runScan(): Promise<void> {
  clearAllHighlights();

  // Kumpulkan teks dari DOM
  const { textNodes, fullText, nodeOffsets } = collectTextNodes();

  // TODO saat integrasi: kirim fullText ke algoritma Orang A
  // const stats = await runAllAlgorithms(fullText);
  const stats: ScanStats = getMockStats(); // sementara mock

  // Terapkan highlight berdasarkan hasil matching
  applyHighlights(stats, textNodes, nodeOffsets, fullText);

  chrome.runtime.sendMessage({ type: 'SCAN_COMPLETE', stats });
}

chrome.runtime.onMessage.addListener((message: ContentMessage) => {
  if (message.type === 'SCAN_START') runScan();
  if (message.type === 'SCAN_CLEAR') clearAllHighlights();
});