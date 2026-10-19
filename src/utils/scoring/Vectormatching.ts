import { Answers, ScoringResult } from "./Type";


function scoreOf(total: number, k: number): number {
  if (k === 0) return 0;
  return (100 * (total - k)) / (4 * k);
}

function fit(p: number[], o: number[]): number {
  const meanP = p.reduce((a, b) => a + b, 0) / p.length;
  const meanO = o.reduce((a, b) => a + b, 0) / o.length;
  const pc = p.map((v) => v - meanP);
  const oc = o.map((v) => v - meanO);

  let dot = 0, np = 0, no = 0;
  for (let i = 0; i < pc.length; i++) {
    dot += pc[i] * oc[i];
    np += pc[i] * pc[i];
    no += oc[i] * oc[i];
  }
  np = Math.sqrt(np);
  no = Math.sqrt(no);
  if (np === 0 || no === 0) return 50;
  return 50 * (1 + dot / (np * no));
}

function bandOf(score: number, bands: any[]) {
  for (const b of bands) {
    if (b.show === false) continue;
    if (score >= b.min) return b;
  }
  return null;
}

export function scoreVectorMatching(
  instrumentData: Record<string, any>,
  answers: Answers
): ScoringResult {
  const TYPES: string[] = instrumentData.riasecOrder;
  const VALUES: string[] = instrumentData.valueOrder;
  const items = instrumentData.items;

  // ---- Step 1+2 ----
  const interest: Record<string, number> = {};
  const confidence: Record<string, number> = {};
  const values: Record<string, number> = {};

  TYPES.forEach((t) => {
    const aItems = items.A.filter((it: any) => it.type === t);
    const aTotal = aItems.reduce((s: number, it: any) => s + (answers[it.id] || 0), 0);
    interest[t] = scoreOf(aTotal, aItems.length);

    const bItems = items.B.filter((it: any) => it.type === t);
    const bTotal = bItems.reduce((s: number, it: any) => s + (answers[it.id] || 0), 0);
    confidence[t] = scoreOf(bTotal, bItems.length);
  });

  VALUES.forEach((v) => {
    const cItems = items.C.filter((it: any) => it.value === v);
    const cTotal = cItems.reduce((s: number, it: any) => s + (answers[it.id] || 0), 0);
    values[v] = scoreOf(cTotal, cItems.length);
  });

  // ---- Step 3: Holland code, clarity, coherence ----
  const sortedTypes = [...TYPES].sort(
    (a, b) => interest[b] - interest[a] || confidence[b] - confidence[a]
  );
  const hollandCode = sortedTypes.slice(0, 3);

  const interestVals = TYPES.map((t) => interest[t]);
  const clarity = Math.max(...interestVals) - Math.min(...interestVals);
  const clarityVerdict = clarity < 20 ? "FLAT" : clarity <= 35 ? "LOW" : "ADEQUATE";

  const HEX = instrumentData.coherence.hexagonOrder;
  const p1 = HEX.indexOf(hollandCode[0]);
  const p2 = HEX.indexOf(hollandCode[1]);
  let d = Math.abs(p1 - p2);
  d = Math.min(d, 6 - d);
  const coherence = instrumentData.coherence.distanceToCoherence[String(d)] ?? 1;

  // ---- Step 4+5: matching ----
  const pInterest = TYPES.map((t) => interest[t]);
  const pConfidence = TYPES.map((t) => confidence[t]);
  const pValues = VALUES.map((v) => values[v]);
  const w = instrumentData.matchWeights;

  const allMatches = instrumentData.occupations
    .map((o: any) => {
      const fitI = fit(pInterest, o.riasec);
      const fitC = fit(pConfidence, o.riasec);
      const fitV = fit(pValues, o.value);
      const match = w.interest * fitI + w.confidence * fitC + w.values * fitV;
      return { ...o, fitI, fitC, fitV, match, band: bandOf(match, instrumentData.matchBands) };
    })
    .filter((m: any) => m.band)
    .sort((a: any, b: any) => b.match - a.match);

  const top12 = allMatches.slice(0, instrumentData.reportCaps.occupationListTop);
  const top6 = allMatches.slice(0, 6);

  // ---- Step 6a: training — top6 এর ভেতর থেকে unique cluster (max 3) ----
  const trainingSeen = new Set<string>();
  const trainingSections: any[] = [];
  for (const m of top6) {
    if (trainingSections.length >= instrumentData.reportCaps.trainingClustersMax) break;
    if (trainingSeen.has(m.cluster)) continue;
    if (!instrumentData.training[m.cluster]) continue;
    trainingSeen.add(m.cluster);
    trainingSections.push({ cluster: m.cluster, entries: instrumentData.training[m.cluster] });
  }

  // ---- Step 6b: cross-cutting skills ----
  const skillRules = instrumentData.crossCuttingSkills.rules;
  const e6 = answers["E6"], e7 = answers["E7"], e9 = answers["E9"];
  const skillKeys: string[] = [];
  if (e6 === 0 || e6 === 1) skillKeys.push("english");
  if (e7 === 0 || e7 === 1) skillKeys.push("digital");
  if (interest["I"] >= 60) skillKeys.push("research");
  if (interest["S"] >= 60 || interest["E"] >= 60) skillKeys.push("communication");
  if (e9 === 0) skillKeys.push("trade");
  const crossCuttingSkills = skillKeys
    .slice(0, instrumentData.crossCuttingSkills.maxSelected)
    .map((k) => ({ key: k, ...skillRules[k] }));

  // ---- Step 7: overseas section ----
  const e5 = answers["E5"], e11 = answers["E11"];
  const wantsAbroad = e5 === 3 || e11 === 4;
  const intlSeen = new Set<string>();
  const overseasSections: any[] = [];
  for (const m of top6) {
    if (overseasSections.length >= instrumentData.reportCaps.internationalClustersMax) break;
    if (intlSeen.has(m.cluster)) continue;
    if (!instrumentData.international[m.cluster]) continue;
    intlSeen.add(m.cluster);
    overseasSections.push({ cluster: m.cluster, routes: instrumentData.international[m.cluster] });
  }
  const showOverseas = overseasSections.length > 0 && (wantsAbroad || overseasSections.length >= 2);
  const showScholarships = interest["I"] >= 60 || confidence["I"] >= 60;
  const weakEnglish = e6 === 0 || e6 === 1;

  // ---- Step 8/9 ----
  const trackCfg = instrumentData.track;
  const e1 = answers[trackCfg.sourceItem];
  const track = trackCfg.trackBIndexes.includes(e1) ? "B" : "A";

  const gapCfg = instrumentData.interestConfidenceGap;
  const gaps: any[] = [];
  TYPES.forEach((t) => {
    const g = confidence[t] - interest[t];
    if (g >= gapCfg.threshold) gaps.push({ type: t, gap: g, message_bn: gapCfg.highMsg_bn });
    if (g <= -gapCfg.threshold) gaps.push({ type: t, gap: g, message_bn: gapCfg.lowMsg_bn });
  });

  return {
    scoringType: "vector_matching",
    typeLabels_bn: instrumentData.typeLabels_bn,
    typeLabels_en: instrumentData.typeLabels_en,
    valueLabels_bn: instrumentData.valueLabels_bn,
    valueLabels_en: instrumentData.valueLabels_en,
    interest, confidence, values,
    hollandCode, clarity, clarityVerdict, coherence,
    matches: top12,
    training: clarityVerdict === "FLAT" ? [] : trainingSections,
    crossCuttingSkills: clarityVerdict === "FLAT" ? [] : crossCuttingSkills,
    overseas: showOverseas && clarityVerdict !== "FLAT"
      ? { sections: overseasSections, showScholarships, weakEnglish,
          scholarships: showScholarships ? instrumentData.scholarships : [],
          fraudWarning_bn: instrumentData.fraudWarning_bn,
          fraudWarning_en: instrumentData.fraudWarning_en }
      : null,
    gaps, track,
  };
}