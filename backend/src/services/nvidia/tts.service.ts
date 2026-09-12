import axios from 'axios';
import { config } from '../../config';

interface VoiceParams {
  pitch?: number;
  speed?: number;
  warmth?: number;
  voiceId?: string;
}

/**
 * Text-to-Speech Service
 * Uses NVIDIA FastPitch via NIM, falls back to Groq Orpheus TTS
 */
export class TTSService {
  /**
   * Convert text to speech audio buffer
   */
  static async synthesize(
    text: string,
    voiceParams?: VoiceParams
  ): Promise<Buffer> {
    // Try NVIDIA NIM first
    if (config.nvidia.apiKey) {
      try {
        return await this.nvidiaTts(text, voiceParams);
      } catch (error: any) {
        console.warn('[TTS] NVIDIA failed, trying Groq:', error?.message || error);
      }
    }

    // Fallback to Groq Orpheus TTS
    if (config.groq.apiKey) {
      try {
        return await this.groqTts(text, voiceParams);
      } catch (error: any) {
        if (error?.response?.data) {
          // Try to decode arraybuffer error response
          const errText = Buffer.isBuffer(error.response.data) || error.response.data instanceof ArrayBuffer
            ? Buffer.from(error.response.data).toString('utf-8')
            : JSON.stringify(error.response.data);
          console.warn('[TTS] Groq failed with response:', errText);
        } else {
          console.warn('[TTS] Groq failed:', error?.message || error);
        }
      }
    }

    throw new Error('No TTS provider available. Set NVIDIA_API_KEY or GROQ_API_KEY in .env');
  }

  private static async nvidiaTts(
    text: string,
    voiceParams?: VoiceParams
  ): Promise<Buffer> {
    const response = await axios.post(
      `${config.nvidia.baseUrl}/audio/speech`,
      {
        model: 'nvidia/fastpitch-hifigan-tts',
        input: text,
        voice: 'en-US',
        speed: voiceParams?.speed || 1.0,
        response_format: 'wav',
      },
      {
        headers: {
          Authorization: `Bearer ${config.nvidia.apiKey}`,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer',
        timeout: 30000,
      }
    );

    return Buffer.from(response.data);
  }

  /**
   * Split text into chunks that fit within the Groq Orpheus 200 char limit.
   * Splits on sentence boundaries to produce natural-sounding audio.
   */
  private static splitTextIntoChunks(text: string, maxLen = 190): string[] {
    if (text.length <= maxLen) return [text];

    const chunks: string[] = [];
    // Split on sentence-ending punctuation
    const sentences = text.match(/[^.!?]+[.!?]+\s*/g) || [text];
    let current = '';

    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (!trimmed) continue;

      if ((current + ' ' + trimmed).trim().length <= maxLen) {
        current = (current + ' ' + trimmed).trim();
      } else {
        if (current) chunks.push(current);
        // If a single sentence is longer than maxLen, split by commas or words
        if (trimmed.length > maxLen) {
          const parts = trimmed.match(new RegExp(`.{1,${maxLen}}(?:\\s|$)`, 'g')) || [trimmed];
          chunks.push(...parts.map((p) => p.trim()).filter(Boolean));
        } else {
          current = trimmed;
        }
      }
    }
    if (current) chunks.push(current);

    return chunks.filter(Boolean);
  }

  private static async groqTts(
    text: string,
    voiceParams?: VoiceParams
  ): Promise<Buffer> {
    const voice = voiceParams?.voiceId || 'autumn';
    const speed = voiceParams?.speed || 1.0;

    console.log(`[TTS] Groq Orpheus synthesizing with voice: ${voice}, text length: ${text.length}`);

    // Split text into chunks if it exceeds the 200 char limit
    const chunks = this.splitTextIntoChunks(text);
    console.log(`[TTS] Split into ${chunks.length} chunk(s)`);

    const audioBuffers: Buffer[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`[TTS] Synthesizing chunk ${i + 1}/${chunks.length}: "${chunk.slice(0, 50)}..." (${chunk.length} chars)`);

      const response = await axios.post(
        'https://api.groq.com/openai/v1/audio/speech',
        {
          model: 'canopylabs/orpheus-v1-english',
          input: chunk,
          voice: voice,
          speed: speed,
          response_format: 'wav',
        },
        {
          headers: {
            Authorization: `Bearer ${config.groq.apiKey}`,
            'Content-Type': 'application/json',
          },
          responseType: 'arraybuffer',
          timeout: 45000,
        }
      );

      audioBuffers.push(Buffer.from(response.data));
    }

    // If only one chunk, return it directly
    if (audioBuffers.length === 1) {
      console.log(`[TTS] Groq returned ${audioBuffers[0].length} bytes of audio`);
      return audioBuffers[0];
    }

    // For multiple chunks, concatenate WAV data (skip headers on subsequent chunks)
    // WAV header is 44 bytes, so we keep the first file's header and append raw PCM data
    const combined = this.concatenateWavBuffers(audioBuffers);
    console.log(`[TTS] Combined ${audioBuffers.length} chunks into ${combined.length} bytes`);
    return combined;
  }

  /**
   * Concatenate multiple WAV buffers into one.
   * Takes the header from the first file and appends raw PCM data from all files.
   */
  private static concatenateWavBuffers(buffers: Buffer[]): Buffer {
    if (buffers.length === 0) return Buffer.alloc(0);
    if (buffers.length === 1) return buffers[0];

    // WAV header is typically 44 bytes
    const HEADER_SIZE = 44;

    // Extract PCM data from each buffer (skip header)
    const pcmChunks: Buffer[] = buffers.map((buf, i) => {
      // First buffer: keep everything; subsequent: skip header
      return i === 0 ? buf : buf.slice(HEADER_SIZE);
    });

    const combined = Buffer.concat(pcmChunks);

    // Update the RIFF chunk size (bytes 4-7) and data chunk size (bytes 40-43)
    const fileSize = combined.length;
    combined.writeUInt32LE(fileSize - 8, 4);       // RIFF chunk size
    combined.writeUInt32LE(fileSize - HEADER_SIZE, 40); // data chunk size

    return combined;
  }
}
