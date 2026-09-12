import { Router, Request, Response } from 'express';
import { getAllPersonas, getPersona } from '../services/persona/personas.config';

const personaRouter = Router();

/**
 * GET /api/persona/all
 * Get all available personas
 */
personaRouter.get('/all', (_req: Request, res: Response) => {
  const personas = getAllPersonas().map((p) => ({
    id: p.id,
    name: p.name,
    label: p.label,
    emoji: p.emoji,
    description: p.description,
    tone: p.tone,
    samplePhrases: p.samplePhrases,
  }));

  res.json({ success: true, personas });
});

/**
 * GET /api/persona/:id
 * Get a specific persona's info
 */
personaRouter.get('/:id', (req: Request, res: Response) => {
  const persona = getPersona(req.params.id as string);
  res.json({
    success: true,
    persona: {
      id: persona.id,
      name: persona.name,
      label: persona.label,
      emoji: persona.emoji,
      description: persona.description,
      tone: persona.tone,
      samplePhrases: persona.samplePhrases,
    },
  });
});

export default personaRouter;
