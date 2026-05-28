import type { MatchResult } from '../types';
import {showTooltip, hideTooltip} from './tooltip';

const HIGHLIGHT_CLASS = 'judol-highlight';
const HIGHLIGHT_ATTR = 'data-judol-keyword';

export function highlightTextNode(
  node: Text,
  keyword: string,
  result: MatchResult,
  localPositions: number[]
): void {
  const parent = node.parentNode;
  if(parent == null) return;

  for(const start of [...localPositions].reverse()){
    const keyLen = keyword.length;
    const after = node.splitText(start);
    after.splitText(keyLen);
    const mark = createHighlightElement(keyword, result);
    after.parentNode!.insertBefore(mark, after);
    mark.appendChild(after);

    mark.addEventListener('mouseenter', (e) => showTooltip(e as MouseEvent, result));
    mark.addEventListener('mouseleave', hideTooltip);
  }
}

function createHighlightElement(keyword: string, result: MatchResult): HTMLElement {
  const mark = document.createElement('mark');
  mark.className = HIGHLIGHT_CLASS;
  mark.setAttribute(HIGHLIGHT_ATTR, keyword);
  mark.dataset.count = result.count.toString();
  mark.dataset.keyword = keyword;
  return mark;
}

export function clearAllHighlights(): void {
  const marks = document.querySelectorAll(`.${HIGHLIGHT_CLASS}`);
  marks.forEach(mark => {
    const parent = mark.parentNode;
    if (!parent) return;
    mark.replaceWith(...Array.from(mark.childNodes));
    parent.normalize();
  });
}