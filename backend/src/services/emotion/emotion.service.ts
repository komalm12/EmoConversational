import { LLMService } from '../nvidia/llm.service';

export interface EmotionResult {
  emotion: string;
  intensity: number;  // 0-1
  confidence: number; // 0-1
}

const EMOTION_CATEGORIES = [
  'joy',
  'sadness',
  'anxiety',
  'anger',
  'fear',
  'surprise',
  'neutral',
  'frustration',
  'loneliness',
  'overwhelm',
] as const;

/**
 * Emotion Detection Service
 * Uses LLM to analyze text for emotional signals
 */
export class EmotionService {
  private recentEmotions: EmotionResult[] = [];
  private maxHistory = 10;

  /**
   * Detect emotion from user text using LLM analysis
   */
  async detectEmotion(text: string): Promise<EmotionResult> {
    // Quick check for very short / empty text
    if (!text || text.trim().length < 3) {
      return { emotion: 'neutral', intensity: 0.3, confidence: 0.5 };
    }

    try {
      const prompt = `Analyze the emotional state expressed in this text. Respond with ONLY a JSON object, nothing else.

Text: "${text}"

Respond with exactly this format:
{"emotion": "<one of: ${EMOTION_CATEGORIES.join(', ')}>", "intensity": <0.0-1.0>, "confidence": <0.0-1.0>}

Rules:
- emotion: the primary emotion detected
- intensity: how strongly the emotion is expressed (0=barely, 1=extremely)
- confidence: how confident you are in this detection (0=guess, 1=certain)
- If the text is neutral or you can't tell, use "neutral" with low intensity`;

      const response = await LLMService.generateRaw(prompt, 100);

      // Parse the JSON response
      const jsonMatch = response.match(/\{[^}]+\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const result: EmotionResult = {
          emotion: EMOTION_CATEGORIES.includes(parsed.emotion) ? parsed.emotion : 'neutral',
          intensity: Math.max(0, Math.min(1, parsed.intensity || 0.5)),
          confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
        };

        this.addToHistory(result);
        return result;
      }
    } catch (error) {
      console.error('[EmotionService] Detection failed:', error);
    }

    // Fallback: simple keyword-based detection
    return this.fallbackDetection(text);
  }

  /**
   * Get the dominant emotion from recent history
   */
  getDominantEmotion(): string {
    if (this.recentEmotions.length === 0) return 'neutral';

    const emotionCounts: Record<string, number> = {};
    for (const e of this.recentEmotions) {
      emotionCounts[e.emotion] = (emotionCounts[e.emotion] || 0) + e.intensity;
    }

    return Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0][0];
  }

  /**
   * Get the recent emotional trend
   */
  getEmotionalTrend(): EmotionResult[] {
    return [...this.recentEmotions];
  }

  /**
   * Clear history (new session)
   */
  reset(): void {
    this.recentEmotions = [];
  }

  private addToHistory(result: EmotionResult): void {
    this.recentEmotions.push(result);
    if (this.recentEmotions.length > this.maxHistory) {
      this.recentEmotions.shift();
    }
  }

  /**
   * Simple keyword fallback when LLM is unavailable
   */
  private fallbackDetection(text: string): EmotionResult {
    const lower = text.toLowerCase();

    const patterns: Array<{ keywords: string[]; emotion: string; intensity: number }> = [
      { keywords: ['sad', 'crying', 'depressed', 'hopeless', 'miserable', 'heartbroken'], emotion: 'sadness', intensity: 0.7 },
      { keywords: ['anxious', 'worried', 'nervous', 'panic', 'stressed', 'overwhelmed', 'scared'], emotion: 'anxiety', intensity: 0.7 },
      { keywords: ['angry', 'furious', 'pissed', 'mad', 'frustrated', 'annoyed', 'hate'], emotion: 'anger', intensity: 0.7 },
      { keywords: ['happy', 'excited', 'great', 'awesome', 'amazing', 'wonderful', 'love'], emotion: 'joy', intensity: 0.6 },
      { keywords: ['lonely', 'alone', 'isolated', 'nobody', 'no friends', 'no one cares'], emotion: 'loneliness', intensity: 0.8 },
      { keywords: ['too much', 'can\'t handle', 'drowning', 'falling apart'], emotion: 'overwhelm', intensity: 0.8 },
      { keywords: ['afraid', 'terrified', 'scared', 'frightened'], emotion: 'fear', intensity: 0.7 },
    ];

    for (const pattern of patterns) {
      if (pattern.keywords.some((kw) => lower.includes(kw))) {
        const result = { emotion: pattern.emotion, intensity: pattern.intensity, confidence: 0.4 };
        this.addToHistory(result);
        return result;
      }
    }

    const result = { emotion: 'neutral', intensity: 0.3, confidence: 0.5 };
    this.addToHistory(result);
    return result;
  }
}
