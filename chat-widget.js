/* ============================================
   Chat Widget - RAG Assistant
   ============================================ */

(function() {
    const API_BASE = "http://localhost:8002";

    // Create widget HTML
    function createChatWidget() {
        const widgetHTML = `
            <button class="chat-launcher" id="chat-launcher" aria-label="Открыть FAQ-ассистента">
                <span>💬</span>
            </button>

            <div class="chat-widget" id="chat-widget" style="display:none;">
                <div class="chat-header">
                    <div class="chat-header-left">
                        <div class="avatar">AI</div>
                        <div>
                            <div class="chat-title">FAQ ассистент</div>
                            <div class="chat-subtitle">Задайте вопрос</div>
                        </div>
                    </div>
                    <button class="chat-close" id="chat-close" aria-label="Закрыть чат">×</button>
                </div>
                <div class="chat-messages" id="chat-messages"></div>
                <div class="chat-footer">
                    <input
                        id="chat-input"
                        class="chat-input"
                        placeholder="Напишите вопрос..."
                    />
                    <button id="chat-send" class="chat-send">
                        <span>➤</span>
                    </button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', widgetHTML);
    }

    // Initialize widget
    function initChatWidget() {
        const launcher = document.getElementById("chat-launcher");
        const widget = document.getElementById("chat-widget");
        const closeBtn = document.getElementById("chat-close");
        const messagesEl = document.getElementById("chat-messages");
        const inputEl = document.getElementById("chat-input");
        const sendBtn = document.getElementById("chat-send");

        let isSending = false;

        function appendMessage(text, from) {
            const div = document.createElement("div");
            div.className = "chat-message " + from;
            div.textContent = text;
            messagesEl.appendChild(div);
            messagesEl.scrollTop = messagesEl.scrollHeight;
        }

        function appendTyping() {
            const div = document.createElement("div");
            div.className = "chat-message bot";
            div.id = "typing-indicator";
            div.innerHTML = '<div class="typing-indicator"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>';
            messagesEl.appendChild(div);
            messagesEl.scrollTop = messagesEl.scrollHeight;
        }

        function removeTyping() {
            const el = document.getElementById("typing-indicator");
            if (el) el.remove();
        }

        async function sendMessage() {
            if (isSending) return;
            const text = inputEl.value.trim();
            if (!text) return;

            appendMessage(text, "user");
            inputEl.value = "";

            isSending = true;
            sendBtn.disabled = true;
            appendTyping();

            try {
                const res = await fetch(API_BASE + "/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message: text })
                });

                if (!res.ok) {
                    throw new Error("Server error");
                }

                const data = await res.json();
                removeTyping();
                appendMessage(data.answer, "bot");
            } catch (err) {
                console.error(err);
                removeTyping();
                appendMessage("Не удалось получить ответ. Проверьте подключение к серверу.", "bot");
            } finally {
                isSending = false;
                sendBtn.disabled = false;
            }
        }

        launcher.addEventListener("click", () => {
            widget.style.display = "flex";
            launcher.style.display = "none";
            if (!messagesEl.hasChildNodes()) {
                appendMessage("Привет! Я FAQ-ассистент. Задайте вопрос о компании и услугах.", "bot");
            }
            setTimeout(() => inputEl.focus(), 50);
        });

        closeBtn.addEventListener("click", () => {
            widget.style.display = "none";
            launcher.style.display = "flex";
        });

        sendBtn.addEventListener("click", sendMessage);

        inputEl.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            createChatWidget();
            initChatWidget();
        });
    } else {
        createChatWidget();
        initChatWidget();
    }
})();
