require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/api');
const { initTelegramBot } = require('./controllers/telegramController');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sajikan Web UI Playground (Frontend Browser untuk testing langsung)
app.use(express.static(path.join(__dirname, 'public')));

// Mount API Routes
app.use('/api', apiRoutes);

// Root route fallback jika tidak membuka public
app.get('/status', (req, res) => {
  res.json({
    message: 'Gemini 2.5 Pro Chatbot Backend Aktif',
    status: 'running',
    endpoints: {
      text: 'POST /api/chat/text',
      file: 'POST /api/chat/file',
      health: 'GET /api/health'
    }
  });
});

// Jalankan Server HTTP
app.listen(PORT, () => {
  console.log('====================================================');
  console.log(`🚀 [BACKEND] Gemini Chatbot Server berjalan pada http://localhost:${PORT}`);
  console.log(`📡 [API] REST Endpoint:`);
  console.log(`   - POST http://localhost:${PORT}/api/chat/text`);
  console.log(`   - POST http://localhost:${PORT}/api/chat/file`);
  console.log(`   - GET  http://localhost:${PORT}/api/health`);
  console.log(`🌐 [WEB UI] Interactive Playground: http://localhost:${PORT}`);
  console.log('====================================================');

  // Inisialisasi Telegram Bot Polling
  initTelegramBot();
});
