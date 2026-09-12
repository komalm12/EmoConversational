import { Router, Request, Response } from 'express';
import { LLMService } from '../services/nvidia/llm.service';
import { STTService } from '../services/nvidia/stt.service';
import { TTSService } from '../services/nvidia/tts.service';
import { EmotionService } from '../services/emotion/emotion.service';
import { PersonaService } from '../services/persona/persona.service';
import { KnowledgeService } from '../services/knowledge/knowledge.service';
import { v4 as uuidv4 } from 'uuid';

const chatRouter = Router();

// In-memory text chat sessions (for non-WebSocket text mode)
export type SessionData = {
  personaId: string;
  userName?: string;
  emotionService: EmotionService;
  messageHistory: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
};

const textSessions = new Map<string, SessionData>();

/**
 * POST /api/chat/start
 * Start a new text chat session
 */
chatRouter.post('/start', async (req: Request, res: Response) => {
  try {
    const { personaId = 'mom', userName } = req.body;
    const sessionId = uuidv4();

    const emotionService = new EmotionService();
    const systemPrompt = PersonaService.buildSystemPrompt(personaId, undefined, userName);

    const session: SessionData = {
      personaId,
      userName,
      emotionService,
      messageHistory: [{ role: 'system', content: systemPrompt }],
    };

    textSessions.set(sessionId, session);

    // Generate greeting
    const greetingPrompt = userName
      ? `The student named ${userName} just started chatting. Generate a warm, short greeting (1-2 sentences).`
      : `A student just started chatting. Generate a warm, short greeting (1-2 sentences). Ask their name.`;

    const greeting = await LLMService.chat([
      ...session.messageHistory,
      { role: 'user', content: greetingPrompt },
    ]);

    session.messageHistory.push({ role: 'assistant', content: greeting });

    await KnowledgeService.saveMessage(sessionId, personaId, 'assistant', greeting);

    res.json({
      success: true,
      sessionId,
      persona: PersonaService.getPersonaInfo(personaId),
      greeting,
    });
  } catch (error: any) {
    console.error('[Chat] Start error:', error);
    res.status(500).json({ error: 'Failed to start chat session', message: error.message });
  }
});

/**
 * POST /api/chat/message
 * Send a message in an existing text chat session
 */
chatRouter.post('/message', async (req: Request, res: Response) => {
  try {
    const { sessionId, content } = req.body;

    if (!sessionId || !content) {
      return res.status(400).json({ error: 'sessionId and content are required' });
    }

    const session = textSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found. Start a new chat.' });
    }

    // 1. Detect emotion
    const emotion = await session.emotionService.detectEmotion(content);

    // 2. Save user message
    await KnowledgeService.saveMessage(
      sessionId, session.personaId, 'user', content, emotion.emotion
    );

    // 3. Update system prompt with emotion context
    const topics = await KnowledgeService.getTopicSummaries(sessionId);
    session.messageHistory[0] = {
      role: 'system',
      content: PersonaService.buildSystemPrompt(
        session.personaId,
        emotion.emotion,
        session.userName,
        topics
      ),
    };

    // 4. Add to history
    session.messageHistory.push({ role: 'user', content });
    if (session.messageHistory.length > 21) {
      session.messageHistory = [
        session.messageHistory[0],
        ...session.messageHistory.slice(-20),
      ];
    }

    // 5. Generate response
    const response = await LLMService.chat(session.messageHistory);
    session.messageHistory.push({ role: 'assistant', content: response });

    // 6. Save
    await KnowledgeService.saveMessage(sessionId, session.personaId, 'assistant', response);
    await KnowledgeService.saveEmotionalState(sessionId, emotion.emotion, emotion.intensity);

    res.json({
      success: true,
      response,
      emotion: {
        detected: emotion.emotion,
        intensity: emotion.intensity,
        confidence: emotion.confidence,
      },
    });
  } catch (error: any) {
    console.error('[Chat] Message error:', error);
    res.status(500).json({ error: 'Failed to process message', message: error.message });
  }
});

/**
 * GET /api/chat/history/:sessionId
 * Get conversation history
 */
chatRouter.get('/history/:sessionId', async (req: Request, res: Response) => {
  try {
    const sessionId = req.params.sessionId as string;
    const context = await KnowledgeService.getConversationContext(sessionId, 50);
    res.json({ success: true, messages: context });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch history', message: error.message });
  }
});

/**
 * POST /api/chat/transcribe
 * Transcribe audio to text using STT
 */
chatRouter.post('/transcribe', async (req: Request, res: Response) => {
  try {
    // Expect raw audio in body (frontend sends as ArrayBuffer)
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', async () => {
      const audioBuffer = Buffer.concat(chunks);

      if (audioBuffer.length === 0) {
        return res.status(400).json({ error: 'No audio data received' });
      }

      console.log(`[STT] Received audio: ${audioBuffer.length} bytes`);

      try {
        const transcript = await STTService.transcribe(audioBuffer, 'webm');
        console.log(`[STT] Transcribed: "${transcript}"`);
        res.json({ success: true, transcript });
      } catch (sttError: any) {
        console.error('[STT] Transcription failed:', sttError.message);
        res.status(500).json({ error: 'Transcription failed', message: sttError.message });
      }
    });
  } catch (error: any) {
    console.error('[Chat] Transcribe error:', error);
    res.status(500).json({ error: 'Failed to transcribe audio', message: error.message });
  }
});

/**
 * POST /api/chat/synthesize
 * Convert text to speech audio using persona-specific voice
 */
chatRouter.post('/synthesize', async (req: Request, res: Response) => {
  try {
    const { text, personaId = 'mom' } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'text is required' });
    }

    // Limit text length to prevent abuse
    const trimmedText = text.slice(0, 2000);

    console.log(`[TTS] Synthesize request: persona=${personaId}, text="${trimmedText.slice(0, 50)}..."`);

    const voiceParams = PersonaService.getVoiceParams(personaId);
    const audioBuffer = await TTSService.synthesize(trimmedText, voiceParams);

    console.log(`[TTS] Generated ${audioBuffer.length} bytes of audio`);

    res.set({
      'Content-Type': 'audio/wav',
      'Content-Length': audioBuffer.length.toString(),
      'Cache-Control': 'no-cache',
    });

    res.send(audioBuffer);
  } catch (error: any) {
    console.error('[Chat] Synthesize error:', error?.message || error);
    res.status(500).json({ error: 'Failed to synthesize speech', message: error?.message });
  }
});

export default chatRouter;
