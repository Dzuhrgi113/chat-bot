const chatMessages = document.getElementById('chatMessages');
const chatForm = document.getElementById('chatForm');
const messageInput = document.getElementById('messageInput');
const fileInput = document.getElementById('fileInput');
const btnAttach = document.getElementById('btnAttach');
const btnSend = document.getElementById('btnSend');
const attachmentPreview = document.getElementById('attachmentPreview');
const previewFileName = document.getElementById('previewFileName');
const previewFileSize = document.getElementById('previewFileSize');
const btnRemoveFile = document.getElementById('btnRemoveFile');
const statusText = document.getElementById('statusText');

let selectedFile = null;

// Cek Health Check Server
async function checkServerHealth() {
  try {
    const res = await fetch('/api/health');
    if (res.ok) {
      const data = await res.json();
      statusText.textContent = `Server Siap (${data.model || 'Gemini'})`;
    } else {
      statusText.textContent = 'Server Menolak';
    }
  } catch (err) {
    statusText.textContent = 'Server Offline';
  }
}
checkServerHealth();

// Handler Tombol Lampiran
btnAttach.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', (e) => {
  if (e.target.files && e.target.files[0]) {
    selectedFile = e.target.files[0];
    previewFileName.textContent = selectedFile.name;
    previewFileSize.textContent = formatBytes(selectedFile.size);
    attachmentPreview.style.display = 'flex';
  }
});

btnRemoveFile.addEventListener('click', () => {
  clearAttachment();
});

function clearAttachment() {
  selectedFile = null;
  fileInput.value = '';
  attachmentPreview.style.display = 'none';
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Handler Submit Form
chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const text = messageInput.value.trim();
  if (!text && !selectedFile) return;

  // Render bubble user (Pale blue on right)
  appendMessage({
    sender: 'user',
    text: text,
    fileName: selectedFile ? selectedFile.name : null
  });

  const currentFile = selectedFile;
  messageInput.value = '';
  clearAttachment();

  // Tampilkan bubble loading Gemini (Pale green on left)
  const loadingBubble = appendMessage({
    sender: 'gemini',
    text: 'Gemini is thinking...',
    isLoading: true
  });

  btnSend.disabled = true;

  try {
    let resultText = '';

    if (currentFile) {
      // Endpoint Multimodal: POST /api/chat/file
      const formData = new FormData();
      formData.append('file', currentFile);
      formData.append('prompt', text || 'Tolong analisis dan jelaskan isi file ini.');

      const response = await fetch('/api/chat/file', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gagal memproses berkas di server.');
      }
      resultText = data.result;
    } else {
      // Endpoint Teks: POST /api/chat/text
      const response = await fetch('/api/chat/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gagal memproses pesan di server.');
      }
      resultText = data.result;
    }

    updateLoadingBubble(loadingBubble, resultText);
  } catch (error) {
    updateLoadingBubble(loadingBubble, `⚠️ Terjadi Kesalahan: ${error.message}`);
  } finally {
    btnSend.disabled = false;
    messageInput.focus();
  }
});

// Helper menambah pesan ke timeline chat
function appendMessage({ sender, text, fileName, isLoading = false }) {
  const msgDiv = document.createElement('div');
  const role = (sender === 'ai' || sender === 'gemini') ? 'gemini' : 'user';
  msgDiv.className = `message ${role}-message`;

  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';

  if (fileName) {
    const badge = document.createElement('div');
    badge.className = 'message-file-badge';
    badge.innerHTML = `📎 <span>${escapeHtml(fileName)}</span>`;
    contentDiv.appendChild(badge);
  }

  const textSpan = document.createElement('div');
  if (isLoading) {
    textSpan.innerHTML = `<span>${escapeHtml(text)}</span> <span class="typing-dots"><span></span><span></span><span></span></span>`;
  } else {
    textSpan.innerHTML = formatMarkdown(text);
  }
  contentDiv.appendChild(textSpan);

  msgDiv.appendChild(contentDiv);
  chatMessages.appendChild(msgDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  return msgDiv;
}

function updateLoadingBubble(bubbleDiv, text) {
  const contentDiv = bubbleDiv.querySelector('.message-content');
  contentDiv.innerHTML = '';
  const textSpan = document.createElement('div');
  textSpan.innerHTML = formatMarkdown(text);
  contentDiv.appendChild(textSpan);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Basic markdown formatter untuk respon AI rapi
function formatMarkdown(str) {
  if (!str) return '';
  let escaped = escapeHtml(str);
  
  // Bold **text**
  escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Italic *text*
  escaped = escaped.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Code block ```code```
  escaped = escaped.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  
  // Inline code `code`
  escaped = escaped.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Newlines
  escaped = escaped.replace(/\n/g, '<br>');
  
  return escaped;
}

function escapeHtml(string) {
  const div = document.createElement('div');
  div.innerText = string;
  return div.innerHTML;
}
