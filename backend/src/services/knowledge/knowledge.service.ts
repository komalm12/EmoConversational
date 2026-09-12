import { ConversationModel } from '../../models/conversation.model';

/**
 * Knowledge Base Service
 * Manages user context and conversation history for emotionally-aware responses
 */
export class KnowledgeService {
  /**
   * Get recent conversation context for a session
   */
  static async getConversationContext(
    sessionId: string,
    limit = 10
  ): Promise<Array<{ role: string; content: string }>> {
    const conversation = await ConversationModel.findOne({ sessionId })
      .sort({ updatedAt: -1 })
      .lean();

    if (!conversation || !conversation.messages) return [];

    return conversation.messages.slice(-limit).map((m) => ({
      role: m.role,
      content: m.content,
    }));
  }

  /**
   * Get conversation topic summaries (for memory/dedup)
   */
  static async getTopicSummaries(sessionId: string): Promise<string[]> {
    const conversation = await ConversationModel.findOne({ sessionId })
      .sort({ updatedAt: -1 })
      .lean();

    if (!conversation || !conversation.messages) return [];

    // Extract key topics from assistant messages
    const topics = conversation.messages
      .filter((m) => m.role === 'assistant')
      .slice(-5)
      .map((m) => m.content.substring(0, 80));

    return topics;
  }

  /**
   * Save a message to a conversation
   */
  static async saveMessage(
    sessionId: string,
    personaType: string,
    role: 'user' | 'assistant',
    content: string,
    emotion?: string
  ): Promise<void> {
    await ConversationModel.findOneAndUpdate(
      { sessionId },
      {
        $push: {
          messages: {
            role,
            content,
            emotion,
            timestamp: new Date(),
          },
        },
        $setOnInsert: {
          personaType,
          mode: 'text',
        },
      },
      { upsert: true, new: true }
    );
  }

  /**
   * Save emotional state snapshot
   */
  static async saveEmotionalState(
    sessionId: string,
    emotion: string,
    intensity: number
  ): Promise<void> {
    await ConversationModel.findOneAndUpdate(
      { sessionId },
      {
        $push: {
          emotionalJourney: {
            emotion,
            intensity,
            timestamp: new Date(),
          },
        },
      }
    );
  }
}
