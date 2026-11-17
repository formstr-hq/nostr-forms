function extractFirstJsonObject(text: string): string {
  const startIndex = text.indexOf('{');
  if (startIndex === -1) {
    throw new Error('No JSON object found in AI response');
  }

  let depth = 0;
  for (let index = startIndex; index < text.length; index += 1) {
    const char = text[index];
    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return text.slice(startIndex, index + 1);
      }
    }
  }

  throw new Error('Could not find a balanced JSON object in AI response');
}

export function extractJsonFromText(text: string): any {
  let jsonText = text.trim();

  // Strip markdown code fences if present
  const codeBlockMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch) {
    jsonText = codeBlockMatch[1].trim();
  }

  try {
    return JSON.parse(jsonText);
  } catch (firstError) {
    const jsonBody = extractFirstJsonObject(jsonText);
    return JSON.parse(jsonBody);
  }
}
