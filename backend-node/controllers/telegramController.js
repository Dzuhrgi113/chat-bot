const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const { generateText, generateFromMultimodal } = require('./geminiController');

let bot = null;

/**
 * Mengunduh file dari Telegram API ke dalam bentuk Buffer
 * @param {string} fileId - Telegram File ID
 * @returns {Promise<{ buffer: Buffer, mimeType: string }>}
 */
async function downloadTelegramFile(fileId) {
  try {
    const fileLink = await bot.getFileLink(fileId);
    const response = await axios.get(fileLink, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);
    const mimeType = response.headers['content-type'] || 'application/octet-stream';
    return { buffer, mimeType };
  } catch (error) {
    throw new Error(`Gagal mengunduh file dari Telegram: ${error.message}`);
  }
}

/**
 * Membagi pesan panjang Telegram (maksimal 4096 karakter per pesan)
 * @param {number} chatId
 * @param {string} text
 */
async function sendLongMessage(chatId, text) {
  const MAX_LENGTH = 4000;
  if (text.length <= MAX_LENGTH) {
    await bot.sendMessage(chatId, text);
    return;
  }

  // Jika teks melebihi batas Telegram, pecah menjadi beberapa pesan berurutan
  let remainingText = text;
  while (remainingText.length > 0) {
    const chunk = remainingText.substring(0, MAX_LENGTH);
    remainingText = remainingText.substring(MAX_LENGTH);
    await bot.sendMessage(chatId, chunk);
  }
}

/**
 * Inisialisasi Telegram Bot
 */
function initTelegramBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token || token === 'your_telegram_bot_token_here' || token.trim() === '') {
    console.warn(
      '[Telegram Bot] Peringatan: TELEGRAM_BOT_TOKEN belum diset di .env. Fitur Telegram Bot dinonaktifkan sementara. (REST API tetap aktif).'
    );
    return null;
  }

  try {
    bot = new TelegramBot(token, { polling: true });

    console.log('🤖 [Telegram Bot] Berhasil diinisialisasi dan mulai mendengarkan pesan...');

    // Handler command /start
    bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      const firstName = msg.from ? msg.from.first_name : 'Sobat';
      const welcomeMsg = 
        `Halo ${firstName}! 👋\n\n` +
        `Saya adalah Bot Asisten Cerdas bertenaga Google Gemini 2.5 Pro Multimodal.\n\n` +
        `Anda dapat mengirim:\n` +
        `💬 Pesan Teks untuk berdiskusi & bertanya apa saja\n` +
        `📷 Gambar / Foto dengan caption pertanyaan\n` +
        `📄 Dokumen (PDF, Teks, Dokumen)\n` +
        `🎙️ Rekaman Suara / Audio untuk ditranskrip & dianalisis\n\n` +
        `Silakan kirim pesan atau berkas Anda!`;
      
      bot.sendMessage(chatId, welcomeMsg);
    });

    // Handler command /help
    bot.onText(/\/help/, (msg) => {
      const chatId = msg.chat.id;
      const helpMsg = 
        `📖 Panduan Penggunaan Gemini Multimodal Bot:\n\n` +
        `1. Kirim pesan teks langsung untuk dijawab oleh AI.\n` +
        `2. Kirim gambar atau foto beserta teks caption jika ingin bertanya hal spesifik.\n` +
        `3. Kirim berkas PDF atau dokumen untuk dirangkum atau dianalisis.\n` +
        `4. Kirim rekaman suara (voice note) untuk mendengar dan menganalisis konten suara.`;
      
      bot.sendMessage(chatId, helpMsg);
    });

    // Handler seluruh pesan masuk
    bot.on('message', async (msg) => {
      const chatId = msg.chat.id;

      // Abaikan jika pesan berupa command yang sudah di-handle di atas
      if (msg.text && (msg.text.startsWith('/start') || msg.text.startsWith('/help'))) {
        return;
      }

      try {
        await bot.sendChatAction(chatId, 'typing');

        // 1. KASUS GAMBAR / FOTO
        if (msg.photo && msg.photo.length > 0) {
          // Ambil resolusi tertinggi (elemen terakhir dalam array photo)
          const highestPhoto = msg.photo[msg.photo.length - 1];
          const prompt = msg.caption || 'Analisis dan jelaskan isi gambar ini secara detail.';

          const { buffer, mimeType } = await downloadTelegramFile(highestPhoto.file_id);
          const aiResponse = await generateFromMultimodal(prompt, buffer, mimeType || 'image/jpeg');

          await sendLongMessage(chatId, aiResponse);
          return;
        }

        // 2. KASUS DOKUMEN (PDF, TXT, DOC, DLL)
        if (msg.document) {
          const prompt = msg.caption || `Analisis dokumen "${msg.document.file_name || 'berkas'}" ini dan rangkum isinya.`;
          const { buffer, mimeType } = await downloadTelegramFile(msg.document.file_id);

          const aiResponse = await generateFromMultimodal(
            prompt,
            buffer,
            msg.document.mime_type || mimeType || 'application/pdf'
          );

          await sendLongMessage(chatId, aiResponse);
          return;
        }

        // 3. KASUS AUDIO / VOICE NOTE
        if (msg.voice || msg.audio) {
          const audioObj = msg.voice || msg.audio;
          const prompt = msg.caption || 'Dengarkan audio ini, transkripsikan dan jelaskan maksudnya.';
          const { buffer, mimeType } = await downloadTelegramFile(audioObj.file_id);

          const aiResponse = await generateFromMultimodal(
            prompt,
            buffer,
            audioObj.mime_type || mimeType || (msg.voice ? 'audio/ogg' : 'audio/mp3')
          );

          await sendLongMessage(chatId, aiResponse);
          return;
        }

        // 4. KASUS PESAN TEKS BIASA
        if (msg.text) {
          const aiResponse = await generateText(msg.text);
          await sendLongMessage(chatId, aiResponse);
          return;
        }
      } catch (error) {
        console.error(`[Telegram Bot Error] Chat ID ${chatId}:`, error.message);
        bot.sendMessage(
          chatId,
          `⚠️ Maaf, terjadi kesalahan saat memproses permintaan Anda:\n\n${error.message}`
        );
      }
    });

    // Menangani polling error agar tidak membuat crash aplikasi
    bot.on('polling_error', (error) => {
      console.error('[Telegram Polling Error]:', error.code, error.message);
    });

    return bot;
  } catch (error) {
    console.error('[Telegram Init Failed]:', error.message);
    return null;
  }
}

module.exports = {
  initTelegramBot
};
