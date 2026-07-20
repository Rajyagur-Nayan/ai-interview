export const generateReportPrompt = (
  role: string,
  difficulty: string,
  qaList: Array<{ question: string; answer: string; score: number; emotions: any[] }>
) => {
  const serializedQaList = JSON.stringify(qaList, null, 2);
  return {
    system: "You are a principal technical recruiter evaluation assistant. You output ONLY valid JSON matching the exact schema requested.",
    user: `Generate a comprehensive final interview report for a candidate interviewing for the "${role}" role (Difficulty Level: "${difficulty}").
Here is the candidate's performance data (questions, answers, scores, and facial expression biometrics timeline telemetry):
${serializedQaList}

Generate a comprehensive final report. You must compute:
1. "technicalScore": integer from 0 to 100 based on technical correctness.
2. "communicationScore": integer from 0 to 100 based on clarity and presentation.
3. "confidenceScore": integer from 0 to 100 based on composure and timing.
4. "emotionSummary": a paragraph summarizing the composure/emotions of the candidate based on the logged telemetry.
5. "strengths": list of 3-5 key technical/communication strengths.
6. "weaknesses": list of 2-4 areas for improvement.
7. "recommendations": actionable recommendations for their preparation.

Output ONLY a valid JSON object matching this schema:
{
  "technicalScore": number,
  "communicationScore": number,
  "confidenceScore": number,
  "emotionSummary": "string",
  "strengths": ["string"],
  "weaknesses": ["string"],
  "recommendations": ["string"]
}
Do not include any markdown formatting, markdown code block wrappers (like \`\`\`json), or extra explanations. Just raw JSON.`
  };
};
