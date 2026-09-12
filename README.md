# Voice Buddy — Emotionally Aware Voice Companion

Voice Buddy is an **emotionally aware AI voice assistant** designed to provide supportive and natural conversations through selectable family-inspired personas.

The system combines **voice interaction, emotion detection, conversational AI, and personalized personas** to create a more empathetic user experience.

## Features

* 🎙️ Voice-based conversation
* 🧠 Emotion-aware response generation
* 💬 Real-time conversational interaction
* 👨‍👩‍👧‍👦 Selectable personas:

  * Dad
  * Mom
  * Grandparent
  * Sibling
* 🔊 Speech-to-text and text-to-speech
* 💾 Conversation and user data storage
* ⚡ Real-time communication using WebSockets

## Tech Stack

* **Frontend:** React, Vite, TypeScript
* **Backend:** Node.js, Express, TypeScript, WebSocket
* **AI / Voice:** NVIDIA NIM, Groq, OpenAI
* **Emotion Detection:** LLM-based emotion detection with keyword fallback
* **Database:** MongoDB
* **Caching:** Redis

## Architecture

```text
User
 │
 ▼
React Frontend
 │
 │ WebSocket / API
 ▼
Node.js + Express Backend
 │
 ├── Emotion Detection
 ├── Persona Management
 ├── Conversation Services
 └── Voice Services
       │
       ├── Speech-to-Text
       ├── LLM Response Generation
       └── Text-to-Speech
 │
 ▼
MongoDB + Redis
```

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/komalm12/EmoConversational.git
cd EmoConversational
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

The backend runs on:

```text
http://localhost:3001
```

Add the required API keys and database configuration to `backend/.env`.

### 3. Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on:

```text
http://localhost:5173
```

## Environment Variables

Configure the following variables in `backend/.env`:

```env
NVIDIA_API_KEY=your_nvidia_api_key
GROQ_API_KEY=your_groq_api_key
OPENAI_API_KEY=your_openai_api_key
MONGODB_URI=your_mongodb_connection_string
```

Keep your actual API keys private and **never commit your `.env` file to GitHub**.

## Project Structure

```text
EmoConversational/
│
├── backend/
│   ├── src/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── websocket/
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── services/
│   └── package.json
│
├── model/
│   ├── app.py
│   ├── data/
│   ├── notebooks/
│   └── requirements.txt
│
└── README.md
```

## Personas

| Persona        | Style                |
| -------------- | -------------------- |
| 👨 Dad         | Calm and protective  |
| 👩 Mom         | Warm and nurturing   |
| 👴 Grandparent | Gentle and wise      |
| 🧑 Sibling     | Casual and relatable |

## Note

Voice Buddy is an academic/team project exploring the use of **emotion-aware conversational AI and voice-based interaction** to create more supportive digital conversations.
