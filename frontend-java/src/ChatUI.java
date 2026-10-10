import javax.swing.*;
import javax.swing.border.EmptyBorder;
import java.awt.*;
import java.io.File;

/**
 * ChatUI menyediakan antarmuka grafis (GUI) modern untuk berinteraksi dengan AI Gemini
 */
public class ChatUI extends JFrame {
    private final ApiClient apiClient;
    private JTextArea chatArea;
    private JTextField inputField;
    private JButton sendButton;
    private JButton attachButton;
    private JLabel selectedFileLabel;
    private JLabel statusLabel;
    private File attachedFile = null;

    public ChatUI() {
        this.apiClient = new ApiClient("http://localhost:3000");
        initUI();
    }

    private void initUI() {
        setTitle("Gemini 2.5 Pro Chatbot - Java Client");
        setSize(700, 750);
        setMinimumSize(new Dimension(500, 500));
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setLocationRelativeTo(null);

        // Main Layout
        JPanel mainPanel = new JPanel(new BorderLayout(10, 10));
        mainPanel.setBorder(new EmptyBorder(16, 16, 16, 16));
        mainPanel.setBackground(new Color(15, 23, 42)); // Dark Slate

        // 1. Header Panel
        JPanel headerPanel = new JPanel(new BorderLayout());
        headerPanel.setBackground(new Color(30, 41, 59));
        headerPanel.setBorder(new EmptyBorder(12, 16, 12, 16));

        JLabel titleLabel = new JLabel("✨ Gemini Multimodal Desktop Client");
        titleLabel.setFont(new Font("Segoe UI", Font.BOLD, 18));
        titleLabel.setForeground(new Color(248, 250, 252));

        statusLabel = new JLabel("Backend: http://localhost:3000");
        statusLabel.setFont(new Font("Segoe UI", Font.PLAIN, 12));
        statusLabel.setForeground(new Color(148, 163, 184));

        headerPanel.add(titleLabel, BorderLayout.WEST);
        headerPanel.add(statusLabel, BorderLayout.EAST);
        mainPanel.add(headerPanel, BorderLayout.NORTH);

        // 2. Chat History Area
        chatArea = new JTextArea();
        chatArea.setEditable(false);
        chatArea.setLineWrap(true);
        chatArea.setWrapStyleWord(true);
        chatArea.setFont(new Font("Segoe UI", Font.PLAIN, 14));
        chatArea.setBackground(new Color(24, 33, 47));
        chatArea.setForeground(new Color(226, 232, 240));
        chatArea.setBorder(new EmptyBorder(12, 12, 12, 12));

        appendMessage("SYSTEM", "Selamat Datang di Gemini Multimodal Chatbot!\nKetik pertanyaan Anda di bawah atau klik tombol 'Lampirkan File' untuk mengirim berkas.\n---------------------------------------------------------------\n");

        JScrollPane scrollPane = new JScrollPane(chatArea);
        scrollPane.setBorder(BorderFactory.createLineBorder(new Color(51, 65, 85), 1));
        mainPanel.add(scrollPane, BorderLayout.CENTER);

        // 3. Bottom Panel (Input & Attachment)
        JPanel bottomPanel = new JPanel(new BorderLayout(8, 8));
        bottomPanel.setOpaque(false);

        // File attachment banner
        JPanel fileBannerPanel = new JPanel(new FlowLayout(FlowLayout.LEFT, 8, 4));
        fileBannerPanel.setBackground(new Color(30, 41, 59));
        selectedFileLabel = new JLabel("Lampiran: (Tidak ada berkas)");
        selectedFileLabel.setFont(new Font("Segoe UI", Font.ITALIC, 12));
        selectedFileLabel.setForeground(new Color(148, 163, 184));

        JButton clearFileBtn = new JButton("Batal");
        clearFileBtn.setFont(new Font("Segoe UI", Font.PLAIN, 11));
        clearFileBtn.setFocusPainted(false);
        clearFileBtn.addActionListener(e -> clearAttachedFile());

        fileBannerPanel.add(selectedFileLabel);
        fileBannerPanel.add(clearFileBtn);
        bottomPanel.add(fileBannerPanel, BorderLayout.NORTH);

        // Inputs Panel
        JPanel inputControlPanel = new JPanel(new BorderLayout(8, 0));
        inputControlPanel.setOpaque(false);

        attachButton = new JButton("📎 Lampirkan File");
        attachButton.setFont(new Font("Segoe UI", Font.BOLD, 12));
        attachButton.setBackground(new Color(51, 65, 85));
        attachButton.setForeground(Color.WHITE);
        attachButton.setFocusPainted(false);
        attachButton.addActionListener(e -> chooseFile());

        inputField = new JTextField();
        inputField.setFont(new Font("Segoe UI", Font.PLAIN, 14));
        inputField.setBackground(new Color(30, 41, 59));
        inputField.setForeground(Color.WHITE);
        inputField.setCaretColor(Color.WHITE);
        inputField.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(new Color(71, 85, 105), 1),
                BorderFactory.createEmptyBorder(8, 10, 8, 10)
        ));
        inputField.addActionListener(e -> handleSendMessage());

        sendButton = new JButton("Kirim ✈");
        sendButton.setFont(new Font("Segoe UI", Font.BOLD, 13));
        sendButton.setBackground(new Color(79, 70, 229)); // Indigo
        sendButton.setForeground(Color.WHITE);
        sendButton.setFocusPainted(false);
        sendButton.addActionListener(e -> handleSendMessage());

        inputControlPanel.add(attachButton, BorderLayout.WEST);
        inputControlPanel.add(inputField, BorderLayout.CENTER);
        inputControlPanel.add(sendButton, BorderLayout.EAST);

        bottomPanel.add(inputControlPanel, BorderLayout.SOUTH);
        mainPanel.add(bottomPanel, BorderLayout.SOUTH);

        add(mainPanel);
    }

    private void chooseFile() {
        JFileChooser fileChooser = new JFileChooser();
        fileChooser.setDialogTitle("Pilih Gambar, Dokumen (PDF), atau Audio");
        int res = fileChooser.showOpenDialog(this);
        if (res == JFileChooser.APPROVE_OPTION) {
            attachedFile = fileChooser.getSelectedFile();
            selectedFileLabel.setText("Lampiran: " + attachedFile.getName() + " (" + (attachedFile.length() / 1024) + " KB)");
            selectedFileLabel.setForeground(new Color(56, 189, 248)); // Cyan
        }
    }

    private void clearAttachedFile() {
        attachedFile = null;
        selectedFileLabel.setText("Lampiran: (Tidak ada berkas)");
        selectedFileLabel.setForeground(new Color(148, 163, 184));
    }

    private void handleSendMessage() {
        String prompt = inputField.getText().trim();
        if (prompt.isEmpty() && attachedFile == null) {
            return;
        }

        // Tampilkan pesan pengguna di GUI
        String userDisplay = prompt.isEmpty() ? "[Mengirim berkas: " + attachedFile.getName() + "]" : prompt;
        if (attachedFile != null && !prompt.isEmpty()) {
            userDisplay += "\n[Lampiran: " + attachedFile.getName() + "]";
        }
        appendMessage("ANDA", userDisplay);

        inputField.setText("");
        setControlsEnabled(false);
        statusLabel.setText("Menunggu respon Gemini...");

        File fileToSend = attachedFile;
        clearAttachedFile();

        // Jalankan HTTP Request di thread background (SwingWorker)
        SwingWorker<String, Void> worker = new SwingWorker<>() {
            @Override
            protected String doInBackground() throws Exception {
                if (fileToSend != null) {
                    return apiClient.sendFileMessage(fileToSend, prompt);
                } else {
                    return apiClient.sendTextMessage(prompt);
                }
            }

            @Override
            protected void done() {
                try {
                    String response = get();
                    appendMessage("GEMINI AI", response);
                    statusLabel.setText("Siap.");
                } catch (Exception ex) {
                    appendMessage("ERROR", "Gagal: " + ex.getMessage());
                    statusLabel.setText("Terjadi kesalahan.");
                } finally {
                    setControlsEnabled(true);
                    inputField.requestFocusInWindow();
                }
            }
        };

        worker.execute();
    }

    private void appendMessage(String sender, String text) {
        chatArea.append("[" + sender + "]:\n" + text + "\n\n");
        chatArea.setCaretPosition(chatArea.getDocument().getLength());
    }

    private void setControlsEnabled(boolean enabled) {
        inputField.setEnabled(enabled);
        sendButton.setEnabled(enabled);
        attachButton.setEnabled(enabled);
    }
}
