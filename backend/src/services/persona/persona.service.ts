import { getPersona, PersonaConfig } from './personas.config';

/**
 * Persona Service — builds dynamic system prompts by
 * combining the persona base prompt with current emotional context
 */
export class PersonaService {
  /**
   * Build a complete system prompt for the LLM
   */
  static buildSystemPrompt(
    personaId: string,
    currentEmotion?: string,
    userName?: string,
    conversationContext?: string[]
  ): string {
    const persona = getPersona(personaId);
    const sections: string[] = [];

    // Core persona identity
    sections.push(persona.systemPrompt);

    // User name personalization
    if (userName) {
      sections.push(
        `\nThe student's name is ${userName}. Use their name occasionally to make the conversation personal, but don't overdo it.`
      );
    }

    // Emotional context adjustment
    if (currentEmotion && persona.emotionalOverrides[currentEmotion]) {
      sections.push(
        `\n=== CURRENT EMOTIONAL CONTEXT ===\nThe student appears to be feeling ${currentEmotion}. Adjust your approach:\n${persona.emotionalOverrides[currentEmotion]}`
      );
    }

    // Conversation memory guidance
    if (conversationContext && conversationContext.length > 0) {
      sections.push(
        `\n=== CONVERSATION MEMORY ===\nKey topics already discussed (do NOT repeat these unless asked):\n${conversationContext.slice(-5).map((t) => `- ${t}`).join('\n')}`
      );
    }

    // Voice-specific formatting rules
    sections.push(`
=== VOICE CONVERSATION RULES ===
- This is a VOICE conversation. Speak naturally like a phone call.
- Keep responses to 2-4 sentences unless they ask for more detail.
- NEVER use emojis, markdown, bullet points, numbered lists, or any formatting.
- Use contractions naturally: I'm, you're, that's, don't, can't, won't.
- Maintain consistent emotional tone throughout your response.
- Express emotions through word choice and phrasing, not symbols.`);

    return sections.join('\n\n');
  }

  /**
   * Get persona metadata for frontend display
   */
  static getPersonaInfo(personaId: string) {
    const persona = getPersona(personaId);
    return {
      id: persona.id,
      name: persona.name,
      label: persona.label,
      emoji: persona.emoji,
      description: persona.description,
      tone: persona.tone,
    };
  }

  /**
   * Get voice parameters for TTS
   */
  static getVoiceParams(personaId: string) {
    const persona = getPersona(personaId);
    return {
      ...persona.voiceParams,
      voiceId: persona.voiceId,
    };
  }
}
