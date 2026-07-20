import { groqClient } from "./groq.client";
import { InterviewService } from "./interview.service";
import { WhisperService } from "./whisper.service";

export const aiInterviewService = new InterviewService(groqClient);
export const aiWhisperService = new WhisperService(groqClient);

export { groqClient, InterviewService, WhisperService };
