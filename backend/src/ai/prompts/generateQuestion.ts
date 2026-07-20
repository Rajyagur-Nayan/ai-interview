export const generateQuestionPrompt = (role: string, experienceLevel: string, difficulty: string, count = 1) => {
  return {
    system: "You are a professional technical interviewer assistant. You output ONLY valid JSON matching the exact schema requested.",
    user: `Generate exactly ${count} highly relevant interview questions for a candidate interviewing for the role of "${role}" (Experience Tier: "${experienceLevel}", Difficulty Level: "${difficulty}").
Output ONLY a valid JSON object matching this schema:
{
  "questions": ["string"]
}
Do not include any markdown formatting, markdown code block wrappers (like \`\`\`json), or extra explanations. Just raw JSON.`
  };
};
