import javax.swing.*;

/**
 * Entry point aplikasi Desktop Chatbot Frontend Java
 */
public class Main {
    public static void main(String[] args) {
        SwingUtilities.invokeLater(() -> {
            try {
                // Terapkan System Look and Feel agar menyatu dengan OS
                UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
            } catch (Exception ignored) {
            }

            ChatUI chatUI = new ChatUI();
            chatUI.setVisible(true);
        });
    }
}
