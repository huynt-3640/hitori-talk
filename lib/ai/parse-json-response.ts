/**
 * Robustly extract and parse JSON from AI response text.
 *
 * Handles common issues:
 * - Response wrapped in ```json ... ``` code blocks
 * - Text before/after the JSON object
 * - Multiple JSON objects (takes the first one with "response" key)
 */
export function parseJsonResponse(raw: string): Record<string, unknown> {
  const trimmed = raw.trim();

  // 1. Try direct parse
  try {
    return JSON.parse(trimmed);
  } catch {
    // continue
  }

  // 2. Strip markdown code blocks and try again
  const stripped = trimmed
    .replace(/^```(?:json)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim();
  try {
    return JSON.parse(stripped);
  } catch {
    // continue
  }

  // 3. Find the first JSON object { ... } in the text using brace matching
  const startIdx = stripped.indexOf('{');
  if (startIdx !== -1) {
    let depth = 0;
    let inString = false;
    let escape = false;

    for (let i = startIdx; i < stripped.length; i++) {
      const ch = stripped[i];

      if (escape) {
        escape = false;
        continue;
      }

      if (ch === '\\' && inString) {
        escape = true;
        continue;
      }

      if (ch === '"') {
        inString = !inString;
        continue;
      }

      if (inString) continue;

      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) {
          const jsonCandidate = stripped.slice(startIdx, i + 1);
          try {
            const parsed = JSON.parse(jsonCandidate);
            if (typeof parsed === 'object' && parsed !== null) {
              return parsed as Record<string, unknown>;
            }
          } catch {
            // continue looking
          }
        }
      }
    }
  }

  throw new Error('No valid JSON found in AI response');
}
