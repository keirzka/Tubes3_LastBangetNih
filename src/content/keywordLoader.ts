declare const chrome: {
  runtime: {
      getURL: (path: string) => string;
  };
};
// Ubah keywords.txt jadi list of string
export async function loadKeywords(): Promise<string[]> {
  try{
    const url = chrome.runtime.getURL('keywords.txt'); 
    const res = await fetch(url);

    // Validasi jika file tidak ditemukan atau gagal fetch
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