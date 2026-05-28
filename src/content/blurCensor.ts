declare const chrome: any;

const BLUR_CLASS = 'judol-blur';

export function applyBlurToElement(element: HTMLElement): void {
  if (!element.classList.contains(BLUR_CLASS)) {
    element.classList.add(BLUR_CLASS);
  }
}

export function clearAllBlurs(): void {
  document.querySelectorAll(`.${BLUR_CLASS}`)
    .forEach(el => el.classList.remove(BLUR_CLASS));
}

export function setBlurEnabled(enabled: boolean): void {
  // Simpan state ke storage agar persisten
  chrome.storage.local.set({ blurEnabled: enabled });
  if (!enabled) clearAllBlurs();
}