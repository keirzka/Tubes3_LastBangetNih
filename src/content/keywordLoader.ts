declare const chrome: {
  runtime: {
      getURL: (path: string) => string;
  };
};
// ubah keywords.txt jd list of string
export async function loadKeywords(): Promise<string[]> {
  try{
    const url = chrome.runtime.getURL('keywords.txt'); 
    const res = await fetch(url);

    // validasi kalau file ga nemu atau gagal fetch
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const raw: string = await res.text();
    return raw
        .split('\n')
        .map((l: string) => l.trim().toLowerCase())
        .filter((l: string) => l.length > 0);
  } catch (err) {
    console.error('Gagal memuat keywords:', err);
    return []; 
  }
}