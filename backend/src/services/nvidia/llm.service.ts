import axios from 'axios';
import { config } from '../../config';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * LLM Service — handles conversation generation
 * Uses NVIDIA NIM first, falls back to Groq
 */
export class LLMService {
  /**
   * Generate a conversation response given messages
   */
  static async chat(messages: ChatMessage[], maxTokens = 300): Promise<string> {
    // Try NVIDIA NIM first
    if (config.nvidia.apiKey) {
      try {
        return await this.nvidiaChat(messages, maxTokens);
      } catch (error) {
        console.warn('[LLM] NVIDIA NIM failed, trying Groq:', error);
      }
    }

    // Try Groq
    if (config.groq.apiKey) {
      try {
        return await this.groqChat(messages, maxTokens);
      } catch (error) {
        console.warn('[LLM] Groq failed:', error);
      }
    }

    console.error('[LLM] No LLM provider available! Set NVIDIA_API_KEY or GROQ_API_KEY in .env');
    return "I'm having trouble connecting right now. Please make sure an API key is configured in the .env file. I'm here for you.";
  }

  /**
   * Raw prompt for internal use (emotion detection, etc.)
   */
  static async generateRaw(prompt: string, maxTokens = 100): Promise<string> {
    return this.chat([{ role: 'user', content: prompt }], maxTokens);
  }

  // ---- Provider implementations ----

  private static async nvidiaChat(messages: ChatMessage[], maxTokens: number): Promise<string> {
    const response = await axios.post(
      `${config.nvidia.baseUrl}/chat/completions`,
      {
        model: 'meta/llama-3.1-8b-instruct',
        messages,
        max_tokens: maxTokens,
        temperature: 0.7,
        top_p: 0.9,
      },
      {
        headers: {
          Authorization: `Bearer ${config.nvidia.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    return response.data.choices[0]?.message?.content || '';
  }

  private static async groqChat(messages: ChatMessage[], maxTokens: number): Promise<string> {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.1-8b-instant',
        messages,
        max_tokens: maxTokens,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${config.groq.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    return response.data.choices[0]?.message?.content || '';
  }
}
