// src/types.ts
// File ini milik bersama — jangan diubah sepihak tanpa diskusi tim

export type Algorithm = 'KMP' | 'BoyerMoore' | 'RegEx' | 'Fuzzy';

export interface MatchResult {
  keyword: string;        // Kata kunci yang terdeteksi (misal: 'GACOR')
  algorithm: Algorithm;   // Algoritma yang mendeteksi kata ini
  count: number;          // Total kemunculan kata ini di seluruh halaman
  executionTime: number;  // Waktu eksekusi algoritma untuk kata ini (dalam ms)
  
  /**
   * PENTING: Koordinat posisi indeks karakter di dalam string teks utuh halaman web.
   * Contoh: [45, 120] berarti kata ini dimulai pada indeks ke-45 dan ke-120.
   * Digunakan oleh Orang B untuk pemetaan highlighting pada DOM.
   */
  positions: number[];    
  
  isFuzzy: boolean;       // true jika ditemukan lewat Weighted Levenshtein
  similarity?: number;    // Skor kemiripan (0 hingga 1), hanya diisi jika isFuzzy = true
}

export interface ScanStats {
  totalMatches: number;                    // Akumulasi total semua match dari semua kata
  byAlgorithm: Record<Algorithm, number>;  // Jumlah total match per-algoritma (untuk grafik)
  executionByAlgorithm: Record<Algorithm, number>; // Total waktu (ms) yang dihabiskan tiap algoritma
  results: MatchResult[];                  // Array kumpulan semua MatchResult
}

// Format pertukaran pesan (Message Passing) antara Extension Popup dan Content Script
export interface ContentMessage {
  type: 'SCAN_START' | 'SCAN_COMPLETE' | 'SCAN_CLEAR';
  stats?: ScanStats; // Hanya disertakan saat type === 'SCAN_COMPLETE'
}