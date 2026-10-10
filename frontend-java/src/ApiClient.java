import java.io.*;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.time.Duration;
import java.util.UUID;

/**
 * ApiClient bertugas melakukan komunikasi HTTP Request ke Backend Node.js
 */
public class ApiClient {
    private final String baseUrl;
    private final HttpClient httpClient;

    public ApiClient() {
        this("http://localhost:3000");
    }

    public ApiClient(String baseUrl) {
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(15))
                .build();
    }

    /**
     * Mengirim pesan teks ke endpoint POST /api/chat/text
     * @param prompt Pertanyaan atau prompt dari pengguna
     * @return Teks jawaban dari Gemini
     * @throws Exception Jika request gagal atau error dari server
     */
    public String sendTextMessage(String prompt) throws Exception {
        String endpoint = baseUrl + "/api/chat/text";
        String jsonBody = "{\"prompt\":" + escapeJson(prompt) + "}";

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(endpoint))
                .timeout(Duration.ofSeconds(60))
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody, StandardCharsets.UTF_8))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() >= 200 && response.statusCode() < 300) {
            return extractResultFromJson(response.body());
        } else {
            throw new IOException("HTTP Error " + response.statusCode() + ": " + extractErrorFromJson(response.body()));
        }
    }

    /**
     * Mengirim pesan teks beserta file (gambar/PDF/audio) ke POST /api/chat/file
     * Menggunakan format multipart/form-data
     * @param file Berkas lokal yang akan dikirim
     * @param prompt Deskripsi atau pertanyaan tentang berkas
     * @return Teks analisis dari Gemini
     * @throws Exception Jika request gagal
     */
    public String sendFileMessage(File file, String prompt) throws Exception {
        String endpoint = baseUrl + "/api/chat/file";
        String boundary = "----GeminiBoundary" + UUID.randomUUID().toString().replace("-", "");

        byte[] multipartBody = buildMultipartData(file, prompt, boundary);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(endpoint))
                .timeout(Duration.ofSeconds(90))
                .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                .header("Accept", "application/json")
                .POST(HttpRequest.BodyPublishers.ofByteArray(multipartBody))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() >= 200 && response.statusCode() < 300) {
            return extractResultFromJson(response.body());
        } else {
            throw new IOException("HTTP Error " + response.statusCode() + ": " + extractErrorFromJson(response.body()));
        }
    }

    /**
     * Membentuk payload biner multipart/form-data
     */
    private byte[] buildMultipartData(File file, String prompt, String boundary) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        String lineSeparator = "\r\n";

        // Field "prompt"
        if (prompt != null && !prompt.trim().isEmpty()) {
            baos.write(("--" + boundary + lineSeparator).getBytes(StandardCharsets.UTF_8));
            baos.write(("Content-Disposition: form-data; name=\"prompt\"" + lineSeparator + lineSeparator).getBytes(StandardCharsets.UTF_8));
            baos.write((prompt + lineSeparator).getBytes(StandardCharsets.UTF_8));
        }

        // Field "file"
        String mimeType = Files.probeContentType(file.toPath());
        if (mimeType == null) {
            mimeType = "application/octet-stream";
        }

        baos.write(("--" + boundary + lineSeparator).getBytes(StandardCharsets.UTF_8));
        baos.write(("Content-Disposition: form-data; name=\"file\"; filename=\"" + file.getName() + "\"" + lineSeparator).getBytes(StandardCharsets.UTF_8));
        baos.write(("Content-Type: " + mimeType + lineSeparator + lineSeparator).getBytes(StandardCharsets.UTF_8));
        baos.write(Files.readAllBytes(file.toPath()));
        baos.write(lineSeparator.getBytes(StandardCharsets.UTF_8));

        // Closing boundary
        baos.write(("--" + boundary + "--" + lineSeparator).getBytes(StandardCharsets.UTF_8));

        return baos.toByteArray();
    }

    /**
     * Helper parser JSON sederhana untuk mengekstrak field "result"
     */
    private String extractResultFromJson(String json) {
        return extractFieldFromJson(json, "result");
    }

    /**
     * Helper parser JSON sederhana untuk mengekstrak field "error"
     */
    private String extractErrorFromJson(String json) {
        String error = extractFieldFromJson(json, "error");
        return error != null ? error : json;
    }

    private String extractFieldFromJson(String json, String key) {
        String searchKey = "\"" + key + "\":";
        int idx = json.indexOf(searchKey);
        if (idx == -1) return json;

        int start = json.indexOf("\"", idx + searchKey.length());
        if (start == -1) return json;

        StringBuilder sb = new StringBuilder();
        boolean escaped = false;
        for (int i = start + 1; i < json.length(); i++) {
            char c = json.charAt(i);
            if (escaped) {
                if (c == 'n') sb.append('\n');
                else if (c == 'r') sb.append('\r');
                else if (c == 't') sb.append('\t');
                else if (c == '"') sb.append('\"');
                else if (c == '\\') sb.append('\\');
                else sb.append(c);
                escaped = false;
            } else if (c == '\\') {
                escaped = true;
            } else if (c == '"') {
                break;
            } else {
                sb.append(c);
            }
        }
        return sb.toString();
    }

    private String escapeJson(String text) {
        if (text == null) return "\"\"";
        StringBuilder sb = new StringBuilder("\"");
        for (char c : text.toCharArray()) {
            switch (c) {
                case '"': sb.append("\\\""); break;
                case '\\': sb.append("\\\\"); break;
                case '\b': sb.append("\\b"); break;
                case '\f': sb.append("\\f"); break;
                case '\n': sb.append("\\n"); break;
                case '\r': sb.append("\\r"); break;
                case '\t': sb.append("\\t"); break;
                default:
                    if (c < ' ') {
                        sb.append(String.format("\\u%04x", (int) c));
                    } else {
                        sb.append(c);
                    }
            }
        }
        sb.append("\"");
        return sb.toString();
    }
}
