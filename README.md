# AI-ассистент с RAG-системой

Система для интеграции AI-ассистента на сайт. Ассистент отвечает на вопросы пользователей на основе вашей базы знаний, используя RAG (Retrieval-Augmented Generation).

## Как это работает

1. Пользователь пишет вопрос в чат-виджет (кнопка 💬)
2. Вопрос отправляется на backend
3. Backend создаёт эмбеддинг вопроса через OpenAI API
4. Ищет похожие документы в FAISS индексе
5. Отправляет вопрос + контекст в GPT-4
6. Возвращает ответ в виджет
7. Виджет отображает ответ пользователю

## Структура проекта

```
├── README.md                    # Этот файл
├── MyPersonalSite/              # Фронтенд
│   ├── index.html               # Главная страница с виджетом
│   ├── chat-widget.js           # Логика чата
│   ├── chat-widget.css          # Стили чата
│   ├── script.js                # Основной скрипт
│   └── style.css                # Основные стили
├── backend/                     # Бэкенд
│   ├── app.py                   # FastAPI приложение
│   ├── build_index.py           # Построение индекса
│   ├── rag_index.py             # Работа с индексом
│   ├── requirements.txt          # Зависимости
│   ├── .env.example             # Пример конфига
│   └── __init__.py
└── data/                        # База знаний
    ├── doc1.txt - doc5.txt      # Документы
    ├── faiss_index.bin          # Индекс (автоматически)
    └── faqs_metadata.npy        # Метаданные (автоматически)
```

## Быстрый старт

### 1. Установка зависимостей

```bash
pip install -r backend/requirements.txt
```

### 2. Конфигурация

```bash
cd backend
cp .env.example .env
```

Отредактируйте `backend/.env` и добавьте OpenAI API ключ:
```
OPENAI_API_KEY=sk-your-key-here
```

Получить ключ: https://platform.openai.com/api-keys

### 3. Построение индекса

```bash
python -m backend.build_index
```

Скрипт загружает все `.txt` файлы из `data/`, создаёт эмбеддинги и строит FAISS индекс.

### 4. Запуск backend

```bash
cd backend
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

### 5. Запуск frontend

В другом терминале:
```bash
cd MyPersonalSite
python -m http.server 8080
```

Откройте браузер: `http://localhost:8080`

Нажмите кнопку 💬 в углу и начните общаться!

## Добавление документов

### Способ 1: .txt файлы

1. Создайте файл в `data/doc6.txt`
2. Первая строка — заголовок (вопрос)
3. Остальное — ответ
4. Пересчитайте индекс: `python -m backend.build_index`

Пример:
```
Как работает система?

Система использует RAG для поиска информации.
Сначала ищет похожие документы, потом генерирует ответ.
```

### Способ 2: JSON FAQ

Создайте `data/faqs.json`:
```json
[
  {
    "question": "Какие услуги вы предоставляете?",
    "answer": "Мы предоставляем консультации и внедрение AI решений."
  }
]
```

Пересчитайте индекс: `python -m backend.build_index`

## Кастомизация

### Изменить цвет виджета

Отредактируйте `MyPersonalSite/chat-widget.css`:

```css
/* Синий (по умолчанию) */
background: linear-gradient(135deg, #2563eb, #1e40af);

/* Зелёный */
background: linear-gradient(135deg, #10b981, #059669);

/* Красный */
background: linear-gradient(135deg, #ef4444, #dc2626);
```

### Изменить размер и позицию

```css
.chat-launcher {
    width: 64px;       /* Размер кнопки */
    height: 64px;
    bottom: 24px;      /* От низа */
    right: 24px;       /* От права */
}

.chat-widget {
    width: 360px;      /* Ширина окна */
    height: 480px;     /* Высота окна */
    bottom: 100px;     /* Над кнопкой */
    right: 24px;
}
```

### Изменить текст

Отредактируйте `MyPersonalSite/chat-widget.js`:

```javascript
// Приветствие
appendMessage("Привет! Я FAQ-ассистент. Задайте вопрос о компании и услугах.", "bot");

// Заголовок
<div class="chat-title">FAQ ассистент</div>
<div class="chat-subtitle">Задайте вопрос</div>

// Плейсхолдер
placeholder="Напишите вопрос..."
```

## Решение проблем

### "OPENAI_API_KEY is not set"
- Проверьте, что файл `.env` существует в `backend/`
- Проверьте, что в `.env` указан правильный API ключ
- Перезагрузите сервер

### "FAISS index or metadata not found"
- Запустите: `python -m backend.build_index`
- Проверьте, что в `data/` есть `.txt` файлы
- Проверьте, что созданы `faiss_index.bin` и `faqs_metadata.npy`

### Виджет не отправляет сообщения
- Проверьте, что backend запущен: `curl http://localhost:8000/health`
- Проверьте консоль браузера (F12 → Console) на ошибки
- Проверьте, что `API_BASE` в `chat-widget.js` указывает на правильный адрес

## Развёртывание на продакшене

### На сервере

```bash
pip install -r backend/requirements.txt
cd backend && cp .env.example .env
# Добавьте OPENAI_API_KEY в .env
python -m backend.build_index
gunicorn -w 4 -k uvicorn.workers.UvicornWorker backend.app:app --bind 0.0.0.0:8000
```

### Docker

Создайте `Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install -r requirements.txt

COPY backend/ ./backend/
COPY data/ ./data/

ENV OPENAI_API_KEY=${OPENAI_API_KEY}

RUN python -m backend.build_index

CMD ["uvicorn", "backend.app:app", "--host", "0.0.0.0", "--port", "8000"]
```

Запустите:
```bash
docker build -t rag-assistant .
docker run -e OPENAI_API_KEY=sk-... -p 8000:8000 rag-assistant
```

## API

### POST /chat

**Запрос:**
```json
{
  "message": "Ваш вопрос",
  "top_k": 3
}
```

**Ответ:**
```json
{
  "answer": "Ответ ассистента",
  "context": [
    {
      "question": "Похожий вопрос",
      "answer": "Ответ",
      "source": "doc1.txt"
    }
  ]
}
```

### GET /health

Проверка здоровья сервера.

## Технологии

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Backend:** FastAPI, Uvicorn
- **AI:** OpenAI API (embeddings, GPT-4)
- **Поиск:** FAISS
- **Данные:** NumPy

## Безопасность

- Никогда не коммитьте `.env` файл с API ключом
- Используйте переменные окружения на продакшене
- Используйте HTTPS на продакшене
- Ограничьте доступ к API (rate limiting)

## Производительность

- Открытие виджета: < 100ms
- Отправка сообщения: < 50ms
- Создание эмбеддинга: 200-500ms
- Поиск в FAISS: < 10ms
- Генерация ответа: 1-3 сек
- **Итого:** 1.5-4 сек

## Поддерживаемые браузеры

- Chrome/Chromium
- Firefox
- Safari
- Edge
- Мобильные браузеры

## Лицензия

MIT
