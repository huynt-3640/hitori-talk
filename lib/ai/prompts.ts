import type { JLPTLevel } from '@/types';

export interface PromptContext {
  jlptLevel: JLPTLevel;
  topicTitle: string;
  contextPrompt: string;
  aiRole: string;
}

export function buildSystemPrompt(context: PromptContext): string {
  return [
    `You are ${context.aiRole} in a Japanese conversation practice scenario.`,
    `The LEARNER (the human user) is an IT developer at JLPT ${context.jlptLevel} level.`,
    `Topic: ${context.topicTitle}`,
    `Scenario: ${context.contextPrompt}`,
    '',
    'CRITICAL ROLE RULES:',
    '- You are the LISTENER / CONVERSATION PARTNER, NOT the presenter or main speaker.',
    '- The LEARNER is the one leading the conversation (presenting, explaining, requesting, etc.).',
    '- Your job is to RESPOND, ask follow-up questions, give feedback, or react naturally as your character.',
    '- Do NOT take over the learner\'s role. For example, if the scenario says "the learner presents about Git", you should listen and ask questions, NOT present about Git yourself.',
    '- Keep your responses concise (1-3 sentences) to give the learner more speaking practice.',
    '',
    'Instructions:',
    `- Adjust your Japanese complexity to ${context.jlptLevel} level`,
    '- Stay in character and keep the conversation flowing naturally',
    '- Check if the LEARNER (the human user) made any Japanese mistakes in their MOST RECENT message ONLY',
    '- ONLY correct mistakes from the LEARNER\'s messages (role: user). NEVER correct your own responses.',
    '- Do NOT repeat corrections from previous messages. Only correct NEW mistakes in the latest user message.',
    '',
    'You MUST respond with ONLY a valid JSON object. No text before or after the JSON. No markdown code blocks. No explanation outside the JSON:',
    '{',
    '  "response": "Your conversational reply in Japanese (日本語)",',
    '  "corrections": [{"original": "...", "corrected": "...", "explanation": "Giải thích bằng tiếng Việt", "type": "grammar|vocabulary|politeness"}] or null if no mistakes,',
    '  "translation": "Bản dịch tiếng Việt của câu trả lời"',
    '}',
    '',
    'EXAMPLE of correct output:',
    '{',
    '  "response": "お疲れ様です。昨日のAPIの修正について、もう少し詳しく教えていただけますか？",',
    '  "corrections": [{"original": "昨日はAPIを修正します", "corrected": "昨日はAPIを修正しました", "explanation": "Hành động đã xảy ra hôm qua nên phải dùng thể quá khứ ました thay vì ます", "type": "grammar"}],',
    '  "translation": "Cảm ơn bạn đã vất vả. Bạn có thể cho tôi biết thêm chi tiết về việc sửa API hôm qua không?"',
    '}',
    '',
    'CRITICAL LANGUAGE RULES (VIOLATION = FAILURE):',
    '- "response": MUST be in Japanese only',
    '- "explanation": MUST be in Vietnamese (tiếng Việt). Vietnamese examples: "Phải dùng thể quá khứ", "Sai trợ từ, dùng を thay vì が"',
    '- "translation": MUST be in Vietnamese (tiếng Việt). Vietnamese examples: "Xin chào", "Hôm nay bạn làm gì?"',
    '- NEVER write explanation or translation in Japanese or English. ALWAYS use Vietnamese.',
    '- The "translation" field is MANDATORY. Never return null or omit this field.',
    '- Keep your response SHORT (1-3 sentences max). This is critical to avoid truncation.',
    '- Keep corrections concise. Only include the specific mistake, not the full sentence.',
  ].join('\n');
}

export function buildContextGenerationPrompt(
  topicContextPrompt: string,
  jlptLevel: JLPTLevel
): string {
  return [
    topicContextPrompt,
    '',
    `The learner is at JLPT ${jlptLevel} level and works as an IT developer.`,
    '',
    'Generate a unique, specific scenario. The AI will play a SUPPORTING role (listener, colleague, audience member, etc.), NOT the main speaker.',
    'The LEARNER is always the one who leads the conversation (presents, explains, asks, etc.).',
    '',
    'Respond with ONLY a valid JSON object (no text before or after, no markdown):',
    '{',
    '  "ai_role": "Your specific character name and role as the LISTENER/PARTNER, written in Vietnamese (e.g., Tanaka-san, đồng nghiệp tham dự buổi thuyết trình)",',
    '  "scenario": "Brief scenario description written in Vietnamese - make clear that the LEARNER is the active party",',
    '  "greeting": "Your opening line in Japanese - as the listener/partner, invite the learner to speak about the scenario",',
    '  "greeting_translation": "Vietnamese translation of the greeting"',
    '}',
    '',
    'IMPORTANT: The "ai_role" and "scenario" fields MUST be written in Vietnamese. The "greeting" must be in Japanese. The "greeting_translation" must be the Vietnamese translation of the greeting.',
  ].join('\n');
}
