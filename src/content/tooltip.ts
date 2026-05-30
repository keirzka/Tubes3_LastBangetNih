import type { MatchResult } from '../types';

let tooltipEl: HTMLElement | null = null;

export function initTooltip(): void {
  const style = document.createElement('style');
  style.textContent = `
    #judol-tooltip{
      position: fixed;
      z-index: 999999;
      pointer-events: none;
      background-color: #3f3a42;
      color: #f5e6eb;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-family: sans-serif;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.5), 0 2px 4px -2px rgb(0 0 0 / 0.3);
      border: 1px solid #db2777;
      display: none;
    }

    #judol-tooltip h3{
        margin: 0 0 4px;
        color: #f472b6;
        font-weight: bold;
        font-size: 14px;
    }

    .judol-blur {
      filter: blur(6px);
      transition: filter 0.3s ease;
      cursor: pointer;
    }


    `;

  document.head.appendChild(style);
    tooltipEl = document.createElement('div');
    tooltipEl.id = 'judol-tooltip';
    // masukkan ke halaman web
    document.body.appendChild(tooltipEl);
}

export function showTooltip(event: MouseEvent, result: MatchResult): void {
  if (!tooltipEl) return;
    tooltipEl.innerHTML = ``;

    // judul : keyword
    const keywordEl = document.createElement('h3');
    keywordEl.textContent = `Keyword : "${result.keyword}"`;
    tooltipEl.appendChild(keywordEl);

    // algoritma
    const algoEl = document.createElement('div');
    const t = result.executionTimes;
    const algoLabels: string[] = [];
    if (t.KMP !== undefined) algoLabels.push('KMP');
    if (t.BoyerMoore !== undefined) algoLabels.push('BM');
    if (t.AhoCorasick !== undefined) algoLabels.push('AC');
    if (t.RabinKarp !== undefined) algoLabels.push('RK');
    if (t.RegEx !== undefined) algoLabels.push('RegEx');
    if (t.Fuzzy !== undefined) algoLabels.push('Fuzzy');
    algoEl.textContent = `Algorithm : ${algoLabels.join(' | ')}`;
    tooltipEl.appendChild(algoEl);

    // count keyword
    const countEl = document.createElement('div');
    countEl.textContent = `Count : ${result.count}`;
    tooltipEl.appendChild(countEl);

    // waktu eksekusi per algoritma
    const fmt = (v?: number) => v !== undefined ? `${(v * 1000).toFixed(3)} µs` : '-';
    const timeValues: string[] = [];
    if (t.KMP !== undefined) timeValues.push(fmt(t.KMP));
    if (t.BoyerMoore !== undefined) timeValues.push(fmt(t.BoyerMoore));
    if (t.AhoCorasick !== undefined) timeValues.push(fmt(t.AhoCorasick));
    if (t.RabinKarp !== undefined) timeValues.push(fmt(t.RabinKarp));
    if (t.RegEx !== undefined) timeValues.push(fmt(t.RegEx));
    if (t.Fuzzy !== undefined) timeValues.push(fmt(t.Fuzzy));
    const timeEl = document.createElement('div');
    timeEl.textContent = `Execution Time : ${timeValues.join(' | ')}`;
    tooltipEl.appendChild(timeEl);

    // similarity Fuzzy matching (kalau ada)
    if(result.isFuzzy && result.similarity != undefined){
        const fuzzyEl = document.createElement('div');
        fuzzyEl.textContent = `Fuzzy Similarity : ${(result.similarity * 100).toFixed(0)}%`;
        tooltipEl.appendChild(fuzzyEl);
    }

    // set posisi tooltip
    const offset = 12; 
    const tooltipWidth = 200; 
    const tooltipHeight = 120;

    const left = event.clientX + offset + tooltipWidth > window.innerWidth
      ? event.clientX - tooltipWidth - offset 
      : event.clientX + offset;

    const top = event.clientY + offset + tooltipHeight > window.innerHeight
      ? event.clientY - tooltipHeight - offset
      : event.clientY + offset;

    tooltipEl.style.left = `${left}px`;
    tooltipEl.style.top = `${top}px`;

    // tampilin ke layar
    tooltipEl.style.display = 'block';
}


export function hideTooltip(): void {
  if (tooltipEl) tooltipEl.style.display = 'none';
}