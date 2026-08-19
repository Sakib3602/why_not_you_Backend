export type Answers = Record<string, any>;

export interface ScoringResult {
  scoringType: string;
  [key: string]: any;
}

export type ScoringFn = (
  instrumentData: Record<string, any>,
  answers: Answers
) => ScoringResult;