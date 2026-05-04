export function extractJsonFromText(text: string): any {
  let jsonText = text.trim();

  // Remove markdown code fences if present
  const codeBlockMatch = jsonText.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  if (codeBlockMatch) {
    jsonText = codeBlockMatch[1].trim();
  }

  return JSON.parse(jsonText);
}
