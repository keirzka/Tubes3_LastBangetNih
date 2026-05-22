// src/popup/popup.ts

import type { ScanStats, ContentMessage } from '../types';
import '../styles/popup.css';

declare const chrome: any;

/**
 * Kirim perintah scan ke content script yang sedang aktif di tab ini.
 * Komunikasi popup ↔ content script pakai chrome.tabs.sendMessage.
 */
async function triggerScan(): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab.id) return;
  
  // TODO: kirim message ke content script
  // Petunjuk: chrome.tabs.sendMessage(tab.id, { type: 'SCAN_START' })
  // Content script akan balas lewat chrome.runtime.sendMessage
  chrome.tabs.sendMessage(tab.id, { type: 'SCAN_START' });
}

/**
 * Render bar chart perbandingan jumlah match antar algoritma.
 * Pakai CSS width % sebagai bar — tidak perlu library chart.
 * 
 * Yang perlu kamu implementasikan:
 * - Hitung nilai maksimum untuk normalisasi lebar bar
 * - Buat elemen bar secara programatik untuk tiap algoritma
 * - Tampilkan label dan angka di samping bar
 */
function renderChart(stats: ScanStats): void {
    const container = document.getElementById('chart-container');
    if (!container) return;

    container.innerHTML = ''; // bersihkan dulu

    // TODO: buat bar chart dari stats.byAlgorithm

    // set nilai tertinggi
    const counts = Object.values(stats.byAlgorithm);
    const maxCount = Math.max(...counts, 0);

    // statistik setiap algoritma
    Object.entries(stats.byAlgorithm).forEach(([algo, count]) => { 
        const percentage = maxCount > 0? (count/maxCount) * 100 : 0;

        // row container algoritma
        const row = document.createElement('div');
        row.className = 'chart-row';

        // label nama algoritma
        const label = document.createElement('div');
        label.className = 'chart-label';
        label.textContent = algo;

        // background bar
        const barTrack = document.createElement('div');
        barTrack.className = 'bar-track';

        // fill bar sesuai persentase
        const barFill = document.createElement('div');
        barFill.className = 'bar-fill';
        barFill.style.width = `${percentage}%`;

        barTrack.appendChild(barFill);
        row.appendChild(label);
        row.appendChild(barTrack);

        const countLabel = document.createElement('div');
        countLabel.textContent = String(count);
        row.appendChild(countLabel);

        container.appendChild(row);
    });
}

/**
 * Render tabel waktu eksekusi per algoritma.
 */
function renderTiming(stats: ScanStats): void {
  // TODO: implementasikan
    const container = document.getElementById('table-container');
    if (!container) return;

    container.innerHTML = ''; // bersihkan dulu

    // Buat tabel utama
    const table = document.createElement("table");
    table.className = "main-table";
    
    const thead = table.createTHead();
    const tbody = table.createTBody();

    // Header tabel
    const headerRow = thead.insertRow();
    const headers = ["Algorithm", "Execution Time (ms)"];

    headers.forEach(text => {
      const th = document.createElement("th");
      th.textContent = text;
      headerRow.appendChild(th);
    });

    // Data tabel untuk waktu eksekusi setiap algoritma
    Object.entries(stats.executionByAlgorithm).forEach(([algo, time]) => {
      const row = tbody.insertRow();
      row.insertCell().textContent = algo;
      row.insertCell().textContent = `${time.toFixed(2)} ms`; 
    });

        container.appendChild(table);
    }

/**
 * Update semua UI berdasarkan stats terbaru.
 */
function updateUI(stats: ScanStats): void {
  const totalEl = document.getElementById('total-count');
  if (totalEl) totalEl.textContent = `${stats.totalMatches} match ditemukan`;
  
  renderChart(stats);
  renderTiming(stats);
}

// Dengarkan pesan dari content script
chrome.runtime.onMessage.addListener((message: ContentMessage) => {
  if (message.type === 'SCAN_COMPLETE' && message.stats) {
    updateUI(message.stats);
  }
});

// Attach event listener ke tombol
document.getElementById('scan-btn')?.addEventListener('click', triggerScan);
document.getElementById('clear-btn')?.addEventListener('click', async () => {
    // TODO: kirim SCAN_CLEAR ke content script
    // cari tab
    const [tab] = await chrome.tabs.query({ 
    active: true, 
    currentWindow: true });
    if (!tab.id) return;

    // hapus highlight
    chrome.tabs.sendMessage(tab.id, { type: 'SCAN_CLEAR' });

    // clear tooltip dan chart 
    const totalEl = document.getElementById('total-count');
    if (totalEl) totalEl.textContent = 'no match found';

    const chartContainer = document.getElementById('chart-container');
    if (chartContainer) chartContainer.innerHTML = '';

    const tableContainer = document.getElementById('table-container');
    if (tableContainer) tableContainer.innerHTML = '';
});