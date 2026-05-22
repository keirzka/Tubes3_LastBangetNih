// src/content/content.ts
// Entry point utama yang di-inject ke setiap halaman

import { initTooltip } from './tooltip';
import { clearAllHighlights, highlightTextNode } from './highlighter';
import { ContentMessage, ScanStats } from '../types';

// Saat ini pakai mock — GANTI dengan import dari algorithms/ milik A saat integrasi
import { getMockStats } from '../mock/mockResult';

declare const chrome: any;

initTooltip();

/**
 * Orchestrator utama scan.
 * Alur: ambil semua teks dari DOM → jalankan matching → highlight hasil → kirim stats ke popup
 * 
 * Saat ini menggunakan mock. Saat integrasi dengan A, ganti getMockStats()
 * dengan pemanggilan fungsi algoritma asli.
 */
async function runScan(): Promise<void> {
  clearAllHighlights();
  
  // TODO saat integrasi: ganti baris ini dengan pemanggilan ke modul A
  // const results = await runAllAlgorithms(extractTextFromDOM());
  const stats: ScanStats = getMockStats();
  
  // TODO: jalankan highlightTextNode() untuk setiap result
  // kumpulkan semua text node dengan TreeWalker
  const textNode: Text[] = [];
  let fullText = "";

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
        // Hindari script, style, atau elemen tooltip kita sendiri agar tidak ikut ter-scan
        const parentTag = node.parentNode?.nodeName;
        const parentElement = node.parentNode as HTMLElement;
        if (
          parentTag === 'SCRIPT' || 
          parentTag === 'STYLE' || 
          parentElement?.id === 'judol-tooltip'
        ) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
    }
  });

  let currentNode = walker.nextNode();

  while(currentNode) {
    textNode.push(currentNode as Text);
    currentNode = walker.nextNode();
  }

  // bangun peta offset
  const nodeOffsets: number[] = [];
  textNode.forEach((node) => {
    nodeOffsets.push(fullText.length);
    fullText += node.textContent || "";
  });

  // cari node yang tepat
  stats.results.forEach((res) => {
    res.positions.forEach((pos) => {
      let targetNodeIdx = -1;
      for(let i = 0; i < nodeOffsets.length; i++){
        const startOffset = nodeOffsets[i];
        // akhir node adalah awal node berikutnya
        const endOffset = (i + 1 < nodeOffsets.length) ? nodeOffsets[i + 1] : fullText.length;
        
        if(pos >= startOffset && pos < endOffset){
          targetNodeIdx = i;
          break;
        }
      }
      
      if(targetNodeIdx !== -1){
        const node = textNode[targetNodeIdx];
        const nodeStartOffset = nodeOffsets[targetNodeIdx];
        const localPos = pos - nodeStartOffset;
        highlightTextNode(node, res.keyword, res, [localPos]);
      }
    })
  })
  // Kirim hasil ke popup
  chrome.runtime.sendMessage({
    type: 'SCAN_COMPLETE',
    stats,
  });
}

// Dengarkan perintah dari popup
chrome.runtime.onMessage.addListener((message: ContentMessage) => {
  if (message.type === 'SCAN_START') runScan();
  if (message.type === 'SCAN_CLEAR') clearAllHighlights();
});