import { initTooltip } from './tooltip';
import { clearAllHighlights } from './highlighter';
import { collectTextNodes, applyHighlights } from './scanner';
import type { ContentMessage, ScanStats } from '../types';
import { searchAlgorithm } from '../algorithms/searchAlgorithm';
import { clearAllBlurs } from './blurCensor';

declare const chrome: any;

initTooltip();

async function runScan(): Promise<void> {
  clearAllHighlights();

  // Kumpulkan teks dari DOM
  const { textNodes, fullText, nodeOffsets } = collectTextNodes();

  // Pass teks ke algoritma
  const stats: ScanStats = await searchAlgorithm(fullText);

  // Terapkan highlight berdasarkan hasil matching
  await applyHighlights(stats, textNodes, nodeOffsets, fullText);

  // simpan ke storage
  chrome.storage.session.set({ lastStats: stats });
  
  chrome.runtime.sendMessage({ type: 'SCAN_COMPLETE', stats });
}

// aksi button
chrome.runtime.onMessage.addListener((message: ContentMessage) => {
  if (message.type === 'SCAN_START') runScan();
  if (message.type === 'SCAN_CLEAR') clearAllHighlights();
  if (message.type === 'SET_BLUR') {
    if (message.blurEnabled) {
      const highlights = document.querySelectorAll('.judol-highlight');
      
      if (highlights.length > 0) {
        // blur page yang sudah di sa
        highlights.forEach(el => {
          (el.parentElement as HTMLElement)?.classList.add('judol-blur');
        });
      } else {
        // auto scan jika klik blur
        runScan();
      }
    } else {
      clearAllBlurs();
    }
  }
});

async function bluring(): Promise<void> {
  // Cek apakah fitur blur diaktifkan oleh user di storage
  const storage = await chrome.storage.local.get('blurEnabled');
  const isBlurEnabled = storage.blurEnabled !== undefined ? storage.blurEnabled : false;
  if (isBlurEnabled) {
    // Jika aktif, langsung jalankan scan otomatis tanpa nunggu klik tombol
    runScan();
  }
}

// Eksekusi fungsi saat script content dimuat
bluring();