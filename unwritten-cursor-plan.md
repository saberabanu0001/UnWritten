# UNWRITTEN — Cursor Development Plan
## Full-Stack Build: FastAPI + MySQL + Docker | React + TypeScript + Tailwind

---

## TABLE OF CONTENTS

1. [Project Architecture](#1-project-architecture)
2. [Docker Stack Setup](#2-docker-stack-setup)
3. [Database Schema](#3-database-schema)
4. [Backend API Design](#4-backend-api-design)
5. [Frontend Structure](#5-frontend-structure)
6. [Screen-by-Screen UI/UX Spec](#6-screen-by-screen-uiux-spec)
7. [AI Pipeline Integration](#7-ai-pipeline-integration)
8. [Cursor Prompts — Build Order](#8-cursor-prompts--build-order)
9. [Hackathon Day Timeline](#9-hackathon-day-timeline)

---

## 1. PROJECT ARCHITECTURE

```
unwritten/
├── docker-compose.yml
├── .env
├── .env.example
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── app/
│   │   ├── main.py                 # FastAPI app entry
│   │   ├── config.py               # Settings, env vars
│   │   ├── database.py             # MySQL connection + SQLAlchemy
│   │   │
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── user.py             # User model
│   │   │   ├── book.py             # Book model
│   │   │   ├── chapter.py          # Chapter model
│   │   │   └── media.py            # Generated images model
│   │   │
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── user.py             # Pydantic schemas
│   │   │   ├── book.py
│   │   │   ├── chapter.py
│   │   │   └── ai.py               # AI request/response schemas
│   │   │
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py             # Login, register, guest mode
│   │   │   ├── books.py            # CRUD books
│   │   │   ├── chapters.py         # CRUD chapters
│   │   │   ├── ai.py               # AI generation endpoints
│   │   │   └── export.py           # PDF export
│   │   │
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── ai_service.py       # Claude API + scene extraction
│   │   │   ├── image_service.py    # DALL-E / FLUX image gen
│   │   │   ├── prose_service.py    # Story writing pipeline
│   │   │   └── pdf_service.py      # PDF book generation
│   │   │
│   │   └── utils/
│   │       ├── __init__.py
│   │       ├── prompts.py          # All AI prompt templates
│   │       └── roman.py            # Roman numeral converter
│   │
│   └── tests/
│       ├── test_ai.py
│       └── test_chapters.py
│
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── vite.config.ts
│   ├── index.html
│   │
│   ├── public/
│   │   └── fonts/                  # Self-hosted Playfair + Lora
│   │
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── index.css               # Tailwind + custom book styles
│       │
│       ├── lib/
│       │   ├── api.ts              # Axios instance + API calls
│       │   ├── types.ts            # TypeScript interfaces
│       │   └── constants.ts        # Colors, config
│       │
│       ├── hooks/
│       │   ├── useVoiceInput.ts    # Web Speech API hook
│       │   ├── useAI.ts            # AI generation hook
│       │   └── useBook.ts          # Book state management
│       │
│       ├── stores/
│       │   └── bookStore.ts        # Zustand store
│       │
│       ├── components/
│       │   ├── layout/
│       │   │   ├── AppShell.tsx     # Main layout wrapper
│       │   │   ├── Header.tsx
│       │   │   └── ScreenTransition.tsx
│       │   │
│       │   ├── book/
│       │   │   ├── BookPage.tsx     # ⭐ THE hero component
│       │   │   ├── BookCover.tsx    # Front cover design
│       │   │   ├── ChapterCard.tsx  # Shelf chapter card
│       │   │   ├── PullQuote.tsx    # Styled pull quote
│       │   │   ├── Ornament.tsx     # ── ✦ ── dividers
│       │   │   └── Illustration.tsx # Image wrapper
│       │   │
│       │   ├── input/
│       │   │   ├── StoryInput.tsx   # Text area + voice
│       │   │   ├── VoiceButton.tsx  # Mic button with animation
│       │   │   ├── LanguageSelect.tsx
│       │   │   └── FollowUpChat.tsx # AI follow-up Q&A
│       │   │
│       │   └── ui/
│       │       ├── Button.tsx       # Styled button variants
│       │       ├── LoadingQuill.tsx  # Writing animation
│       │       ├── SealedOverlay.tsx # 🔒 chapter overlay
│       │       └── PrivateToggle.tsx
│       │
│       ├── pages/
│       │   ├── HomePage.tsx         # Landing / intro
│       │   ├── TellPage.tsx         # Story input
│       │   ├── CraftPage.tsx        # AI conversation
│       │   ├── ReadPage.tsx         # Book page preview
│       │   ├── ShelfPage.tsx        # Chapter collection
│       │   └── ExportPage.tsx       # PDF preview & download
│       │
│       └── assets/
│           ├── ornaments.svg
│           └── placeholder-illustrations/
│               ├── rooftop.svg
│               ├── river.svg
│               └── default.svg
```

---

## 2. DOCKER STACK SETUP

### docker-compose.yml

```yaml
version: '3.8'

services:
  # ── MySQL Database ──
  db:
    image: mysql:8.0
    container_name: unwritten-db
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: unwritten
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./backend/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ── FastAPI Backend ──
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: unwritten-api
    restart: unless-stopped
    environment:
      DATABASE_URL: mysql+asyncmy://${MYSQL_USER}:${MYSQL_PASSWORD}@db:3306/unwritten
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      IMAGE_GEN_API_KEY: ${IMAGE_GEN_API_KEY}
      IMAGE_GEN_PROVIDER: ${IMAGE_GEN_PROVIDER:-openai}
      JWT_SECRET: ${JWT_SECRET}
      CORS_ORIGINS: http://localhost:5173,http://localhost:3000
    ports:
      - "8000:8000"
    volumes:
      - ./backend/app:/app/app
      - media_data:/app/media
    depends_on:
      db:
        condition: service_healthy

  # ── React Frontend ──
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: unwritten-ui
    restart: unless-stopped
    environment:
      VITE_API_URL: http://localhost:8000
    ports:
      - "5173:5173"
    volumes:
      - ./frontend/src:/app/src
    depends_on:
      - backend

volumes:
  mysql_data:
  media_data:
```

### .env.example

```env
# Database
MYSQL_ROOT_PASSWORD=unwritten_root_2026
MYSQL_USER=unwritten_user
MYSQL_PASSWORD=unwritten_pass_2026

# AI APIs
ANTHROPIC_API_KEY=sk-ant-...
IMAGE_GEN_API_KEY=sk-...
IMAGE_GEN_PROVIDER=openai  # openai | stability | flux

# Auth
JWT_SECRET=your-secret-key-change-in-production

# App
CORS_ORIGINS=http://localhost:5173
```

### backend/Dockerfile

```dockerfile
FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    default-libmysqlclient-dev \
    pkg-config \
    wkhtmltopdf \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

### backend/requirements.txt

```
fastapi==0.115.0
uvicorn[standard]==0.30.0
sqlalchemy[asyncio]==2.0.30
asyncmy==0.2.9
pydantic==2.8.0
pydantic-settings==2.3.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.9
anthropic==0.34.0
openai==1.40.0
httpx==0.27.0
pdfkit==1.0.0
jinja2==3.1.4
pillow==10.4.0
python-dotenv==1.0.1
alembic==1.13.0
```

### frontend/Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

---

## 3. DATABASE SCHEMA

```sql
-- backend/init.sql

CREATE DATABASE IF NOT EXISTS unwritten;
USE unwritten;

-- Users (minimal for hackathon — guest mode primary)
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    display_name VARCHAR(100),
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    is_guest BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Books (a user's memoir collection)
CREATE TABLE books (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) DEFAULT 'My Unwritten Book',
    description TEXT,
    cover_style VARCHAR(50) DEFAULT 'classic',
    is_private BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Chapters (individual story pages)
CREATE TABLE chapters (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    book_id VARCHAR(36) NOT NULL,
    chapter_number INT NOT NULL,
    title VARCHAR(255),

    -- User's raw input
    raw_input TEXT NOT NULL,
    input_method ENUM('text', 'voice') DEFAULT 'text',
    language VARCHAR(10) DEFAULT 'en',

    -- AI follow-up
    followup_question TEXT,
    followup_answer TEXT,

    -- AI-generated content
    scene_data JSON,              -- extracted setting, people, sensory, emotion
    prose TEXT,                    -- the crafted narrative
    pull_quote TEXT,               -- the highlighted line
    image_prompt TEXT,             -- prompt sent to image gen

    -- Status
    is_sealed BOOLEAN DEFAULT FALSE,
    is_draft BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

-- Generated images
CREATE TABLE chapter_images (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    chapter_id VARCHAR(36) NOT NULL,
    image_url VARCHAR(500),        -- stored path or CDN URL
    image_data LONGBLOB,           -- optional: store image binary for offline
    style VARCHAR(50) DEFAULT 'ink_sketch',
    width INT DEFAULT 400,
    height INT DEFAULT 350,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
);

-- Index for fast queries
CREATE INDEX idx_chapters_book ON chapters(book_id, sort_order);
CREATE INDEX idx_books_user ON books(user_id);
```

### SQLAlchemy Models

```
backend/app/models/chapter.py — maps to chapters table
backend/app/models/book.py — maps to books table
backend/app/models/user.py — maps to users table
backend/app/models/media.py — maps to chapter_images table
```

---

## 4. BACKEND API DESIGN

### API Endpoints

```
BASE: /api/v1

── Auth ──────────────────────────────────────────────
POST   /auth/guest              → Create guest user + default book
POST   /auth/register           → Email/password signup
POST   /auth/login              → JWT token

── Books ─────────────────────────────────────────────
GET    /books                   → List user's books
POST   /books                   → Create new book
GET    /books/{id}              → Get book with chapter list
PATCH  /books/{id}              → Update title, privacy
DELETE /books/{id}              → Delete book

── Chapters ──────────────────────────────────────────
GET    /books/{id}/chapters     → List all chapters
POST   /books/{id}/chapters    → Create chapter (raw input)
GET    /chapters/{id}           → Get full chapter
PATCH  /chapters/{id}           → Update prose, title, seal/unseal
DELETE /chapters/{id}           → Delete chapter
PATCH  /chapters/{id}/reorder   → Change sort order

── AI Pipeline ───────────────────────────────────────
POST   /ai/extract-scene        → Input: raw text → Output: scene JSON + follow-up Q
POST   /ai/generate-prose       → Input: scene + follow-up A → Output: prose + pull quote
POST   /ai/generate-image       → Input: scene data → Output: image URL
POST   /ai/rewrite              → Input: chapter ID → regenerate prose

── Export ────────────────────────────────────────────
GET    /export/{book_id}/pdf    → Download full book as PDF
GET    /export/{chapter_id}/page → Download single page as PDF
```

### Key Pydantic Schemas

```python
# backend/app/schemas/ai.py

from pydantic import BaseModel
from typing import Optional

class SceneExtractRequest(BaseModel):
    raw_input: str
    language: str = "en"

class SceneExtractResponse(BaseModel):
    setting: str
    people: str
    sensory: str
    emotion: str
    followup_question: str

class ProseGenerateRequest(BaseModel):
    raw_input: str
    scene_data: dict
    followup_answer: Optional[str] = None
    language: str = "en"

class ProseGenerateResponse(BaseModel):
    title: str
    prose: str
    pull_quote: str

class ImageGenerateRequest(BaseModel):
    scene_data: dict
    style: str = "ink_sketch"   # ink_sketch | watercolor | pencil

class ImageGenerateResponse(BaseModel):
    image_url: str
    image_prompt: str
```

### Core Service — AI Pipeline

```python
# backend/app/services/ai_service.py

"""
The three-stage AI pipeline:
  1. extract_scene()  → scene JSON + follow-up question
  2. generate_prose()  → crafted narrative + pull quote
  3. generate_image() → ink-style illustration

Each stage is independent and can be retried/regenerated.
"""

# Stage 1: Scene Extraction
SCENE_EXTRACT_PROMPT = """
You are a memoir ghostwriter. A person shared a personal memory.

Extract these elements and respond with ONLY valid JSON:
{
  "setting": "where and when (location, time, season, weather)",
  "people": "who is present and their relationship to narrator",
  "sensory": "what they saw, heard, smelled, felt, tasted",
  "emotion": "the underlying feeling (inferred, not stated)",
  "followup_question": "ONE follow-up question to unlock vivid sensory detail.
    Ask like a WRITER, not a therapist.
    GOOD: 'What sound do you remember most?'
    BAD: 'How did that make you feel?'"
}

Memory: "{raw_input}"
"""

# Stage 2: Prose Generation
PROSE_GENERATE_PROMPT = """
Craft ONE page of a personal memoir. Respond with ONLY valid JSON:
{
  "title": "Evocative chapter title, 3-6 words",
  "prose": "The memoir passage.
    RULES:
    1. Write in the same person (1st/3rd) the user used
    2. Keep their vocabulary — 'grandma' stays 'grandma'
    3. Maximum 120 words
    4. Use at least two sensory details (smell, sound, texture, light)
    5. End on the emotional note, not a summary
    6. Poetic but accessible — Hemingway, not Shakespeare
    7. Two paragraphs separated by \\n\\n",
  "pull_quote": "The single most striking sentence, verbatim from your prose"
}

ORIGINAL MEMORY: "{raw_input}"
SCENE: {scene_json}
FOLLOW-UP ANSWER: "{followup_answer}"
LANGUAGE: {language}
"""

# Stage 3: Image Prompt
IMAGE_PROMPT_TEMPLATE = """
Convert this scene into a single image generation prompt.

STYLE: Black and white ink illustration, hand-drawn sketch style,
expressive linework, crosshatching for shadows, no color,
cream/off-white background, editorial book illustration.
Think: Satyajit Ray's Feluda books, Quentin Blake, Edward Gorey.

SCENE: {scene_json}

Output ONLY the image prompt. Under 150 words.
Focus on composition — foreground vs background.
Include one small surprising detail that makes it feel real.
"""
```

---

## 5. FRONTEND STRUCTURE

### tailwind.config.ts — Custom Design Tokens

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#F5F0E8',
          light: '#FDFBF7',
          dark: '#E8E0D0',
        },
        ink: {
          DEFAULT: '#2C2416',
          light: '#6B5D4F',
          muted: '#9B8B7A',
        },
        accent: {
          DEFAULT: '#8B4513',
          gold: '#D4A574',
          warm: '#A0522D',
        },
        sealed: '#8B2500',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"Lora"', '"Source Serif Pro"', 'Georgia', 'serif'],
        ui: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'chapter-num': ['2rem', { lineHeight: '1.2', letterSpacing: '0.02em' }],
        'chapter-title': ['1rem', { lineHeight: '1.4' }],
        'prose': ['0.9375rem', { lineHeight: '1.8' }],
        'pull-quote': ['0.9375rem', { lineHeight: '1.7' }],
        'label': ['0.6875rem', { lineHeight: '1', letterSpacing: '0.2em' }],
      },
      spacing: {
        'page-x': '2rem',
        'page-y': '2.5rem',
      },
      boxShadow: {
        'book': '0 2px 20px rgba(44, 36, 22, 0.12)',
        'book-hover': '0 4px 28px rgba(44, 36, 22, 0.18)',
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'page-turn': 'pageTurn 0.6s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pageTurn: {
          '0%': { transform: 'rotateY(0deg)', opacity: '1' },
          '50%': { transform: 'rotateY(-5deg)', opacity: '0.7' },
          '100%': { transform: 'rotateY(0deg)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config
```

### TypeScript Interfaces

```typescript
// frontend/src/lib/types.ts

export interface User {
  id: string
  displayName: string
  isGuest: boolean
}

export interface Book {
  id: string
  title: string
  description?: string
  coverStyle: 'classic' | 'modern' | 'minimal'
  isPrivate: boolean
  chapters: ChapterSummary[]
  createdAt: string
}

export interface ChapterSummary {
  id: string
  number: number
  title: string
  isSealed: boolean
  isDraft: boolean
  date: string
  previewText: string       // first 80 chars of prose
}

export interface Chapter {
  id: string
  bookId: string
  number: number
  title: string
  rawInput: string
  inputMethod: 'text' | 'voice'
  language: string
  followupQuestion?: string
  followupAnswer?: string
  sceneData?: SceneData
  prose: string
  pullQuote: string
  imageUrl?: string
  isSealed: boolean
  isDraft: boolean
  createdAt: string
}

export interface SceneData {
  setting: string
  people: string
  sensory: string
  emotion: string
  followupQuestion: string
}

export interface ProseResult {
  title: string
  prose: string
  pullQuote: string
}

export type Screen = 'home' | 'tell' | 'craft' | 'read' | 'shelf' | 'export'
export type ImageStyle = 'ink_sketch' | 'watercolor' | 'pencil'
export type Language = 'en' | 'ko' | 'bn' | 'es' | 'fr' | 'ja' | 'zh'
```

---

## 6. SCREEN-BY-SCREEN UI/UX SPEC

### Design Principles

```
1. BOOK, NOT APP — Every screen should feel like you're inside a book,
   not using a SaaS product. Cream backgrounds, serif typography,
   ornamental dividers, no harsh borders.

2. ONE ACTION PER SCREEN — Tell: write/speak. Craft: answer one question.
   Read: save or redo. Shelf: pick a chapter.

3. MOTION = WRITING — The only animations should feel like writing:
   text appearing word by word, pages turning, ink spreading.
   No bouncing, no sliding cards, no spinner wheels.

4. MOBILE-FIRST — This will be demoed on a phone projected to a screen.
   Everything must look perfect at 390px wide.
```

### Screen 1: HOME

```
┌─────────────────────────────────────────────────┐
│                                                  │
│              padding-top: 30vh                   │
│                                                  │
│          ╌╌ A PRIVATE MEMOIR ╌╌                  │  ← label, uppercase,
│                                                  │     tracking-[0.5em]
│            Unwritten                             │  ← font-display, 3rem
│                                                  │
│            ── ✦ ──                               │  ← accent-gold
│                                                  │
│   "Everyone carries stories they                 │  ← font-body, italic,
│    never tell. This is where                     │     ink-light
│    they become real."                            │
│                                                  │
│                                                  │
│   ┌─────────────────────────────┐                │  ← bg-ink, text-paper
│   │       Tell a story          │                │     full width, py-3.5
│   └─────────────────────────────┘                │
│                                                  │
│   ┌─────────────────────────────┐                │  ← border accent-gold/40
│   │   My book · 3 chapters      │                │     transparent bg
│   └─────────────────────────────┘                │
│                                                  │
│                                                  │
└─────────────────────────────────────────────────┘

Background: bg-paper
No header, no nav bar.
Centered vertically.
```

**Interactions:**
- "Tell a story" → navigates to TELL (fade transition)
- "My book" → navigates to SHELF (fade transition)
- Chapter count is live from API

---

### Screen 2: TELL

```
┌─────────────────────────────────────────────────┐
│ ← Back                                          │
│                                                  │
│                                                  │
│  Tell me a memory                                │  ← font-display, 1.5rem
│  A moment, a place, a person.                    │  ← font-body, italic,
│  Start anywhere.                                 │     ink-muted
│                                                  │
│  ┌───────────────────────────────────────────┐   │
│  │                                           │   │  ← bg-paper-light
│  │  We were sitting on the old rooftop,     │   │     border accent-gold/25
│  │  the one with the cracked tiles. She     │   │     font-body, text-prose
│  │  was peeling garlic and telling me       │   │     min-h-[200px]
│  │  about her village...                    │   │     placeholder: ink-muted/50
│  │                                           │   │
│  │                                           │   │
│  │                                           │   │
│  └───────────────────────────────────────────┘   │
│                                                  │
│  ┌───────────────────────────────────────────┐   │
│  │    🎙  Speak instead                      │   │  ← border dashed
│  └───────────────────────────────────────────┘   │     when active: bg-sealed/5
│                                                  │     pulsing red dot
│                                                  │
│     EN    KO    BN    ES    FR                   │  ← pill selectors
│     ──                                           │     active: bg-accent-gold/15
│                                                  │     border-accent
│  ┌───────────────────────────────────────────┐   │
│  │          Continue →                       │   │  ← bg-ink when text exists
│  └───────────────────────────────────────────┘   │     bg-ink-muted/25 when empty
│                                                  │
└─────────────────────────────────────────────────┘

VOICE INPUT STATE:
- Mic button turns to ⏹ with red pulse dot
- Text appears live in textarea as user speaks
- Border color changes to sealed (red) while recording
```

**Component breakdown:**
```
TellPage.tsx
  ├── StoryInput.tsx        (textarea with auto-resize)
  ├── VoiceButton.tsx       (mic toggle with animation)
  ├── LanguageSelect.tsx    (pill group, single select)
  └── Button.tsx            (primary variant)
```

---

### Screen 3: CRAFT

```
┌─────────────────────────────────────────────────┐
│ ← Back                                          │
│                                                  │
│  ┌───────────────────────────────────────────┐   │
│  │  YOUR MEMORY                              │   │  ← label-style header
│  │                                           │   │     bg-paper-light
│  │  "We were sitting on the old rooftop,    │   │     font-body, italic
│  │   the one with the cracked tiles..."     │   │     truncated at 200 chars
│  └───────────────────────────────────────────┘   │
│                                                  │
│                                                  │
│  ┌───────────────────────────────────────────┐   │
│  │  ✍  UNWRITTEN ASKS                       │   │  ← bg-paper-dark/30
│  │                                           │   │     accent header
│  │  "What could you see from that           │   │
│  │   rooftop when you looked out?"          │   │  ← font-display, italic
│  │                                           │   │     text-ink, 1.0625rem
│  └───────────────────────────────────────────┘   │
│                                                  │
│                                                  │
│  ┌───────────────────────────────────────────┐   │
│  │                                           │   │  ← same style as TELL
│  │  The whole neighborhood. Tin roofs        │   │     textarea
│  │  and mango trees. The sky was always     │   │
│  │  orange at that hour...                  │   │
│  │                                           │   │
│  └───────────────────────────────────────────┘   │
│                                                  │
│  ┌───────────────────────────────────────────┐   │
│  │       ✨ Write my page                    │   │  ← bg-ink, primary CTA
│  └───────────────────────────────────────────┘   │
│                                                  │
│      Skip — write from what I gave you           │  ← text button, ink-muted
│                                                  │
└─────────────────────────────────────────────────┘

LOADING STATE (while AI generates):
┌─────────────────────────────────────────────────┐
│                                                  │
│                                                  │
│              ── ✦ ──                             │
│                                                  │
│         Crafting your page...                    │  ← font-display, italic
│                                                  │     animate-pulse-slow
│              ── ✦ ──                             │     accent color
│                                                  │
│                                                  │
└─────────────────────────────────────────────────┘
```

**Component breakdown:**
```
CraftPage.tsx
  ├── FollowUpChat.tsx      (memory card + question + answer input)
  ├── LoadingQuill.tsx      (writing animation)
  └── Button.tsx            (primary + text variants)
```

---

### Screen 4: READ (⭐ THE HERO SCREEN)

```
┌─────────────────────────────────────────────────┐
│ ← Back              Preview — not saved yet      │
│                                                  │
│  ┌───────────────────────────────────────────┐   │
│  │                                           │   │  ← bg-paper
│  │              Chapter                      │   │     shadow-book
│  │               III                         │   │     max-w-[520px]
│  │         Tin Roofs and                     │   │     mx-auto
│  │          Mango Trees                      │   │
│  │            ── ✦ ──                        │   │
│  │                                           │   │
│  │  ┌──────────────┐                         │   │
│  │  │              │ The rooftop was our     │   │  ← IMAGE floats left
│  │  │  [AI INK     │ kingdom every evening.  │   │     w-[180px]
│  │  │ ILLUSTRATION]│ Grandmother would sit  │   │     mr-4, mb-2
│  │  │              │ cross-legged on the    │   │     TEXT WRAPS AROUND IT
│  │  │              │ worn mat, a mountain   │   │
│  │  └──────────────┘ of garlic beside her,  │   │
│  │  peeling each clove with fingers that    │   │
│  │  had memorized the motion decades ago.   │   │
│  │  The smell would mix with the dust       │   │
│  │  rising from the lane below.             │   │
│  │                                           │   │
│  │    I'd sit beside her, legs dangling     │   │  ← text-indent: 1.5rem
│  │  over the edge, watching the             │   │     for paragraph 2+
│  │  neighborhood unfold — tin roofs         │   │
│  │  catching the last copper light.         │   │
│  │                                           │   │
│  │  ┌─────────────────────────────────┐     │   │
│  │  │                                 │     │   │  ← border-t, border-b
│  │  │  "The smell of garlic and       │     │   │     accent-gold/40
│  │  │   evening dust — somehow that   │     │   │     font-display italic
│  │  │   became the scent of safety."  │     │   │     text-accent
│  │  │                                 │     │   │     text-center
│  │  └─────────────────────────────────┘     │   │     mx-6, my-7
│  │                                           │   │
│  │              ── ✦ ──                      │   │
│  │                                           │   │
│  └───────────────────────────────────────────┘   │
│                                                  │
│  ┌─────────────────────┐ ┌──────────────────┐    │
│  │  Save to my book    │ │    Rewrite       │    │  ← primary + secondary
│  └─────────────────────┘ └──────────────────┘    │
│                                                  │
└─────────────────────────────────────────────────┘
```

**Critical CSS for text wrap around image:**
```css
.book-page-body {
  text-align: justify;
  hyphens: auto;
  -webkit-hyphens: auto;
}

.book-illustration {
  float: left;
  width: 180px;
  height: 155px;
  margin-right: 1rem;
  margin-bottom: 0.5rem;
  border: 1px solid rgba(212, 165, 116, 0.25);
  border-radius: 2px;
  shape-outside: margin-box;    /* ← text wraps tightly */
}

.book-paragraph + .book-paragraph {
  text-indent: 1.5rem;
}
```

**Component breakdown:**
```
ReadPage.tsx
  ├── BookPage.tsx          (⭐ the full page layout)
  │   ├── Ornament.tsx      (── ✦ ── divider)
  │   ├── Illustration.tsx  (image with float + shape-outside)
  │   └── PullQuote.tsx     (bordered italic quote)
  └── Button.tsx            (save + rewrite actions)
```

---

### Screen 5: SHELF

```
┌─────────────────────────────────────────────────┐
│ ← Home                                          │
│                                                  │
│  My Unwritten Book                               │  ← font-display, 1.75rem
│  3 chapters · Started June 2026                  │  ← font-body, italic, muted
│                                                  │
│            ── ✦ ──                               │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐       │  ← 2-col grid on mobile
│  │          │  │          │  │          │       │     3-col on tablet+
│  │    I     │  │   II     │  │   III    │       │
│  │          │  │          │  │          │       │
│  │ Tin      │  │ The      │  │ River    │       │
│  │ Roofs    │  │ River    │  │ Memory   │       │
│  │ and...   │  │ Kept...  │  │          │       │
│  │          │  │  🔒      │  │   ✨     │       │
│  │ Jun 2026 │  │ Jun 2026 │  │ Jun 2026 │       │
│  └──────────┘  └──────────┘  └──────────┘       │
│                                                  │
│  ┌──────────┐                                    │
│  │          │                                    │  ← dashed border
│  │    +     │                                    │     accent-gold/25
│  │   New    │                                    │     hover: border-accent
│  │ chapter  │                                    │
│  │          │                                    │
│  └──────────┘                                    │
│                                                  │
│  ┌───────────────────────────────────────────┐   │
│  │   📥  Download as PDF book                │   │  ← bg-ink, primary
│  └───────────────────────────────────────────┘   │
│                                                  │
│        🔒 Private mode  ━━●  ON                  │  ← toggle switch
│                                                  │
└─────────────────────────────────────────────────┘

SEALED CHAPTER TAP:
- Shows overlay: dark bg + "This chapter is sealed 🔒"
- Fades after 2 seconds
- Optional: password/biometric unlock (post-hackathon)

CHAPTER CARD HOVER/TAP:
- Border transitions to accent color
- Subtle shadow-book-hover
```

**Component breakdown:**
```
ShelfPage.tsx
  ├── ChapterCard.tsx       (individual chapter card)
  │   └── SealedOverlay.tsx (🔒 overlay animation)
  ├── NewChapterCard.tsx    (dashed + button)
  ├── PrivateToggle.tsx     (toggle switch)
  └── Button.tsx            (PDF download)
```

---

## 7. AI PIPELINE INTEGRATION

### Service Architecture

```
User speaks/types
        │
        ▼
┌─────────────────────┐     POST /ai/extract-scene
│  Scene Extractor    │ ──→ Claude Sonnet 4.6
│  (ai_service.py)    │ ←── { setting, people, sensory,
└─────────────────────┘      emotion, followup_question }
        │
        ▼
  User answers follow-up
        │
        ▼
┌─────────────────────┐     POST /ai/generate-prose
│  Prose Writer       │ ──→ Claude Sonnet 4.6
│  (prose_service.py) │ ←── { title, prose, pull_quote }
└─────────────────────┘
        │
        ├──────────────────────────────┐
        ▼                              ▼
┌─────────────────────┐     ┌─────────────────────┐
│  Image Prompter     │     │  Save to DB          │
│  (ai_service.py)    │     │  (chapters router)   │
└─────────────────────┘     └─────────────────────┘
        │
        ▼
┌─────────────────────┐     POST /ai/generate-image
│  Image Generator    │ ──→ DALL-E 3 / FLUX / Stability
│  (image_service.py) │ ←── { image_url }
└─────────────────────┘
        │
        ▼
  Display on BookPage
```

### Image Generation Config

```python
# backend/app/services/image_service.py

IMAGE_STYLES = {
    "ink_sketch": {
        "suffix": "Black and white ink illustration, hand-drawn sketch, "
                  "expressive linework, crosshatching shadows, cream background, "
                  "editorial book illustration style, Quentin Blake meets Edward Gorey",
        "negative": "color, photorealistic, 3D render, anime, cartoon, watermark",
        "size": "1024x1024",  # crop to book ratio after
    },
    "watercolor": {
        "suffix": "Loose watercolor illustration, muted earth tones, "
                  "wet-on-wet technique, book illustration, painterly",
        "negative": "photorealistic, 3D, sharp lines, digital art",
        "size": "1024x1024",
    },
    "pencil": {
        "suffix": "Pencil sketch illustration, soft graphite shading, "
                  "detailed crosshatching, vintage book illustration",
        "negative": "color, photorealistic, 3D, digital",
        "size": "1024x1024",
    },
}
```

---

## 8. CURSOR PROMPTS — BUILD ORDER

### Prompt 1: Project Scaffolding (First 20 minutes)

```
Create a full-stack project called "unwritten" with:

BACKEND:
- FastAPI with async SQLAlchemy + asyncmy for MySQL
- Docker setup with MySQL 8.0 and FastAPI
- Project structure: app/main.py, app/config.py, app/database.py,
  app/models/, app/schemas/, app/routers/, app/services/
- CORS middleware for localhost:5173
- Health check endpoint at /api/health

FRONTEND:
- React 18 + TypeScript + Vite
- Tailwind CSS with these custom colors:
  paper: #F5F0E8, ink: #2C2416, accent: #8B4513, accent-gold: #D4A574
- Custom fonts: Playfair Display (display), Lora (body), Inter (ui)
- React Router v6 with routes: /, /tell, /craft, /read/:id, /shelf, /export
- Docker setup for frontend dev server

Include docker-compose.yml connecting all three services.
```

### Prompt 2: Database Models + Auth (30 minutes)

```
In the backend, create:

1. SQLAlchemy async models for:
   - users (id UUID, display_name, email, password_hash, is_guest, timestamps)
   - books (id UUID, user_id FK, title, description, cover_style, is_private, timestamps)
   - chapters (id UUID, book_id FK, chapter_number, title, raw_input, input_method,
     language, followup_question, followup_answer, scene_data JSON, prose,
     pull_quote, image_prompt, is_sealed, is_draft, sort_order, timestamps)
   - chapter_images (id UUID, chapter_id FK, image_url, style, timestamps)

2. Pydantic schemas for all models (create, read, update variants)

3. Auth router with:
   - POST /auth/guest — creates guest user + default book, returns JWT
   - JWT middleware that extracts user from token

4. Auto-create tables on startup with SQLAlchemy create_all
```

### Prompt 3: Book + Chapter CRUD (30 minutes)

```
Create routers for books and chapters:

Books router (/api/v1/books):
- GET / — list user's books with chapter counts
- POST / — create new book
- GET /{id} — get book with all chapter summaries
- PATCH /{id} — update title, privacy
- DELETE /{id} — delete book and all chapters

Chapters router (/api/v1/books/{book_id}/chapters):
- GET / — list all chapters ordered by sort_order
- POST / — create chapter with raw_input, auto-assign chapter_number
- GET /chapters/{id} — get full chapter with image
- PATCH /chapters/{id} — update any field (prose, title, seal/unseal)
- DELETE /chapters/{id} — delete chapter, reorder remaining
- PATCH /chapters/{id}/reorder — change sort_order

All endpoints require JWT auth. Use dependency injection for current_user.
```

### Prompt 4: AI Service (45 minutes)

```
Create the AI pipeline service in backend/app/services/:

1. ai_service.py:
   - extract_scene(raw_input: str, language: str) -> SceneData
     Uses Anthropic Claude API with this system prompt:
     [PASTE SCENE_EXTRACT_PROMPT FROM SECTION 4]
     Returns structured SceneData

   - generate_image_prompt(scene_data: dict) -> str
     Takes scene metadata and creates a DALL-E/FLUX prompt
     with ink_sketch style suffix

2. prose_service.py:
   - generate_prose(raw_input, scene_data, followup_answer, language) -> ProseResult
     Uses Claude API with this system prompt:
     [PASTE PROSE_GENERATE_PROMPT FROM SECTION 4]
     Returns { title, prose, pull_quote }

3. image_service.py:
   - generate_image(prompt: str, style: str) -> str
     Calls OpenAI DALL-E 3 API (or configurable provider)
     Saves image to /media/ directory
     Returns URL path

4. AI router (/api/v1/ai):
   - POST /extract-scene — calls extract_scene
   - POST /generate-prose — calls generate_prose
   - POST /generate-image — calls generate_image
   - POST /rewrite/{chapter_id} — regenerates prose for existing chapter

All endpoints require JWT. Handle API errors gracefully with fallbacks.
Use httpx async client for all external API calls.
```

### Prompt 5: Frontend — App Shell + Home (30 minutes)

```
Build the frontend app shell and home page:

1. AppShell.tsx:
   - Full-height bg-paper layout
   - Wraps all pages with max-w-[520px] mx-auto px-6
   - Animated route transitions (fade-in, 300ms)
   - Loads Google Fonts: Playfair Display (400, 600, 400i), Lora (400, 500, 400i), Inter (300, 400, 500)

2. HomePage.tsx:
   - Vertically centered content
   - "A PRIVATE MEMOIR" label (uppercase, tracking-[0.5em], text-ink-muted)
   - "Unwritten" title (font-display, text-5xl)
   - ── ✦ ── ornament (text-accent-gold)
   - Tagline in italic Lora
   - "Tell a story" primary button (bg-ink, text-paper, full-width)
   - "My book · N chapters" secondary button (border accent-gold/40)

3. Ornament.tsx:
   - Reusable ── ✦ ── component
   - Props: size ('sm' | 'md' | 'lg'), className

4. Button.tsx:
   - Variants: primary (bg-ink), secondary (border), text (no bg)
   - States: default, hover, disabled, loading
   - Font: Playfair Display for primary, Lora for secondary/text
   - Consistent padding, border-radius: 2px (barely rounded)

Make everything mobile-first. Test at 390px viewport width.
```

### Prompt 6: Frontend — Tell + Voice Input (30 minutes)

```
Build the Tell page with voice input:

1. TellPage.tsx:
   - Back button (← Back, text-ink-muted)
   - "Tell me a memory" heading (font-display)
   - Subtitle: "A moment, a place, a person. Start anywhere." (italic, muted)
   - StoryInput component
   - VoiceButton component
   - LanguageSelect component
   - "Continue →" primary button (disabled when empty)

2. StoryInput.tsx:
   - Textarea with auto-resize (grows as user types)
   - bg-paper-light, border accent-gold/25
   - Focus state: border-accent
   - Placeholder: "We were sitting on the old rooftop..." (ink-muted/50)
   - font-body, text-prose size

3. useVoiceInput.ts hook:
   - Uses Web Speech API (webkitSpeechRecognition)
   - Returns: { isListening, transcript, startListening, stopListening, isSupported }
   - Continuous mode, interim results
   - Auto-detects language from LanguageSelect

4. VoiceButton.tsx:
   - Default: 🎙 "Speak instead" with dashed border
   - Active: ⏹ "Listening... tap to stop" with pulsing red dot
   - bg-sealed/5 when active, border-sealed
   - CSS animation for pulse dot

5. LanguageSelect.tsx:
   - Horizontal pill group: EN KO BN ES FR JA ZH
   - Active pill: bg-accent-gold/15, border-accent, text-accent
   - Inactive: border-accent-gold/25, text-ink-muted
   - Single select, EN default
```

### Prompt 7: Frontend — Craft Page (30 minutes)

```
Build the Craft page with AI follow-up:

1. CraftPage.tsx:
   - Back button
   - Memory card (user's input, truncated, italic, bg-paper-light)
   - AI follow-up question card (bg-paper-dark/30, font-display italic)
   - Answer textarea (same style as Tell)
   - "✨ Write my page" primary button
   - "Skip — write from what I gave you" text button below
   - Loading state: LoadingQuill component

2. useAI.ts hook:
   - extractScene(rawInput, language) → calls POST /ai/extract-scene
   - generateProse(rawInput, sceneData, followupAnswer, language) → calls POST /ai/generate-prose
   - generateImage(sceneData, style) → calls POST /ai/generate-image
   - Returns: { sceneData, proseResult, imageUrl, isLoading, error, step }
   - step tracks: 'extracting' | 'writing' | 'illustrating'

3. LoadingQuill.tsx:
   - Centered on page
   - ── ✦ ── ornament top
   - Step message in font-display italic, text-accent, animate-pulse-slow
   - ── ✦ ── ornament bottom
   - Messages cycle: "Reading your memory..." → "Crafting your page..." → "Drawing the scene..."

4. FollowUpChat.tsx:
   - Two cards stacked:
     Card 1: "YOUR MEMORY" label + truncated input
     Card 2: "✍ UNWRITTEN ASKS" label + question in display italic
   - Answer textarea below
   - Animate-slide-up when question appears
```

### Prompt 8: Frontend — Book Page Component ⭐ (45 minutes — MOST TIME)

```
Build the BookPage component — this is THE hero of the app:

1. BookPage.tsx:
   Props: { chapter: Chapter, isPreview?: boolean }

   Layout (inside a bg-paper shadow-book container):
   - "Chapter" label (uppercase, tracking-[0.5em], text-ink-muted, text-sm)
   - Roman numeral (font-display, text-chapter-num)
   - Chapter title (font-display, italic, text-accent, text-chapter-title)
   - Ornament divider (── ✦ ──)
   - ILLUSTRATION + FIRST PARAGRAPH with text wrapping:
     * Image floats left: w-[180px] h-[155px] mr-4 mb-2
     * Use CSS shape-outside: margin-box for tight wrap
     * Text: font-body, text-prose, text-justify, hyphens-auto
   - REMAINING PARAGRAPHS with text-indent: 1.5rem
   - PULL QUOTE section:
     * Horizontal rules top and bottom (border-accent-gold/40)
     * Quote in font-display italic, text-accent, text-center
     * mx-6 my-7
   - Bottom ornament (── ✦ ──)

   CRITICAL CSS:
   - The image MUST float left with text wrapping around it
   - Use shape-outside: margin-box on the image
   - Text must be justified with auto-hyphens
   - The whole page should feel like a physical book page
   - Background: bg-paper (cream #F5F0E8)
   - All text: text-ink (sepia #2C2416)

2. Illustration.tsx:
   - Wrapper for chapter image
   - Float left styling
   - Subtle border: accent-gold/25
   - Loading state: skeleton with ink-muted/10 background
   - Fallback: SVG placeholder illustration

3. PullQuote.tsx:
   - Border top and bottom (accent-gold at 40% opacity)
   - Font: Playfair Display italic
   - Color: accent (#8B4513)
   - Opening and closing quotation marks
   - Centered text, generous padding (py-4 mx-6)

4. ReadPage.tsx:
   - Back button + "Preview — not saved yet" label (if preview)
   - BookPage component (full render)
   - Action buttons below:
     * Preview mode: "Save to my book" (primary, flex-2) + "Rewrite" (secondary, flex-1)
     * View mode: "Back to shelf" (primary)
   - Animate-fade-in on page load
```

### Prompt 9: Frontend — Shelf Page (30 minutes)

```
Build the Shelf page — the chapter collection:

1. ShelfPage.tsx:
   - Back button (← Home)
   - "My Unwritten Book" heading (font-display, text-3xl)
   - "N chapters · Started [month year]" subtitle (italic, muted)
   - Ornament divider
   - Grid of ChapterCards (2 columns mobile, 3 tablet+)
   - NewChapterCard at end
   - "📥 Download as PDF book" primary button
   - Private mode toggle

2. ChapterCard.tsx:
   Props: { chapter: ChapterSummary, onClick }
   - bg-paper-light (normal) or bg-ink/5 (sealed)
   - Border: accent-gold/20, hover: border-accent
   - Chapter number (font-display, text-2xl)
   - Title (font-body, italic, text-accent) — shows "Sealed" if sealed
   - Preview text (font-body, text-xs, text-ink-muted, 60 chars) — shows "🔒 Private" if sealed
   - Date (font-ui, text-xs, text-ink-muted)
   - Transition: border-color 200ms
   - Tap on sealed: show SealedOverlay for 2 seconds

3. SealedOverlay.tsx:
   - Absolute positioned over card
   - bg-ink at 90% opacity
   - "This chapter is sealed 🔒" centered
   - font-display italic, text-accent-gold
   - Animate-fade-in on show, auto-dismiss after 2s

4. NewChapterCard.tsx:
   - Dashed border (accent-gold/25)
   - "+" icon (text-3xl, text-accent-gold)
   - "New chapter" label (font-body, italic, muted)
   - Hover: border-accent
   - min-h same as ChapterCard

5. PrivateToggle.tsx:
   - Label: "🔒 Private mode"
   - Toggle switch (w-9 h-5)
   - ON state: bg-accent, dot right
   - OFF state: bg-ink-muted/30, dot left
   - "ON" / "OFF" text beside toggle

6. useBook.ts hook:
   - fetchBooks() → GET /books
   - fetchChapters(bookId) → GET /books/{id}/chapters
   - saveChapter(bookId, chapterData) → POST /books/{id}/chapters
   - updateChapter(id, data) → PATCH /chapters/{id}
   - deleteChapter(id) → DELETE /chapters/{id}
   - toggleSeal(id) → PATCH /chapters/{id} { is_sealed: toggle }
   - exportPdf(bookId) → GET /export/{id}/pdf → download blob
```

### Prompt 10: PDF Export (20 minutes)

```
Create the PDF export service:

BACKEND — pdf_service.py:
- Uses Jinja2 to render an HTML template of the full book
- Template mirrors the BookPage design: cream background, Playfair Display,
  Lora body, illustrations, pull quotes, ornamental dividers
- Each chapter = 1 page
- Includes a cover page with book title and date range
- Uses pdfkit (wkhtmltopdf) to convert HTML → PDF
- Returns PDF as StreamingResponse with filename "unwritten-book.pdf"

BACKEND — export router:
- GET /export/{book_id}/pdf → generates and returns full book PDF
- GET /export/{chapter_id}/page → generates single chapter page PDF

FRONTEND:
- "Download as PDF book" button triggers GET /export/{bookId}/pdf
- Shows loading state while PDF generates
- Auto-downloads the file via blob URL
```

---

## 9. HACKATHON DAY TIMELINE

```
BEFORE THE HACKATHON (Do now with Cursor):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
☐ Run Prompts 1-3: scaffolding + DB + CRUD         (ready to go)
☐ Run Prompt 5: frontend shell + home page          (ready to go)
☐ Test docker-compose up — all 3 services running   (ready to go)
☐ Pre-generate 3 ink illustrations for demo          (save as files)
☐ Write your demo memory script                      (practice once)
☐ Get API keys: Anthropic + DALL-E/FLUX              (ready to go)

NOTE: The hackathon rules say "Code writing begins on-site"
but "planning and research can be prepared in advance."
Your Docker setup, DB schema design, UI wireframes, prompts,
and API key setup are all "planning." The actual code goes on-site.

ON HACKATHON DAY:
━━━━━━━━━━━━━━━━
11:00 – 11:30  │ Hacking starts
               │ → docker-compose up
               │ → Run Prompts 1-3 (scaffold + DB + CRUD)
               │ → Verify backend health check works

11:30 – 12:00  │ → Run Prompt 4 (AI service)
               │ → Test /ai/extract-scene with curl
               │ → Test /ai/generate-prose with curl

12:00 – 12:30  │ → Run Prompts 5-6 (frontend shell + Tell page)
               │ → Test voice input on phone browser

12:30 – 13:00  │ → Run Prompt 7 (Craft page)
               │ → Test full flow: input → follow-up → prose
               │ → LUNCH (eat while testing)

13:00 – 14:00  │ → Run Prompt 8 (BookPage component) ⭐⭐⭐
               │ → THIS IS THE PRIORITY HOUR
               │ → Get text wrapping around illustration perfect
               │ → Test on phone + laptop resolution
               │ → Iterate on typography and spacing

14:00 – 14:30  │ → Run Prompt 9 (Shelf page)
               │ → Load pre-made demo chapters
               │ → Test sealed chapter overlay

14:30 – 15:00  │ → Image generation integration
               │ → If DALL-E works: wire it up
               │ → If slow/broken: use pre-generated images
               │ → Run Prompt 10 (PDF export) if time permits

15:00 – 15:45  │ → POLISH HOUR
               │ → Fix mobile layout issues
               │ → Add transitions between screens
               │ → Test complete flow 3 times end-to-end
               │ → Load 2 demo chapters into shelf

15:45 – 16:00  │ → SUBMISSION
               │ → Record a backup screen recording of the demo
               │ → Screenshot the book page (for slides)

16:00 – 17:40  │ → PRESENTATIONS
               │ → Follow the demo script from the blueprint doc
               │ → Speak the grandmother memory live
               │ → Show the book page transformation
               │ → Show the shelf with sealed chapter

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CONTINGENCY PLANS:
• WiFi down → phone hotspot, pre-cached API responses
• Image gen fails → pre-generated SVG illustrations (already in code)
• Voice fails on stage → type the memory, say "room is noisy"
• MySQL won't start → SQLite fallback (change one env var)
• Full backend down → use the React prototype artifact as backup
```

---

## FINAL CHECKLIST

```
☐ docker-compose up starts all 3 services
☐ Guest auth creates user + book automatically
☐ Tell page: text input works
☐ Tell page: voice input works on Chrome mobile
☐ Craft page: Claude extracts scene + asks follow-up
☐ Craft page: Claude generates prose + pull quote
☐ Read page: BookPage renders with text wrapping illustration
☐ Read page: pull quote displays correctly
☐ Read page: Save adds chapter to shelf
☐ Read page: Rewrite regenerates prose
☐ Shelf page: shows all chapters as cards
☐ Shelf page: sealed chapter shows overlay
☐ Shelf page: new chapter button works
☐ Image generation returns ink-style illustration
☐ PDF export downloads a formatted book
☐ Mobile layout works at 390px
☐ Laptop layout works for projection (1280px)
☐ Demo script practiced once with timer
☐ Backup screenshots saved on phone
```
