import type { ScanStats, ContentMessage } from '../types';
import '../styles/popup.css';

declare const chrome: any;


// Trigger scan ke konten script pada tab aktif

async function triggerScan(): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab.id) return;
  
  // Kirim message ke content script
  chrome.tabs.sendMessage(tab.id, { type: 'SCAN_START' });
}


// Render visualisasi statistik jumlah match setiap algoritma

function renderChart(stats: ScanStats): void {
    const container = document.getElementById('chart-container');
    if (!container) return;

    container.innerHTML = ''; 

    // set nilai tertinggi untuk batas statistik
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


// Render tabel waktu eksekusi setiap algoritma

function renderTiming(stats: ScanStats): void {
    const container = document.getElementById('table-container');
    if (!container) return;

    container.innerHTML = ''; 

    // Create tabel utama
    const table = document.createElement("table");
    table.className = "main-table";
    
    const thead = table.createTHead();
    const tbody = table.createTBody();

    // Header tabel
    const headerRow = thead.insertRow();
    const headers = ["Algorithm", "Execution Time (µs)"];

    headers.forEach(text => {
      const th = document.createElement("th");
      th.textContent = text;
      headerRow.appendChild(th);
    });

    // Data tabel untuk waktu eksekusi setiap algoritma
    Object.entries(stats.executionByAlgorithm).forEach(([algo, time]) => {
      const row = tbody.insertRow();
      row.insertCell().textContent = algo;
      row.insertCell().textContent = `${(time * 1000).toFixed(3)} μs`; 
    });

        container.appendChild(table);
    }


// Update UI terbaru

function updateUI(stats: ScanStats): void {
  const totalEl = document.getElementById('total-count');
  const chartSection = document.getElementById('chart-section');
  const timingSection = document.getElementById('timing-section');

  if (totalEl) {
    if (stats.totalMatches > 0) {
      totalEl.textContent = `Total Keyword Matches : ${stats.totalMatches}`;
      
      // tampilkan section jika ada hasil match
      if (chartSection) chartSection.style.display = 'block';
      if (timingSection) timingSection.style.display = 'block';
      
      // Jalankan fungsi render statistik dan tabel
      renderChart(stats);
      renderTiming(stats);
    } else {
      totalEl.textContent = 'No Match Found';
      
      // hide statistik dan tabel jika tidak ada keyword match
      if (chartSection) chartSection.style.display = 'none';
      if (timingSection) timingSection.style.display = 'none';
    }
  }
}

// load dari storage
async function loadStoredStats(): Promise<void> {
  const result = await chrome.storage.session.get('lastStats');
  if (result.lastStats) {
    updateUI(result.lastStats);
  }
}

loadStoredStats();

// terima pesan dari content script
chrome.runtime.onMessage.addListener((message: ContentMessage) => {
  if (message.type === 'SCAN_COMPLETE' && message.stats) {
    updateUI(message.stats);
  }
});

// Attach event listener ke tombol

// Scan Page
document.getElementById('scan-btn')?.addEventListener('click', triggerScan);

// Clear highlight di page
document.getElementById('clear-btn')?.addEventListener('click', async () => {
    // cari tab
    const [tab] = await chrome.tabs.query({ 
    active: true, 
    currentWindow: true });
    if (!tab.id) return;

    // hapus highlight
    chrome.tabs.sendMessage(tab.id, { type: 'SCAN_CLEAR' });

    // clear tooltip dan chart 
    const totalEl = document.getElementById('total-count');
    if (totalEl) totalEl.textContent = 'No Match Found';

    const chartSection = document.getElementById('chart-section');
    const timingSection = document.getElementById('timing-section');
    
    if (chartSection) chartSection.style.display = 'none';
    if (timingSection) timingSection.style.display = 'none';

    const chartContainer = document.getElementById('chart-container');
    if (chartContainer) chartContainer.innerHTML = '';

    const tableContainer = document.getElementById('table-container');
    if (tableContainer) tableContainer.innerHTML = '';

    await chrome.storage.session.remove('lastStats');
});

// Event listener Togel Blur
const blurToggle = document.getElementById('blur-toggle') as HTMLInputElement;

if (blurToggle) {
  // Load state saat popup dibuka menggunakan async/await agar seragam
  (async () => {
    const res = await chrome.storage.local.get('blurEnabled');
    blurToggle.checked = res.blurEnabled !== undefined ? res.blurEnabled : false;
  })();

  // Listener ketika toggle digeser
  blurToggle.addEventListener('change', async () => {
    const enabled = blurToggle.checked;
    
    // Simpan status terbaru ke storage lokal
    await chrome.storage.local.set({ blurEnabled: enabled });
    
    // Kirim pesan ke content script di tab aktif agar langsung mem-blur / menghapus blur saat itu juga
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'SET_BLUR', blurEnabled: enabled });
    }
  });
}