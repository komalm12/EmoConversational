import { WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { STTService } from '../services/nvidia/stt.service';
import { TTSService } from '../services/nvidia/tts.service';
import { LLMService } from '../services/nvidia/llm.service';
import { EmotionService } from '../services/emotion/emotion.service';
import { PersonaService } from '../services/persona/persona.service';
import { KnowledgeService } from '../services/knowledge/knowledge.service';

interface SessionState {
  sessionId: string;
  personaId: string;
  userName?: string;
  emotionService: EmotionService;
  messageHistory: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  audioChunks: Buffer[];
  isProcessing: boolean;
}

const sessions = new Map<WebSocket, SessionState>();

/**
 * Handle a new WebSocket connection for voice chat
 */
export function handleVoiceConnection(ws: WebSocket): void {
  console.log('[WS] New voice connection');

  ws.on('message', async (data: Buffer | string) => {
    try {
      // Check if it's a control message (JSON) or audio data (binary)
      if (typeof data === 'string' || (Buffer.isBuffer(data) && data[0] === 0x7B)) {
        const message = JSON.parse(data.toString());
        await handleControlMessage(ws, message);
      } else if (Buffer.isBuffer(data)) {
        await handleAudioData(ws, data);
      }
    } catch (error) {
      console.error('[WS] Error handling message:', error);
      sendError(ws, 'Failed to process message');
    }
  });

  ws.on('close', () => {
    const session = sessions.get(ws);
    if (session) {
      console.log(`[WS] Session ${session.sessionId} closed`);
      sessions.delete(ws);
    }
  });

  ws.on('error', (error) => {
    console.error('[WS] Connection error:', error);
    sessions.delete(ws);
  });
}

/**
 * Handle JSON control messages
 */
async function handleControlMessage(
  ws: WebSocket,
  message: Record<string, any>
): Promise<void> {
  switch (message.type) {
    case 'session.start': {
      const sessionId = uuidv4();
      const personaId = message.personaId || 'mom';
      const userName = message.userName;

      const emotionService = new EmotionService();

      // Build initial system prompt
      const systemPrompt = PersonaService.buildSystemPrompt(
        personaId,
        undefined,
        userName
      );

      const session: SessionState = {
        sessionId,
        personaId,
        userName,
        emotionService,
        messageHistory: [{ role: 'system', content: systemPrompt }],
        audioChunks: [],
        isProcessing: false,
      };

      sessions.set(ws, session);

      // Send session confirmation
      sendJson(ws, {
        type: 'session.started',
        sessionId,
        persona: PersonaService.getPersonaInfo(personaId),
      });

      // Generate and send greeting
      const greeting = await generateGreeting(session);
      session.messageHistory.push({ role: 'assistant', content: greeting });

      await KnowledgeService.saveMessage(
        sessionId,
        personaId,
        'assistant',
        greeting
      );

      sendJson(ws, {
        type: 'assistant.text',
        content: greeting,
        emotion: 'neutral',
      });

      // Generate TTS for greeting
      try {
        const voiceParams = PersonaService.getVoiceParams(personaId);
        const audioBuffer = await TTSService.synthesize(greeting, voiceParams);
        sendJson(ws, { type: 'assistant.audio.start' });
        ws.send(audioBuffer);
        sendJson(ws, { type: 'assistant.audio.end' });
      } catch (ttsError) {
        console.warn('[WS] TTS for greeting failed:', ttsError);
      }

      console.log(`[WS] Session started: ${sessionId} with persona: ${personaId}`);
      break;
    }

    case 'text.message': {
      const session = sessions.get(ws);
      if (!session) {
        sendError(ws, 'No active session');
        return;
      }

      await processTextMessage(ws, session, message.content);
      break;
    }

    case 'audio.start': {
      const session = sessions.get(ws);
      if (session) {
        session.audioChunks = [];
      }
      break;
    }

    case 'audio.end': {
      const session = sessions.get(ws);
      if (!session || session.audioChunks.length === 0) return;

      // Combine audio chunks and transcribe
      const fullAudio = Buffer.concat(session.audioChunks);
      session.audioChunks = [];

      try {
        sendJson(ws, { type: 'transcription.start' });
        const transcript = await STTService.transcribe(fullAudio);
        sendJson(ws, { type: 'user.text', content: transcript });

        if (transcript.trim()) {
          await processTextMessage(ws, session, transcript);
        }
      } catch (sttError) {
        console.error('[WS] STT failed:', sttError);
        sendError(ws, 'Failed to transcribe audio');
      }
      break;
    }

    case 'persona.switch': {
      const session = sessions.get(ws);
      if (!session) return;

      session.personaId = message.personaId || 'mom';
      const currentEmotion = session.emotionService.getDominantEmotion();
      const topics = await KnowledgeService.getTopicSummaries(session.sessionId);

      session.messageHistory[0] = {
        role: 'system',
        content: PersonaService.buildSystemPrompt(
          session.personaId,
          currentEmotion,
          session.userName,
          topics
        ),
      };

      sendJson(ws, {
        type: 'persona.switched',
        persona: PersonaService.getPersonaInfo(session.personaId),
      });
      break;
    }

    case 'session.end': {
      const session = sessions.get(ws);
      if (session) {
        sessions.delete(ws);
        sendJson(ws, { type: 'session.ended', sessionId: session.sessionId });
      }
      break;
    }

    default:
      console.warn(`[WS] Unknown message type: ${message.type}`);
  }
}

/**
 * Handle binary audio data chunks
 */
async function handleAudioData(ws: WebSocket, data: Buffer): Promise<void> {
  const session = sessions.get(ws);
  if (!session) return;

  session.audioChunks.push(data);
}

/**
 * Process a text message through the emotion + LLM pipeline
 */
async function processTextMessage(
  ws: WebSocket,
  session: SessionState,
  text: string
): Promise<void> {
  if (session.isProcessing) {
    sendJson(ws, { type: 'status', message: 'Still processing previous message...' });
    return;
  }

  session.isProcessing = true;

  try {
    // 1. Detect emotion
    const emotionResult = await session.emotionService.detectEmotion(text);
    sendJson(ws, { type: 'emotion.detected', ...emotionResult });

    // 2. Save user message
    await KnowledgeService.saveMessage(
      session.sessionId,
      session.personaId,
      'user',
      text,
      emotionResult.emotion
    );

    // 3. Update system prompt with emotional context
    const topics = await KnowledgeService.getTopicSummaries(session.sessionId);
    session.messageHistory[0] = {
      role: 'system',
      content: PersonaService.buildSystemPrompt(
        session.personaId,
        emotionResult.emotion,
        session.userName,
        topics
      ),
    };

    // 4. Add user message to history
    session.messageHistory.push({ role: 'user', content: text });

    // Keep history manageable (system + last 20 messages)
    if (session.messageHistory.length > 21) {
      session.messageHistory = [
        session.messageHistory[0],
        ...session.messageHistory.slice(-20),
      ];
    }

    // 5. Generate LLM response
    sendJson(ws, { type: 'assistant.thinking' });
    const response = await LLMService.chat(session.messageHistory);

    // 6. Save and send response
    session.messageHistory.push({ role: 'assistant', content: response });

    await KnowledgeService.saveMessage(
      session.sessionId,
      session.personaId,
      'assistant',
      response
    );

    await KnowledgeService.saveEmotionalState(
      session.sessionId,
      emotionResult.emotion,
      emotionResult.intensity
    );

    sendJson(ws, {
      type: 'assistant.text',
      content: response,
      emotion: emotionResult.emotion,
    });

    // 7. Generate TTS
    try {
      const voiceParams = PersonaService.getVoiceParams(session.personaId);
      const audioBuffer = await TTSService.synthesize(response, voiceParams);
      sendJson(ws, { type: 'assistant.audio.start' });
      ws.send(audioBuffer);
      sendJson(ws, { type: 'assistant.audio.end' });
    } catch (ttsError) {
      console.warn('[WS] TTS failed, text-only response sent:', ttsError);
    }
  } catch (error) {
    console.error('[WS] Error processing message:', error);
    sendError(ws, 'Something went wrong. Please try again.');
  } finally {
    session.isProcessing = false;
  }
}

/**
 * Generate a persona-appropriate greeting
 */
async function generateGreeting(session: SessionState): Promise<string> {
  const greetingPrompt = session.userName
    ? `The student named ${session.userName} just connected. Generate a warm, short greeting (1-2 sentences) in your persona's voice. Don't ask too many questions, just welcome them.`
    : `A student just connected. Generate a warm, short greeting (1-2 sentences) in your persona's voice. Don't ask too many questions, just welcome them and ask their name.`;

  session.messageHistory.push({ role: 'user', content: greetingPrompt });

  const greeting = await LLMService.chat(session.messageHistory);

  // Remove the greeting prompt from history (replace with the response only)
  session.messageHistory.pop();

  return greeting;
}

// ---- Helpers ----

function sendJson(ws: WebSocket, data: Record<string, any>): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

function sendError(ws: WebSocket, message: string): void {
  sendJson(ws, { type: 'error', message });
}
