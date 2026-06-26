# UnWritten

A private memoir app — turn memories into beautifully crafted book pages.

## Stack

- **Backend:** FastAPI + SQLAlchemy (async) + MySQL/SQLite
- **Frontend:** React 18 + TypeScript + Tailwind CSS + Vite
- **AI:** Google Gemini (scene extraction + prose + ink illustrations)

## Quick Start

### Local development (no Docker)

**Backend:**
```bash
cd backend
pip install -r requirements.txt
# Uses SQLite by default — set DATABASE_URL for MySQL
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

### Docker (full stack)

```bash
cp .env.example .env
# Add GEMINI_API_KEY from https://aistudio.google.com/apikey
docker-compose up --build
```

- Frontend: http://localhost:5173
- API: http://localhost:8000
- Health: http://localhost:8000/api/health

## User Flow

1. **Home** — Tell a story or view your book
2. **Tell** — Write or speak a memory
3. **Craft** — Answer AI follow-up question
4. **Read** — Preview the crafted book page
5. **Shelf** — Collection of chapters + PDF export

## API Keys

Add `GEMINI_API_KEY` to `.env` for live AI. Get a free key at https://aistudio.google.com/apikey

Without the key, the app runs in fallback mode with placeholder content and SVG illustrations.
