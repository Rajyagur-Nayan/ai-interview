export const evaluateCommunicationPrompt = (question: string, answer: string) => {
  return {
    system: "You are a communication and presentation skills assessor. You output ONLY valid JSON matching the exact schema requested.",
    user: `Assess the communication quality of the candidate's answer: "${answer}" to the question: "${question}".
Evaluate their clarity, structure, confidence, and filler-word usage. Rate their communication score from 0 to 100.
Output ONLY a valid JSON object matching this schema:
{
  "communicationScore": number,
  "clarity": "string",
  "structure": "string",
  "fillerWordsTally": number,
  "feedback": "string"
}
Do not include any markdown formatting, markdown code block wrappers (like \`\`\`json), or extra explanations. Just raw JSON.`
  };
};
