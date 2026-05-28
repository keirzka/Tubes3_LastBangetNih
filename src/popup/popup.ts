import type { ScanStats, ContentMessage } from '../types';
import '../styles/popup.css';

declare const chrome: any;
declare namespace chrome.storage {
  interface StorageChange { newValue?: any; oldValue?: any; }
}

async function triggerScan(): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab.id) return;

  await chrome.storage.local.remove('lastStats');

  const totalEl = document.getElementById('total-count');
  if (totalEl) totalEl.textContent = 'Scanning...';

  chrome.tabs.sendMessage(tab.id, { type: 'SCAN_START' });

  const startTime = Date.now();
  const poll = setInterval(async () => {
    const result = await chrome.storage.local.get('lastStats');
    if (result.lastStats) {
      clearInterval(poll);
      updateUI(result.lastStats);
    } else if (Date.now() - startTime > 120000) {
      clearInterval(poll);
      if (totalEl) totalEl.textContent = 'Scan timeout';
    }
  }, 500);
}

function renderChart(stats: ScanStats): void {
    const container = document.getElementById('chart-container');
    if (!container) return;

    container.innerHTML = ''; 

    const counts = Object.values(stats.byAlgorithm);
    const maxCount = Math.max(...counts, 0);

    Object.entries(stats.byAlgorithm).forEach(([algo, count]) => { 
        const percentage = maxCount > 0? (count/maxCount) * 100 : 0;

        const row = document.createElement('div');
        row.className = 'chart-row';

        const label = document.createElement('div');
        label.className = 'chart-label';
        label.textContent = algo;

        const barTrack = document.createElement('div');
        barTrack.className = 'bar-track';

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

function renderTiming(stats: ScanStats): void {
    const container = document.getElementById('table-container');
    if (!container) return;

    container.innerHTML = ''; 

    const table = document.createElement("table");
    table.className = "main-table";
    
    const thead = table.createTHead();
    const tbody = table.createTBody();

    const headerRow = thead.insertRow();
    const headers = ["Algorithm", "Execution Time (µs)"];

    headers.forEach(text => {
      const th = document.createElement("th");
      th.textContent = text;
      headerRow.appendChild(th);
    });

    Object.entries(stats.executionByAlgorithm).forEach(([algo, time]) => {
      const row = tbody.insertRow();
      row.insertCell().textContent = algo;
      row.insertCell().textContent = `${(time * 1000).toFixed(3)} μs`; 
    });

        container.appendChild(table);
    }

function updateUI(stats: ScanStats): void {
  const totalEl = document.getElementById('total-count');
  const chartSection = document.getElementById('chart-section');
  const timingSection = document.getElementById('timing-section');

  if (totalEl) {
    if (stats.totalMatches > 0) {
      totalEl.textContent = `Total Keyword Matches : ${stats.totalMatches}`;
      
      if (chartSection) chartSection.style.display = 'block';
      if (timingSection) timingSection.style.display = 'block';
      
      renderChart(stats);
      renderTiming(stats);
    } else {
      totalEl.textContent = 'No Match Found';
      
      if (chartSection) chartSection.style.display = 'none';
      if (timingSection) timingSection.style.display = 'none';
    }
  }
}

async function loadStoredStats(): Promise<void> {
  const result = await chrome.storage.local.get('lastStats');
  if (result.lastStats) {
    updateUI(result.lastStats);
  }
}

loadStoredStats();

chrome.storage.onChanged.addListener((changes: Record<string, chrome.storage.StorageChange>, area: string) => {
  if (area === 'local' && changes.lastStats?.newValue) {
    updateUI(changes.lastStats.newValue);
  }
});

chrome.runtime.onMessage.addListener((message: ContentMessage) => {
  if (message.type === 'SCAN_COMPLETE' && message.stats) {
    updateUI(message.stats);
  }
});

document.getElementById('scan-btn')?.addEventListener('click', triggerScan);

document.getElementById('clear-btn')?.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ 
    active: true, 
    currentWindow: true });
    if (!tab.id) return;

    chrome.tabs.sendMessage(tab.id, { type: 'SCAN_CLEAR' });

    const totalEl = document.getElementById('total-count');
    if (totalEl) totalEl.textContent = '';

    const chartSection = document.getElementById('chart-section');
    const timingSection = document.getElementById('timing-section');
    
    if (chartSection) chartSection.style.display = 'none';
    if (timingSection) timingSection.style.display = 'none';

    const chartContainer = document.getElementById('chart-container');
    if (chartContainer) chartContainer.innerHTML = '';

    const tableContainer = document.getElementById('table-container');
    if (tableContainer) tableContainer.innerHTML = '';

    await chrome.storage.local.remove('lastStats');
});

const blurToggle = document.getElementById('blur-toggle') as HTMLInputElement;

if (blurToggle) {
  (async () => {
    const res = await chrome.storage.local.get('blurEnabled');
    blurToggle.checked = res.blurEnabled !== undefined ? res.blurEnabled : false;
  })();

  blurToggle.addEventListener('change', async () => {
    const enabled = blurToggle.checked;
    
    await chrome.storage.local.set({ blurEnabled: enabled });
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'SET_BLUR', blurEnabled: enabled });
    }
  });
}