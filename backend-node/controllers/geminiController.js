const { GoogleGenAI } = require('@google/genai');

/**
 * Inisialisasi Google Gen AI Client
 */
function getGenAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error(
      'GEMINI_API_KEY belum dikonfigurasi di file .env. Silakan dapatkan API key dari https://aistudio.google.com/ dan masukkan ke .env'
    );
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Mengambil nama model dari environment atau default
 */
function getModelName() {
  return process.env.GEMINI_MODEL || 'gemini-2.5-pro';
}

/**
 * Memproses prompt berbasis teks saja
 * @param {string} prompt - Pertanyaan atau instruksi pengguna
 * @returns {Promise<string>} Hasil teks dari Gemini
 */
async function generateText(prompt) {
  if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
    throw new Error('Prompt teks tidak boleh kosong.');
  }

  const ai = getGenAIClient();
  const primaryModel = getModelName();
  
  // Daftar fallback model cerdas jika model utama sedang busy atau limit
  const fallbackCandidates = ['gemini-3.5-flash', 'gemini-3.7-flash', 'gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-lite-latest'];
  const modelsToTry = [primaryModel, ...fallbackCandidates.filter(m => m !== primaryModel)];
  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: prompt
      });

      if (response && response.text) {
        return response.text;
      }
      throw new Error('Tidak ada respon teks yang diterima dari Gemini.');
    } catch (err) {
      lastError = err;
      console.warn(`[Gemini] Percobaan dengan model '${model}' gagal: ${err.message}. Mencoba alternatif jika tersedia...`);
      // Jika errornya adalah auth atau API key invalid, tidak perlu fallback model
      if (err.message && (err.message.includes('API_KEY_INVALID') || err.message.includes('belum dikonfigurasi'))) {
        throw err;
      }
    }
  }

  throw lastError || new Error('Gagal menghasilkan teks dari Gemini.');
}

/**
 * Memproses prompt multimodal (teks + berkas: gambar, dokumen, audio)
 * @param {string} prompt - Prompt teks pendamping berkas
 * @param {Buffer} fileBuffer - Buffer dari file biner
 * @param {string} mimeType - MIME type file (misal: image/jpeg, application/pdf, audio/mp3)
 * @returns {Promise<string>} Hasil analisa dari Gemini
 */
async function generateFromMultimodal(prompt, fileBuffer, mimeType) {
  if (!fileBuffer || !Buffer.isBuffer(fileBuffer)) {
    throw new Error('File buffer tidak valid atau tidak ditemukan.');
  }

  const ai = getGenAIClient();
  const primaryModel = getModelName();
  const effectivePrompt = prompt && prompt.trim() !== '' ? prompt : 'Tolong analisis dan jelaskan isi file ini secara mendalam.';

  // Format data inline part Base64
  const inlineFilePart = {
    inlineData: {
      data: fileBuffer.toString('base64'),
      mimeType: mimeType || 'application/octet-stream'
    }
  };

  const contents = [
    inlineFilePart,
    effectivePrompt
  ];

  const fallbackCandidates = ['gemini-3.5-flash', 'gemini-3.7-flash', 'gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-lite-latest'];
  const modelsToTry = [primaryModel, ...fallbackCandidates.filter(m => m !== primaryModel)];
  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: contents
      });

      if (response && response.text) {
        return response.text;
      }
      throw new Error('Tidak ada respon teks yang diterima dari Gemini.');
    } catch (err) {
      lastError = err;
      console.warn(`[Gemini Multimodal] Model '${model}' gagal: ${err.message}.`);
      if (err.message && (err.message.includes('API_KEY_INVALID') || err.message.includes('belum dikonfigurasi'))) {
        throw err;
      }
    }
  }

  throw lastError || new Error('Gagal menghasilkan analisis berkas dari Gemini.');
}

module.exports = {
  generateText,
  generateFromMultimodal
};
