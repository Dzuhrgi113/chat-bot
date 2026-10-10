const express = require('express');
const multer = require('multer');
const { generateText, generateFromMultimodal } = require('../controllers/geminiController');

const router = express.Router();

// Setup Multer dengan memoryStorage agar file langsung berada di Buffer memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024 // Batas maksimal file 20MB
  }
});

/**
 * GET /api/health
 * Endpoint cek status API
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Gemini Multimodal Chatbot Backend',
    model: process.env.GEMINI_MODEL || 'gemini-2.5-pro',
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /api/chat/text
 * Mengirim pesan teks ke Gemini
 * Request Body: { "prompt": "Halo, siapa kamu?" }
 * Response: { "result": "Saya AI Gemini..." }
 */
router.post('/chat/text', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({
        error: 'Parameter "prompt" wajib disertakan dalam body JSON.'
      });
    }

    const result = await generateText(prompt);
    return res.json({ result });
  } catch (error) {
    console.error('[API /chat/text Error]:', error);
    return res.status(500).json({
      error: error.message || 'Terjadi kesalahan internal saat memproses pesan teks.'
    });
  }
});

/**
 * POST /api/chat/file
 * Mengirim teks beserta file (gambar/PDF/audio) ke Gemini
 * Content-Type: multipart/form-data
 * Parameter: file (binary), prompt (string)
 * Response: { "result": "Analisis file..." }
 */
router.post('/chat/file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'File lampiran ("file") wajib diunggah dalam format multipart/form-data.'
      });
    }

    const prompt = req.body.prompt || 'Tolong analisis isi berkas ini.';
    const fileBuffer = req.file.buffer;
    const mimeType = req.file.mimetype;

    const result = await generateFromMultimodal(prompt, fileBuffer, mimeType);
    return res.json({ result });
  } catch (error) {
    console.error('[API /chat/file Error]:', error);
    return res.status(500).json({
      error: error.message || 'Terjadi kesalahan internal saat memproses file multimodal.'
    });
  }
});

module.exports = router;
