import type { MatchResult } from '../types';
import {showTooltip, hideTooltip} from './tooltip';

const HIGHLIGHT_CLASS = 'judol-highlight';
const HIGHLIGHT_ATTR = 'data-judol-keyword';

// Highlight semua teks yang cocok di dalam sebuah text node.
// Memecah text node menjadi beberapa node dengan splitText : teks-sebelum | <mark>teks-cocok</mark> | teks-sesudah

export function highlightTextNode(
  node: Text,
  keyword: string,
  result: MatchResult,
  localPositions: number[]  // posisi relatif dalam node ini
): void {
  // Split text mulai dari belakang agar tidak mempengaruhi indeks
  const parent = node.parentNode;
  if(parent == null) return;

  // loop mundur dari posisi keyword terakhir ditemukan
  for(const start of [...localPositions].reverse()){
    // panjang keyword
    const keyLen = keyword.length;
    // node : teks sebelum bagian split, after : teks keyword + setelahnya
    const after = node.splitText(start);
    // after : teks keyword, sisa : teks sesudah keyword
    after.splitText(keyLen);
    // buat mark
    const mark = createHighlightElement(keyword, result);
    // tambahkan teks setelah keyword
    after.parentNode!.insertBefore(mark, after);
    // masukkan kalimat yang sudah dimark
    mark.appendChild(after);

    // listener mouse
    mark.addEventListener('mouseenter', (e) => showTooltip(e as MouseEvent, result));
    mark.addEventListener('mouseleave', hideTooltip);
  }
}


// Buat elemen <mark> dengan atribut yang diperlukan tooltip

function createHighlightElement(keyword: string, result: MatchResult): HTMLElement {
  const mark = document.createElement('mark');
  mark.className = HIGHLIGHT_CLASS;
  mark.setAttribute(HIGHLIGHT_ATTR, keyword);
  // simpan data result ke elemen untuk diakses tooltip
  mark.dataset.algo = result.algorithm;
  mark.dataset.time = result.executionTime.toString();
  mark.dataset.count = result.count.toString();
  mark.dataset.keyword = keyword;
  return mark;
}

// Hapus semua highlight dari page untuk clear

export function clearAllHighlights(): void {
  const marks = document.querySelectorAll(`.${HIGHLIGHT_CLASS}`);
  marks.forEach(mark => {
    const parent = mark.parentNode;
    if (!parent) return;
    // hapus mark
    mark.replaceWith(...mark.childNodes);
    // satukan teks kembali
    parent.normalize();
  });
}