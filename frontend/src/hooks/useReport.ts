import { useState } from "react";
import { aiInterviewService } from "../services/aiInterview.service";
import type { ReportResponse } from "../services/aiInterview.service";

export function useReport() {
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateReport = async (interviewId: string): Promise<ReportResponse> => {
    setIsGeneratingReport(true);
    setError(null);
    try {
      return await aiInterviewService.generateReport(interviewId);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      const msg = error.response?.data?.message || error.message || "Failed to generate interview report";
      setError(msg);
      throw err;
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return {
    generateReport,
    isGeneratingReport,
    error,
  };
}

export default useReport;
