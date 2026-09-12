const API_BASE = import.meta.env.VITE_BACKEND_URL || '/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('ec_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export interface Persona {
  id: string;
  name: string;
  label: string;
  emoji: string;
  description: string;
  tone: string;
  samplePhrases: string[];
}

export interface ChatStartResponse {
  success: boolean;
  sessionId: string;
  persona: Persona;
  greeting: string;
}

export interface ChatMessageResponse {
  success: boolean;
  response: string;
  emotion: {
    detected: string;
    intensity: number;
    confidence: number;
  };
}

export const api = {
  auth: {
    async register(data: any) {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    async login(data: any) {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    async me() {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: getAuthHeaders(),
      });
      return res.json();
    },
    async updateProfile(data: any) {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return res.json();
    },
  },

  async getPersonas(): Promise<Persona[]> {
    const res = await fetch(`${API_BASE}/persona/all`);
    const data = await res.json();
    return data.personas;
  },

  async startChat(personaId: string, userName?: string): Promise<ChatStartResponse> {
    const res = await fetch(`${API_BASE}/chat/start`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ personaId, userName }),
    });
    return res.json();
  },

  async sendMessage(sessionId: string, content: string): Promise<ChatMessageResponse> {
    const res = await fetch(`${API_BASE}/chat/message`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ sessionId, content }),
    });
    return res.json();
  },

  async getHistory(sessionId: string) {
    const res = await fetch(`${API_BASE}/chat/history/${sessionId}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async synthesize(text: string, personaId: string): Promise<ArrayBuffer> {
    const res = await fetch(`${API_BASE}/chat/synthesize`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ text, personaId }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `TTS failed (${res.status})`);
    }

    return res.arrayBuffer();
  },
};
