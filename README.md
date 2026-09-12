# 🧠 Voice Buddy — Emotionally Aware Voice Companion

An empathetic AI voice assistant that provides instant emotional support to students through selectable family personas.

## Quick Start

### Backend
```bash
cd backend
cp .env.example .env   # Add your API keys
npm install
npm run dev            # Starts on http://localhost:3001
```

### Frontend
```bash
cd frontend
npm install
npm run dev            # Starts on http://localhost:5173
```

## Architecture

- **Backend**: Express + WebSocket + TypeScript
- **Frontend**: React + Vite + TypeScript
- **Voice Pipeline**: NVIDIA NIM (STT/TTS) with Groq/OpenAI fallback
- **Emotion Detection**: LLM-based with keyword fallback
- **Database**: MongoDB + Redis
- **Personas**: Dad, Mom, Grandparent, Sibling

## Personas

| Persona | Style | Description |
|---------|-------|-------------|
| 👨 Dad | Calm | Protective, solution-oriented |
| 👩 Mom | Warm | Nurturing, deeply validating |
| 👴 Grandparent | Gentle | Wise, patient, storytelling |
| 🧑 Sibling | Casual | Relatable, real, supportive |

## API Keys Required

Set in `backend/.env`:
- `NVIDIA_API_KEY` — For STT/TTS (from [build.nvidia.com](https://build.nvidia.com))
- `GROQ_API_KEY` — Fallback LLM + Whisper STT
- `OPENAI_API_KEY` — Fallback TTS + LLM
- `MONGODB_URI` — Database connection

> At least one LLM API key is required for the text chat to work.

## Team Assignments

- **Data Collection , processing , interpretation **: Labdhi
- **Web App**: Komal / Shruti / Vaibhav
- **Voice Assistant / Backend**: Vaibhav / Arnav / Labdhi
- **DB (MongoDB + Redis)**: Vaibhav / Arnav
