import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import { aiInterviewService } from "../services/aiInterview.service";

export function useInterview(interviewId?: string) {
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch active interview details
  const { data: interviewData, isLoading: fetchLoading, error: fetchError, refetch } = useQuery({
    queryKey: ["interview-session", interviewId],
    queryFn: async () => {
      if (!interviewId) return null;
      const res = await api.get(`/interviews/report/${interviewId}`);
      return res.data.data;
    },
    enabled: !!interviewId,
  });

  const generateFollowUp = async (questionText: string, transcript: string) => {
    if (!interviewId) throw new Error("Interview ID is required to generate follow-up");
    setIsGenerating(true);
    setError(null);
    try {
      const result = await aiInterviewService.generateFollowUp(questionText, transcript, interviewId);
      // Invalidate query to pull the newly inserted question
      await queryClient.invalidateQueries({ queryKey: ["interview-session", interviewId] });
      return result;
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      const msg = error.response?.data?.message || error.message || "Failed to generate follow-up question";
      setError(msg);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  const generateQuestion = async (role: string, experienceLevel: string, difficulty: string, count = 1) => {
    setIsGenerating(true);
    setError(null);
    try {
      return await aiInterviewService.generateQuestion(role, experienceLevel, difficulty, count);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      const msg = error.response?.data?.message || error.message || "Failed to generate question";
      setError(msg);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    interviewData,
    fetchLoading,
    fetchError,
    refetch,
    generateFollowUp,
    generateQuestion,
    isGenerating,
    error,
  };
}

export default useInterview;
