import Tesseract from 'tesseract.js';
import { searchAlgorithm } from '../algorithms/searchAlgorithm';
import type { ScanStats, MatchResult } from '../types';
import { showTooltip, hideTooltip } from './tooltip';

const PROCESSED_ATTR = 'data-judol-ocr-checked';
const DETECTED_ATTR  = 'data-judol-ocr-detected';

const imageControllers = new Map<HTMLImageElement, AbortController>();

async function extractTextFromImage(imgEl: HTMLImageElement): Promise<string> {
    try {
        const result = await Tesseract.recognize(imgEl.src, 'ind+eng', {
            logger: () => {},
        });
        return result.data.text ?? '';
    } catch (err) {
        console.warn('[OCR] Gagal proses gambar:', imgEl.src.slice(0, 80), err);
        return '';
    }
}

function blurImage(imgEl: HTMLImageElement, results: MatchResult[]): void {
    imgEl.style.filter = 'blur(12px)';
    imgEl.style.transition = 'filter 0.3s ease';
    imgEl.style.cursor = 'pointer';
    imgEl.setAttribute(DETECTED_ATTR, 'true');

    const oldController = imageControllers.get(imgEl);
    if (oldController) oldController.abort();

    const controller = new AbortController();
    imageControllers.set(imgEl, controller);

    imgEl.addEventListener('mouseenter', (e) => {
        const mouseEvent = e as MouseEvent;
        
        results.forEach((result, idx) => {
            const offsetEvent = new MouseEvent('mouseenter', {
                clientX: mouseEvent.clientX,
                clientY: mouseEvent.clientY + idx * 90, 
                bubbles: true,
            });
            if (idx === 0) {
                showTooltip(offsetEvent, result);
            } else {
                showTooltip(offsetEvent, result);
            }
        });
        
        showTooltip(mouseEvent, results[0]);
        
        if (results.length > 1) {
            appendExtraTooltips(mouseEvent, results.slice(1));
        }
    }, { signal: controller.signal });

    imgEl.addEventListener('mouseleave', () => {
        hideTooltip();
        removeExtraTooltips();
    }, { signal: controller.signal });
}

function appendExtraTooltips(event: MouseEvent, results: MatchResult[]): void {
    removeExtraTooltips();
    results.forEach((result, idx) => {
        const el = document.createElement('div');
        el.className = 'judol-extra-tooltip';
        el.style.cssText = `
            position: fixed;
            z-index: 999998;
            pointer-events: none;
            background-color: #3f3a42;
            color: #f5e6eb;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-family: sans-serif;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.5);
            border: 1px solid #db2777;
        `;

        const t = result.executionTimes;
        const fmt = (v?: number) => v !== undefined ? `${(v * 1000).toFixed(3)} µs` : '-';
        const algoLabels: string[] = [];
        if (t.KMP !== undefined) algoLabels.push('KMP');
        if (t.BoyerMoore !== undefined) algoLabels.push('BM');
        if (t.AhoCorasick !== undefined) algoLabels.push('AC');
        if (t.RabinKarp !== undefined) algoLabels.push('RK');
        if (t.RegEx !== undefined) algoLabels.push('RegEx');
        if (t.Fuzzy !== undefined) algoLabels.push('Fuzzy');
        const timeValues: string[] = [];
        if (t.KMP !== undefined) timeValues.push(fmt(t.KMP));
        if (t.BoyerMoore !== undefined) timeValues.push(fmt(t.BoyerMoore));
        if (t.AhoCorasick !== undefined) timeValues.push(fmt(t.AhoCorasick));
        if (t.RabinKarp !== undefined) timeValues.push(fmt(t.RabinKarp));
        if (t.RegEx !== undefined) timeValues.push(fmt(t.RegEx));
        if (t.Fuzzy !== undefined) timeValues.push(fmt(t.Fuzzy));

        el.innerHTML = `
            <h3 style="margin:0 0 4px;color:#f472b6;font-weight:bold;font-size:14px;">Keyword : "${result.keyword}"</h3>
            <div>Algorithm : ${algoLabels.join(' | ')}</div>
            <div>Count : ${result.count}</div>
            <div>Execution Time : ${timeValues.join(' | ')}</div>
            ${result.isFuzzy && result.similarity !== undefined ? `<div>Fuzzy Similarity : ${(result.similarity * 100).toFixed(0)}%</div>` : ''}
        `;

        const offset = 12;
        const tooltipWidth = 200;
        const tooltipHeight = 100;
        
        const baseOffset = (idx + 1) * (tooltipHeight + 8);
        const left = event.clientX + offset + tooltipWidth > window.innerWidth
            ? event.clientX - tooltipWidth - offset
            : event.clientX + offset;
        const top = event.clientY + offset + baseOffset;

        el.style.left = `${left}px`;
        el.style.top = `${top}px`;

        document.body.appendChild(el);
    });
}

function removeExtraTooltips(): void {
    document.querySelectorAll('.judol-extra-tooltip').forEach(el => el.remove());
}

function unblurImage(imgEl: HTMLImageElement): void {
    imgEl.style.filter = '';
    imgEl.style.cursor = '';
    imgEl.removeAttribute(DETECTED_ATTR);
    imgEl.removeAttribute(PROCESSED_ATTR);
    
    const controller = imageControllers.get(imgEl);
    if (controller) {
        controller.abort();
        imageControllers.delete(imgEl);
    }
}

export async function scanImages(stats: ScanStats): Promise<number> {
    const images = Array.from(document.querySelectorAll('img')) as HTMLImageElement[];
    const unprocessed = images.filter(img =>
        !img.hasAttribute(PROCESSED_ATTR) &&
        img.complete &&
        img.src &&
        img.naturalWidth > 0
    );

    if (unprocessed.length === 0) return 0;

    let detectedCount = 0;

    for (const img of unprocessed) {
        img.setAttribute(PROCESSED_ATTR, 'true');

        const extractedText = await extractTextFromImage(img);
        if (!extractedText.trim()) continue;

        const ocrStats = await searchAlgorithm(extractedText);

        if (ocrStats.totalMatches > 0) {
            detectedCount++;
            console.log(`[OCR] Gambar terdeteksi judol (${ocrStats.totalMatches} match):`, img.src.slice(0, 80));

            blurImage(img, ocrStats.results);

            stats.totalMatches += ocrStats.totalMatches;
            for (const result of ocrStats.results) {
                stats.results.push(result);
            }
            for (const [algo, count] of Object.entries(ocrStats.byAlgorithm) as [keyof typeof ocrStats.byAlgorithm, number][]) {
                stats.byAlgorithm[algo] += count;
            }
            for (const [algo, time] of Object.entries(ocrStats.executionByAlgorithm) as [keyof typeof ocrStats.executionByAlgorithm, number][]) {
                stats.executionByAlgorithm[algo] += time;
            }
        }
    }

    return detectedCount;
}

export function clearAllImageBlurs(): void {
    removeExtraTooltips();
    const detected = document.querySelectorAll(`img[${DETECTED_ATTR}]`) as NodeListOf<HTMLImageElement>;
    detected.forEach(img => unblurImage(img));
}

export function reapplyImageBlurs(): void {
    const detected = document.querySelectorAll(`img[${DETECTED_ATTR}]`) as NodeListOf<HTMLImageElement>;
    detected.forEach(img => {
        img.style.filter = 'blur(12px)';
    });
}