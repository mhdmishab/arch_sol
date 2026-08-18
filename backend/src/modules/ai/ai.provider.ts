import { AnalyzeRequirementsResult } from '../projects/project.model.js';

export interface AIProvider {
  analyzeRequirements(
    rawText: string,
    context?: {
      industry?: string;
      cloudPreference?: string;
      expectedUsers?: number;
      region?: string;
    }
  ): Promise<AnalyzeRequirementsResult>;
}
