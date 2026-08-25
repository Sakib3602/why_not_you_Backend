import { Answers, ScoringResult } from "./types";
import { scoreVectorMatching } from "./vectorMatching";
import { scoreSumAndBand } from "./sumAndBand";
import { scoreDomainPompComposite } from "./domainPompComposite";
import { scoreDomainMeanAverage } from "./domainMeanAverage";

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
    case "domain_pomp_composite":
      return scoreDomainPompComposite(instrumentData, answers);
    case "domain_mean_average":
      return scoreDomainMeanAverage(instrumentData, answers);
    default:
      throw new Error(`Unknown scoringType: ${scoringType}`);
  }
}