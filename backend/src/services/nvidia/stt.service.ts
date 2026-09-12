import axios from 'axios';
import { config } from '../../config';

/**
 * Speech-to-Text Service
 * Uses NVIDIA Parakeet via NIM, falls back to Groq Whisper
 */
export class STTService {
  /**
   * Transcribe audio buffer to text
   */
  static async transcribe(audioBuffer: Buffer, format = 'webm'): Promise<string> {
    // Try NVIDIA NIM Parakeet
    if (config.nvidia.apiKey) {
      try {
        return await this.nvidiaStt(audioBuffer, format);
      } catch (error) {
        console.warn('[STT] NVIDIA failed, trying Groq Whisper:', error);
      }
    }

    // Fallback to Groq Whisper
    if (config.groq.apiKey) {
      try {
        return await this.groqWhisper(audioBuffer, format);
      } catch (error) {
        console.warn('[STT] Groq Whisper failed:', error);
      }
    }

    throw new Error('No STT provider available. Set NVIDIA_API_KEY or GROQ_API_KEY.');
  }

  private static async nvidiaStt(audioBuffer: Buffer, format: string): Promise<string> {
    const FormData = (await import('form-data')).default;
    const formData = new FormData();
    formData.append('file', audioBuffer, {
      filename: `audio.${format}`,
      contentType: `audio/${format}`,
    });
    formData.append('model', 'nvidia/parakeet-ctc-1.1b-asr');
    formData.append('language', 'en');

    const response = await axios.post(
      `${config.nvidia.baseUrl}/audio/transcriptions`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${config.nvidia.apiKey}`,
          ...formData.getHeaders(),
        },
        timeout: 30000,
      }
    );

    return response.data.text || '';
  }

  private static async groqWhisper(audioBuffer: Buffer, format: string): Promise<string> {
    const FormData = (await import('form-data')).default;
    const formData = new FormData();
    formData.append('file', audioBuffer, {
      filename: `audio.${format}`,
      contentType: `audio/${format}`,
    });
    formData.append('model', 'whisper-large-v3');
    formData.append('language', 'en');

    const response = await axios.post(
      'https://api.groq.com/openai/v1/audio/transcriptions',
      formData,
      {
        headers: {
          Authorization: `Bearer ${config.groq.apiKey}`,
          ...formData.getHeaders(),
        },
        timeout: 30000,
      }
    );

    return response.data.text || '';
  }
}
