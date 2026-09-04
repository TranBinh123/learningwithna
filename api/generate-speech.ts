export const config = {
  runtime: 'nodejs',
};

// Cho phép function chạy tối đa 30s (thay vì mặc định ~10s của Vercel Hobby) —
// Gemini TTS đôi khi cần vài giây, tránh bị nền tảng tự ngắt giữa chừng.
export const maxDuration = 30;

const GEMINI_MODEL = 'gemini-2.5-flash-preview-tts';
const GEMINI_TIMEOUT_MS = 20000;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Chỉ chấp nhận POST' });
    return;
  }

  const { text, voiceName, styleInstruction } = req.body ?? {};

  if (!text || typeof text !== 'string') {
    res.status(400).json({ error: 'Thiếu "text"' });
    return;
  }
  if (!voiceName || typeof voiceName !== 'string') {
    res.status(400).json({ error: 'Thiếu "voiceName"' });
    return;
  }
  if (text.length > 500) {
    res.status(400).json({ error: 'Câu quá dài' });
    return;
  }
  if (styleInstruction && typeof styleInstruction !== 'string') {
    res.status(400).json({ error: '"styleInstruction" không hợp lệ' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Server chưa cấu hình GEMINI_API_KEY' });
    return;
  }

  const promptText = styleInstruction
    ? `${styleInstruction}\n\nCâu cần đọc: "${text}"`
    : `Đọc câu sau bằng tiếng Việt chuẩn, tự nhiên, thân thiện với trẻ em: "${text}"`;

  const callGemini = () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
    return fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName } },
          },
        },
      }),
    }).finally(() => clearTimeout(timeoutId));
  };

  try {
    let geminiRes = await callGemini();

    if (!geminiRes.ok && geminiRes.status >= 500) {
      geminiRes = await callGemini();
    }

    if (!geminiRes.ok) {
      const detail = await geminiRes.text().catch(() => '');
      res.status(502).json({ error: 'Gemini API trả lỗi', detail });
      return;
    }

    const data = await geminiRes.json();
    const part = data?.candidates?.[0]?.content?.parts?.[0];
    const base64Audio: string | undefined = part?.inlineData?.data;

    if (!base64Audio) {
      res.status(502).json({ error: 'Không nhận được audio từ Gemini', detail: JSON.stringify(data).slice(0, 500) });
      return;
    }

    const pcmBuffer = Buffer.from(base64Audio, 'base64');
    const wavBuffer = pcmToWav(pcmBuffer, 24000, 1, 16);

    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.status(200).send(wavBuffer);
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      res.status(504).json({ error: 'Gemini TTS quá thời gian phản hồi' });
      return;
    }
    res.status(500).json({ error: 'Lỗi server', detail: err?.message ?? String(err) });
  }
}

function pcmToWav(pcmData: Buffer, sampleRate: number, channels: number, bitsPerSample: number): Buffer {
  const byteRate = (sampleRate * channels * bitsPerSample) / 8;
  const blockAlign = (channels * bitsPerSample) / 8;
  const dataSize = pcmData.length;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  pcmData.copy(buffer, 44);

  return buffer;
}
