import { scoreSumAndBand } from "./Sumandband";
import { Answers, ScoringResult } from "./Type";
import { scoreVectorMatching } from "./Vectormatching";


export function computeScore(
  scoringType: string,
  instrumentData: Record<string, any>,
  answers: Answers
): ScoringResult {
  switch (scoringType) {
    case "vector_matching":
      return scoreVectorMatching(instrumentData, answers);
    case "sum_and_band":
      return scoreSumAndBand(instrumentData, answers);
    default:
      throw new Error(`Unknown scoringType: ${scoringType}`);
  }
}