const DB_NAME = 'be-hoc-vui-speech-cache';
const STORE_NAME = 'audio';
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getCachedBlob(key: string): Promise<Blob | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve(req.result as Blob | undefined);
    req.onerror = () => reject(req.error);
  });
}

async function setCachedBlob(key: string, blob: Blob): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const req = tx.objectStore(STORE_NAME).put(blob, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function cacheKey(text: string, geminiVoiceName: string, styleInstruction?: string): string {
  return `${geminiVoiceName}::${styleInstruction ?? ''}::${text}`;
}

export async function fetchSpeechAudioUrl(
  text: string,
  geminiVoiceName: string,
  styleInstruction?: string
): Promise<string> {
  const key = cacheKey(text, geminiVoiceName, styleInstruction);

  const cached = await getCachedBlob(key).catch(() => undefined);
  if (cached) {
    return URL.createObjectURL(cached);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  let res: Response;
  try {
    res = await fetch('/api/generate-speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({ text, voiceName: geminiVoiceName, styleInstruction }),
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw new Error(`Không tạo được giọng đọc (${res.status}): ${errBody}`);
  }

  const blob = await res.blob();
  await setCachedBlob(key, blob).catch(() => {});

  return URL.createObjectURL(blob);
}
