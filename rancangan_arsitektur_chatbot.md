# Rancangan Sistem: Chatbot Multimodal Gemini 2.5 Pro

## 1. Deskripsi Proyek
Proyek ini adalah pembuatan sistem Chatbot cerdas yang menggunakan model **Google Gemini 2.5 Pro**. Sistem ini dapat menerima input berupa teks, gambar, dokumen, dan audio. 

Sistem akan mengadopsi arsitektur *Client-Server*, di mana **Node.js** bertindak sebagai Backend terpusat, dan antarmuka pengguna (Frontend) dapat diakses melalui **Telegram** maupun aplikasi kustom berbasis **Java**.

---

## 2. Arsitektur Sistem

```text
[ Pengguna ]
   |
   |-- (Via Telegram App) ---> [ Telegram API ]
   |                                 |
   |-- (Via Aplikasi Java) ---> [ REST API (Express) ]
                                     |
                                     V
                        +-------------------------+
                        |     BACKEND NODE.JS     |
                        | - node-telegram-bot-api |
                        | - Express.js / Multer   |
                        | - @google/genai         |
                        +-------------------------+
                                     |
                                     V
                        [ Google Gemini 2.5 Pro API ]
```

### 2.1. Komponen Utama
1. **Google Gemini API**: AI Engine utama yang memproses prompt teks dan data *inlineData* (Base64 dari file/gambar/audio).
2. **Node.js (Backend)**: 
   - Menjalankan *polling* ke Telegram untuk mendengarkan pesan masuk.
   - Menjalankan server *Express.js* untuk menyediakan endpoint REST API (seperti `/generate-text`, `/generate-from-image` dari referensi Sesi 2).
3. **Telegram (Frontend 1)**: Platform perpesanan tempat pengguna awam berinteraksi secara langsung dengan bot.
4. **Java (Frontend 2)**: Aplikasi *client* khusus (misal: Java Desktop dengan JavaFX / Swing, atau aplikasi Android dengan Java) yang memiliki GUI kustom dan berkomunikasi dengan Node.js melalui *HTTP Requests*.

---

## 3. Spesifikasi Teknologi

### Backend (Node.js)
*   **Platform:** Node.js (v18+)
*   **Library Utama:**
    *   `@google/genai`: SDK resmi untuk Gemini.
    *   `node-telegram-bot-api`: Untuk interaksi dengan Telegram.
    *   `express`: Framework web untuk membuat REST API.
    *   `multer`: Middleware untuk menangani upload file dari Java frontend.
    *   `dotenv`: Mengelola environment variable.

### Frontend (Java)
*   **Platform:** Java SE (v11+) atau Android.
*   **Framework UI:** JavaFX / Swing (Desktop) atau Android SDK (Mobile).
*   **Library Jaringan:** `java.net.http.HttpClient` (bawaan Java 11+) atau `OkHttp` untuk mengirim HTTP POST request ke server Node.js.
*   **Library JSON:** `Gson` atau `Jackson` untuk memparsing response dari backend Node.js.

---

## 4. Struktur Direktori Proyek

```text
gemini-chatbot-system/
│
├── backend-node/                 # Direktori Backend Node.js
│   ├── index.js                  # Entry point (Inisialisasi Express & Telegram Bot)
│   ├── routes/
│   │   └── api.js                # Definisi Endpoint REST API untuk Java
│   ├── controllers/
│   │   ├── telegramController.js # Logika bot telegram (teks & file)
│   │   └── geminiController.js   # Logika pemanggilan SDK Gemini
│   ├── .env                      # API Keys (Gemini & Telegram)
│   ├── package.json
│   └── .gitignore
│
└── frontend-java/                # Direktori Frontend Java
    ├── src/
    │   ├── Main.java             # Entry point aplikasi Java UI
    │   ├── ApiClient.java        # Kelas untuk melakukan HTTP HTTP Request ke Node.js
    │   └── ChatUI.java           # Desain antarmuka (Tombol, Text Area, Upload File)
    └── pom.xml / build.gradle    # File konfigurasi build tool
```

---

## 5. Desain Endpoint API (Untuk Frontend Java)

Backend Node.js harus mengekspos endpoint berikut agar aplikasi Java dapat berinteraksi dengan AI:

1.  **`POST /api/chat/text`**
    *   **Fungsi:** Mengirim pesan teks ke Gemini.
    *   **Body Request:** `{ "prompt": "Halo, siapa kamu?" }`
    *   **Response:** `{ "result": "Saya AI Gemini..." }`

2.  **`POST /api/chat/file`**
    *   **Fungsi:** Mengirim teks beserta file (gambar/PDF/audio) ke Gemini.
    *   **Tipe Konten:** `multipart/form-data`
    *   **Parameter:** `file` (binary), `prompt` (string).
    *   **Response:** `{ "result": "Analisis file..." }`

---

## 6. Rencana Tahapan Pengembangan (Roadmap)

### Fase 1: Setup Backend & Integrasi Gemini
1. Inisialisasi Node.js dan install dependencies (`@google/genai`, `dotenv`, `express`, `multer`).
2. Tulis logika pemanggilan model `gemini-2.5-pro` di Node.js.
3. Buat file server dasar yang bisa menerima teks dan me-return jawaban AI.

### Fase 2: Integrasi Telegram Bot (Frontend 1)
1. Dapatkan token dari BotFather.
2. Tambahkan `node-telegram-bot-api` ke Backend.
3. Implementasikan deteksi pesan masuk (Teks, Foto, Dokumen, Audio).
4. Buat fungsi konversi file dari URL Telegram ke *Base64* (menggunakan buffer).

### Fase 3: Pembuatan REST API untuk Java
1. Setup Express.js di dalam proyek backend.
2. Buat rute POST menggunakan Multer untuk menangani file yang di-upload.
3. Pastikan endpoint mengembalikan respons berformat JSON yang rapi.
4. Uji coba endpoint menggunakan Postman.

### Fase 4: Pengembangan Aplikasi Java (Frontend 2)
1. Buat proyek Java baru (Maven/Gradle).
2. Desain GUI (Graphical User Interface) sederhana: Area chat, kolom input teks, tombol kirim, dan tombol lampirkan file (Attach File).
3. Buat kelas *HTTP Client* di Java untuk melakukan POST request ke URL `http://localhost:3000/api/chat/file`.
4. Tampilkan JSON hasil balasan dari server Node.js ke layar percakapan antarmuka Java.