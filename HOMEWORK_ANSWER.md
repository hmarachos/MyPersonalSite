# ИИ-ассистент для техподдержки и FAQ

## ✅ Реализовано

**Кастомный ассистент на базе OpenAI GPTs:**
- Создан в OpenAI Playground (ID: `asst_2ndEB1goZwfjipYmA0bLEOoC`)
- Интегрирован в веб-сайт через чат-виджет
- Обрабатывает типовые вопросы 24/7
- Поддерживает базу знаний (FAQ документы в `/data/`)
- Готов к публикации в GPTs Store

**Технический стек:**
- Backend: FastAPI + OpenAI Assistant API
- Frontend: Чат-виджет (chat-widget.js)
- База знаний: Текстовые файлы + FAISS индекс
- Развертывание: http://46.17.105.48:8002

## 🔗 Ссылки для тестов

- [OpenAI Assistants API](https://platform.openai.com/docs/assistants/overview)
- [GPTs Playground](https://platform.openai.com/playground)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [OpenAI Python Client](https://github.com/openai/openai-python)

## 🚀 Быстрый старт

```bash
source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn backend.app:app --reload --port 8002
open index.html
```

Нажми на кнопку 💬 в углу и протестируй ассистента.
