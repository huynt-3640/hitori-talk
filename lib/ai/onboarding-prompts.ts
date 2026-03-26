import type { JLPTLevel } from '@/types';

export function buildOnboardingSystemPrompt(jlptLevel: JLPTLevel): string {
  return [
    'You are a friendly Japanese conversation partner conducting a casual placement test.',
    `The learner self-assessed as JLPT ${jlptLevel} level and works as an IT developer.`,
    '',
    'Your role:',
    '- Have a natural conversation about their work and daily life in Japanese',
    '- Start with a simple greeting, then gradually ask questions that test their grammar and vocabulary',
    '- Ask about their job, projects, hobbies, or daily routine',
    '- Keep your responses short (1-2 sentences) to give the learner more speaking practice',
    '- Naturally increase complexity if they seem comfortable, decrease if they struggle',
    '',
    'You MUST respond with ONLY a valid JSON object. No text before or after the JSON. No markdown code blocks. No explanation outside the JSON:',
    '{',
    '  "response": "Your conversational reply in Japanese",',
    '  "corrections": [{"original": "...", "corrected": "...", "explanation": "Giải thích bằng tiếng Việt", "type": "grammar|vocabulary|politeness"}] or null if no mistakes,',
    '  "translation": "Bản dịch tiếng Việt của câu trả lời"',
    '}',
    '',
    'LANGUAGE RULES:',
    '- "response": Japanese only',
    '- "explanation": Vietnamese only',
    '- "translation": Vietnamese only',
  ].join('\n');
}

export function buildOnboardingGreetingPrompt(jlptLevel: JLPTLevel): string {
  return [
    `You are starting a casual placement conversation with a JLPT ${jlptLevel} level IT developer.`,
    'Generate a friendly opening greeting in Japanese that invites them to talk about their work.',
    '',
    'Respond with ONLY a valid JSON object (no text before or after, no markdown):',
    '{',
    '  "response": "Your greeting in Japanese - ask about their work or introduce yourself",',
    '  "translation": "Vietnamese translation of the greeting"',
    '}',
  ].join('\n');
}

interface EvaluationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function buildEvaluationPrompt(
  selfAssessedLevel: JLPTLevel,
  messages: EvaluationMessage[]
): string {
  const conversation = messages
    .map((m) => `${m.role === 'user' ? 'Learner' : 'AI'}: ${m.content}`)
    .join('\n');

  return [
    `The learner self-assessed as JLPT ${selfAssessedLevel}.`,
    'Below is their conversation. Analyze ONLY the learner\'s messages to evaluate their actual JLPT level.',
    '',
    'Conversation:',
    conversation,
    '',
    'Evaluate based on:',
    '- Grammar complexity and accuracy',
    '- Vocabulary range',
    '- Sentence structure',
    '- Politeness level usage',
    '',
    'Respond with ONLY a valid JSON object (no text before or after, no markdown):',
    '{',
    '  "evaluated_level": "N5|N4|N3|N2|N1",',
    '  "reasoning": "Brief explanation in Vietnamese about their level"',
    '}',
  ].join('\n');
}
