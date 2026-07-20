export const evaluateAnswerPrompt = (question: string, answer: string) => {
  return {
    system: "You are an objective technical evaluation assistant. You output ONLY valid JSON matching the exact schema requested.",
    user: `Evaluate the candidate's response to the technical question.
Question: "${question}"
Candidate Answer: "${answer}"
Score the response from 0 to 100, identify key strengths, weaknesses, and provide constructive critique.
Output ONLY a valid JSON object matching this schema:
{
  "score": number,
  "strengths": ["string"],
  "weaknesses": ["string"],
  "constructiveFeedback": "string"
}
Do not include any markdown formatting, markdown code block wrappers (like \`\`\`json), or extra explanations. Just raw JSON.`
  };
};
