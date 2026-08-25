

/**

 */

import { Answers, ScoringResult } from "./Type";

function bandFor(score: number, bands: any[]) {
  for (const b of bands) {
    const aboveMin = b.min === undefined || score >= b.min;
    const belowMax = b.max === undefined || score < b.max;
    if (aboveMin && belowMax) return b;
  }
  return bands[bands.length - 1];
}

export function scoreDomainMeanAverage(
  instrumentData: Record<string, any>,
  answers: Answers
): ScoringResult {
  const items: any[] = instrumentData.items;
  const domainKeys = Object.keys(instrumentData.domains); // ["PR","MR","SR"]

  // completeness rule: ২৪টাই লাগবে
  const allAnswered = items.every((it) => answers[it.id] !== undefined && answers[it.id] !== null);
  if (!allAnswered) {
    return {
      scoringType: "domain_mean_average",
      incomplete: true,
      message_bn: "সব ২৪টা প্রশ্নের উত্তর ছাড়া স্কোর করা সম্ভব না।",
    };
  }

  // ---- Step 1: reverse-code ----
  const recoded: Record<string, number> = {};
  items.forEach((it) => {
    const raw = answers[it.id];
    recoded[it.id] = it.reverse ? 6 - raw : raw;
  });

  // ---- Step 2: mean per domain ----
  const domainResults: Record<string, any> = {};
  domainKeys.forEach((d) => {
    const dItems = items.filter((it) => it.domain === d);
    const sum = dItems.reduce((s, it) => s + recoded[it.id], 0);
    const score = sum / dItems.length; // unrounded — এটাই band lookup-এ ব্যবহার হবে
    const band = bandFor(score, instrumentData.bands[d]);
    domainResults[d] = {
      name_bn: instrumentData.domains[d].name_bn,
      measures_bn: instrumentData.domains[d].measures_bn,
      score,
      scoreDisplay: Math.round(score * 100) / 100, // শুধু দেখানোর জন্য round
      band,
    };
  });

  // ---- total = mean of all 24 (== mean of 3 domain means, since প্রতিটাতে ঠিক ৮টা করে) ----
  const totalSum = items.reduce((s, it) => s + recoded[it.id], 0);
  const totalScore = totalSum / items.length;
  const totalBand = bandFor(totalScore, instrumentData.bands.TOTAL);

  // ---- gap analysis ----
  const domainScores = domainKeys.map((d) => domainResults[d].score);
  const gap = Math.max(...domainScores) - Math.min(...domainScores);
  const gapReading = instrumentData.gapAnalysis.bands.find(
    (b: any) => (b.min === undefined || gap >= b.min) && (b.max === undefined || gap < b.max)
  );
  const highestDomain = domainKeys.reduce((a, b) =>
    domainResults[a].score > domainResults[b].score ? a : b
  );
  const lowestDomain = domainKeys.reduce((a, b) =>
    domainResults[a].score < domainResults[b].score ? a : b
  );

  return {
    scoringType: "domain_mean_average",
    incomplete: false,
    domainResults,
    total: { score: totalScore, scoreDisplay: Math.round(totalScore * 100) / 100, band: totalBand },
    gap: { value: gap, display: Math.round(gap * 100) / 100, reading_bn: gapReading?.reading_bn },
    highestDomain,
    lowestDomain,
  };
}