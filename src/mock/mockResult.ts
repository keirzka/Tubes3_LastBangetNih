// src/mock/mockResults.ts
// HAPUS file ini saat integrasi dengan algoritma utama

import { MatchResult, ScanStats, Algorithm } from '../types';

export function getMockResults(): MatchResult[] {
  return [
    {
      keyword: 'GACOR',
      algorithm: 'KMP',
      count: 3,
      executionTime: 1.2,
      positions: [45, 120, 340],
      isFuzzy: false,
    },
    {
      keyword: 'MAXWIN',
      algorithm: 'BoyerMoore',
      count: 1,
      executionTime: 0.8,
      positions: [200],
      isFuzzy: false,
    },
    {
      keyword: 'SLOT99',
      algorithm: 'RegEx',
      count: 2,
      executionTime: 0.3,
      positions: [88, 410],
      isFuzzy: false,
    },
    {
      keyword: 'HOKI',
      algorithm: 'Fuzzy',
      count: 1,
      executionTime: 4.5,
      positions: [290],
      isFuzzy: true,
      similarity: 0.82,
    },
  ];
}

export function getMockStats(): ScanStats {
  const results = getMockResults();

  // 1. Inisialisasi objek tracker dengan nilai awal 0
  const byAlgorithm: Record<Algorithm, number> = {
    KMP: 0,
    BoyerMoore: 0,
    RegEx: 0,
    Fuzzy: 0
  };

  const executionByAlgorithm: Record<Algorithm, number> = {
    KMP: 0,
    BoyerMoore: 0,
    RegEx: 0,
    Fuzzy: 0
  };

  // 2. Hitung total secara dinamis berdasarkan data di getMockResults()
  let totalMatches = 0;
  
  results.forEach((res) => {
    totalMatches += res.count;
    byAlgorithm[res.algorithm] += res.count;
    // Menghitung akumulasi waktu eksekusi per algoritma
    executionByAlgorithm[res.algorithm] += res.executionTime; 
  });

  return {
    totalMatches,
    byAlgorithm,
    executionByAlgorithm,
    results,
  };

}