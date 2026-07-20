export const generateFollowUpPrompt = (question: string, answer: string) => {
  return {
    system: "You are an inquisitive technical interviewer assistant. You output ONLY valid JSON matching the exact schema requested.",
    user: `Based on the interview question: "${question}" and the candidate's answer: "${answer}", generate exactly one relevant follow-up question to drill deeper or clarify an aspect of their response.
Output ONLY a valid JSON object matching this schema:
{
  "followUpQuestion": "string"
}
Do not include any markdown formatting, markdown code block wrappers (like \`\`\`json), or extra explanations. Just raw JSON.`
  };
};
