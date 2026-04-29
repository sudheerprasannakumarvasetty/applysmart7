/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum Decision {
  APPLY = "APPLY",
  MAYBE = "MAYBE",
  SKIP = "SKIP",
}

export interface JDAnalysis {
  match_score: number;
  matched_skills: string[];
  missing_skills: string[];
  decision: Decision;
  responsibilities: string[];
  tools: string[];
}

export interface OptimizationResult {
  optimized_resume: string;
  changes_made: string[];
}

export interface DefendabilityCheck {
  warnings: string[];
  risky_claims: {
    claim: string;
    reason: string;
  }[];
}

export interface AppState {
  jd: string;
  resume: string;
  analysis: JDAnalysis | null;
  optimizedResume: string | null;
  defendability: DefendabilityCheck | null;
  isAnalyzing: boolean;
  error: string | null;
}
