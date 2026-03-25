import type { JLPTLevel } from '@/types';

interface PromptContext {
  jlptLevel: JLPTLevel;
  topicTitle: string;
  contextPrompt: string;
  aiRole: string;
  conversationHistory?: { role: string; content: string }[];
}

export function buildSystemPrompt(context: PromptContext): string {
  return [
    `You are ${context.aiRole} in a Japanese conversation practice scenario.`,
    `The learner is an IT professional at JLPT ${context.jlptLevel} level.`,
    `Topic: ${context.topicTitle}`,
    `Scenario: ${context.contextPrompt}`,
    '',
    'Instructions:',
    `- Adjust your Japanese complexity to ${context.jlptLevel} level`,
    '- Naturally correct mistakes inline',
    '- Provide translations when the learner seems confused',
    '- Stay in character and keep the conversation flowing',
  ].join('\n');
}

export function buildCorrectionPrompt(
  userMessage: string,
  jlptLevel: JLPTLevel
): string {
  return [
    'Analyze the following Japanese message for errors.',
    `The learner is at JLPT ${jlptLevel} level.`,
    '',
    `Message: "${userMessage}"`,
    '',
    'Return a JSON object with:',
    '- corrections: array of { original, corrected, explanation, type }',
    '- overall_feedback: brief encouragement in Japanese',
  ].join('\n');
}
