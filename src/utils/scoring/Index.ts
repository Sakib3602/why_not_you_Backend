
import { scoreDomainPompComposite } from "./domainPompComposite";
import { scoreDomainMeanAverage } from "./domainMeanAverage";
import { Answers, ScoringResult } from "./Type";
import { scoreVectorMatching } from "./Vectormatching";
import { scoreSumAndBand } from "./Sumandband";
import { scoreMcrrsTriage } from "./Mcrrstriage";


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
    case "mcrrs_triage":
      return scoreMcrrsTriage(instrumentData, answers);
    default:
      throw new Error(`Unknown scoringType: ${scoringType}`);
  }
}