# 🤖 Gemini 2.5 Pro Multimodal Chatbot System

Sistem Chatbot Cerdas Multimodal berbasis model **Google Gemini 2.5 Pro** dengan arsitektur **Client-Server**. Backend terpusat dibangun menggunakan **Node.js (Express & SDK Resmi @google/genai)** yang melayani dua jenis frontend:
1. **Telegram Bot** (Frontend 1)
2. **Java Desktop Client (Swing GUI)** (Frontend 2)
3. *Bonus:* **Web UI Interactive Playground** untuk testing langsung di browser.

---

## 📁 Struktur Direktori

```text
Chat Bot/
│
├── rancangan_arsitektur_chatbot.md   # Dokumen spesifikasi arsitektur awal
├── README.md                          # Panduan lengkap implementasi & instalasi
│
├── backend-node/                      # Backend Node.js Terpusat
│   ├── index.js                       # Entry point Express & Telegram Bot
│   ├── routes/
│   │   └── api.js                     # Endpoint REST API (/chat/text, /chat/file, /health)
│   ├── controllers/
│   │   ├── geminiController.js        # Logika AI Gemini (Multimodal & Text)
│   │   └── telegramController.js      # Logika interaksi Telegram Bot
│   ├── public/                        # Web Dashboard UI Playground
│   │   ├── index.html
│   │   ├── style.css
│   │   └── app.js
│   ├── .env                           # Konfigurasi kunci API (lokal)
│   ├── .env.example                   # Template konfigurasi environment
│   ├── package.json
│   └── .gitignore
│
└── frontend-java/                     # Frontend Client Aplikasi Java (Desktop)
    ├── src/
    │   ├── Main.java                  # Entry point aplikasi Java GUI
    │   ├── ApiClient.java             # HTTP Client komunikasi ke REST API
    │   └── ChatUI.java                # Tampilan Desktop GUI (Dark Theme modern)
    ├── pom.xml                        # Konfigurasi Maven Build Tool
    └── run.bat                        # Script eksekusi otomatis untuk Windows
```

---

## ⚙️ Persiapan & Konfigurasi (Setup)

### 1. Dapatkan Kunci API
1. **Google Gemini API Key:** Dapatkan secara gratis melalui [Google AI Studio](https://aistudio.google.com/).
2. **Telegram Bot Token (Opsional jika ingin bot Telegram):** Buka aplikasi Telegram, cari `@BotFather`, kirim `/newbot`, lalu salin token yang diberikan.

### 2. Konfigurasi File `.env`
Buka file `backend-node/.env` dan isi token Anda:
```env
PORT=3000
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-pro
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
```
*(Catatan: Jika token Telegram dibiarkan kosong, server backend dan REST API tetap berjalan normal tanpa error).*

---

## 🚀 Cara Menjalankan Sistem

### A. Menjalankan Backend (Node.js)
Buka terminal PowerShell di folder proyek:
```bash
cd "c:\Pemograman\Chat Bot\backend-node"
npm start
```
Atau untuk mode auto-reload saat koding:
```bash
npm run dev
```

Output terminal saat server berhasil aktif:
```text
====================================================
🚀 [BACKEND] Gemini Chatbot Server berjalan pada http://localhost:3000
📡 [API] REST Endpoint:
   - POST http://localhost:3000/api/chat/text
   - POST http://localhost:3000/api/chat/file
   - GET  http://localhost:3000/api/health
🌐 [WEB UI] Interactive Playground: http://localhost:3000
====================================================
🤖 [Telegram Bot] Berhasil diinisialisasi dan mulai mendengarkan pesan...
```

---

### B. Menggunakan Web UI Playground
Setelah backend berjalan, buka browser dan akses:
👉 **[http://localhost:3000](http://localhost:3000)**

Anda bisa:
- Mengetik prompt teks biasa.
- Melampirkan berkas (Foto, Dokumen PDF, atau Audio) dan menanyakan isinya kepada AI.

---

### C. Menggunakan Telegram Bot (Frontend 1)
1. Cari username bot yang Anda buat di BotFather.
2. Kirim `/start` untuk melihat pesan sambutan.
3. Kirim pesan teks, foto dengan caption, dokumen PDF, atau rekaman suara (voice note).
4. Bot akan otomatis mengunduh berkas, mengirimkannya ke Gemini 2.5 Pro, dan membalas di ruang obrolan Telegram.

---

### D. Menjalankan Desktop Java Client (Frontend 2)

#### Menggunakan Batch Script Otomatis:
Jika JDK sudah terpasang di komputer Anda:
```cmd
cd "c:\Pemograman\Chat Bot\frontend-java"
run.bat
```

#### Menggunakan Maven:
```bash
cd "c:\Pemograman\Chat Bot\frontend-java"
mvn compile exec:java
```

---

## 📡 Dokumentasi Endpoint REST API

### 1. `POST /api/chat/text`
Mengirim prompt percakapan berbasis teks murni ke AI Gemini.
* **Header:** `Content-Type: application/json`
* **Body Request:**
  ```json
  {
    "prompt": "Jelaskan konsep arsitektur microservices secara singkat!"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "result": "Arsitektur microservices adalah pendekatan..."
  }
  ```

---

### 2. `POST /api/chat/file`
Mengirim berkas (gambar, PDF, audio) beserta prompt ke AI Gemini.
* **Header:** `Content-Type: multipart/form-data`
* **Form-Data Parameters:**
  * `file`: Berkas biner (*binary*) yang diunggah
  * `prompt`: String teks instruksi / pertanyaan pengguna
* **Response (200 OK):**
  ```json
  {
    "result": "Berdasarkan berkas yang Anda unggah, dokumen tersebut membahas..."
  }
  ```

---

### 3. `GET /api/health`
Cek status server dan model Gemini yang aktif.
* **Response (200 OK):**
  ```json
  {
    "status": "OK",
    "service": "Gemini Multimodal Chatbot Backend",
    "model": "gemini-2.5-pro",
    "timestamp": "2026-10-08T15:48:33.946Z"
  }
  ```
