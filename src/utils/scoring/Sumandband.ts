import { Answers, ScoringResult } from "./Type";

function bandFor(score: number, bands: any[]) {
  return bands.find((b) => score >= b.scoreMin && score <= b.scoreMax) ?? bands[0];
}

export function scoreSumAndBand(
  instrumentData: Record<string, any>,
  answers: Answers
): ScoringResult {
  const items: any[] = instrumentData.items;
  const constructs = Object.keys(instrumentData.constructs);
  const minRatio = instrumentData.missingDataRule.minAnsweredRatioPerSubscale;

  const constructResults: Record<string, any> = {};

  constructs.forEach((c) => {
    const cItems = items.filter((it) => it.construct === c);
    let answeredCount = 0;
    let sum = 0;

    cItems.forEach((it) => {
      const raw = answers[it.id];
      if (raw === undefined || raw === null) return;
      answeredCount++;
      const value = it.reverse ? 3 - raw : raw;
      sum += value;
    });

    const enoughAnswered = answeredCount / cItems.length >= minRatio;
    const band = enoughAnswered ? bandFor(sum, instrumentData.bands) : null;
    // এখানেই ব্যাখ্যা+করণীয় টেক্সট bandrank দিয়ে embed করে দেওয়া হচ্ছে,
    // যাতে ফ্রন্টএন্ডকে আলাদা করে instrumentData আনতে না হয়
    const interpretation = band ? instrumentData.interpretations[c][String(band.rank)] : null;

    constructResults[c] = {
      name_bn: instrumentData.constructs[c].name_bn,
      score: enoughAnswered ? sum : null,
      maxScore: instrumentData.constructs[c].scoreRange[1],
      band,
      interpretation, // { bn, actions_bn, crisisNote? }
    };
  });

  const overallIndex = constructs.reduce((s, c) => s + (constructResults[c].score ?? 0), 0);

  const validRanks = constructs
    .map((c) => constructResults[c].band?.rank)
    .filter((r) => r !== undefined && r !== null);
  const maxRank = validRanks.length ? Math.max(...validRanks) : 0;
  const overallState = instrumentData.overallStates.find((s: any) => s.rank === maxRank);

  const validConstructs = constructs.filter((c) => constructResults[c].score !== null);
  const maxScore = Math.max(...validConstructs.map((c) => constructResults[c].score as number));
  const dominant = validConstructs
    .filter((c) => constructResults[c].score === maxScore)
    .map((c) => constructResults[c].name_bn);

  const alarming = maxRank >= 3;
  const referral = alarming ? instrumentData.referral.message_bn : null;
  const crisisNote =
    (constructResults["D"]?.band?.rank ?? -1) >= 3 ? instrumentData.crisisNote.message_bn : null;

  return {
    scoringType: "sum_and_band",
    constructResults,
    overallIndex,
    overallState,
    dominant,
    alarming,
    referral,
    crisisNote,
    helplines: alarming || crisisNote ? instrumentData.helplines : [],
  };
}