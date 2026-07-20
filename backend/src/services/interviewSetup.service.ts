import { InterviewSetupRepository } from "../repositories/interviewSetup.repository";
import { NotFoundError } from "../utils/errors";

export class InterviewSetupService {
  private setupRepo = new InterviewSetupRepository();

  async createSetup(userId: string, data: { jobRole: string; experienceLevel: string; difficulty: string; numberOfQuestions: number }) {
    return await this.setupRepo.create(userId, data);
  }

  async getSetup(id: string) {
    const setup = await this.setupRepo.findById(id);
    if (!setup) {
      throw new NotFoundError("Interview setup configuration not found");
    }
    return setup;
  }

  async getUserSetups(userId: string) {
    return await this.setupRepo.findByUserId(userId);
  }

  async deleteSetup(id: string) {
    const setup = await this.setupRepo.delete(id);
    if (!setup) {
      throw new NotFoundError("Interview setup configuration not found");
    }
    return setup;
  }
}
