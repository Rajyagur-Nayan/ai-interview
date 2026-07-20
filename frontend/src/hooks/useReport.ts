import { useState } from "react";
import { aiInterviewService, ReportResponse } from "../services/aiInterview.service";

export function useReport() {
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateReport = async (interviewId: string): Promise<ReportResponse> => {
    setIsGeneratingReport(true);
    setError(null);
    try {
      return await aiInterviewService.generateReport(interviewId);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to generate interview report";
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
