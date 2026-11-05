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
  const TYPES: string[] = Array.isArray(instrumentData.riasecOrder) ? instrumentData.riasecOrder : ["R", "I", "A", "S", "E", "C"];
  const VALUES: string[] = Array.isArray(instrumentData.valueOrder) ? instrumentData.valueOrder : [];
  const items = instrumentData.items || {};
  const itemGroup = (group: string): any[] => Array.isArray(items[group]) ? items[group] : [];
  const occupations = Array.isArray(instrumentData.occupations) ? instrumentData.occupations : [];
  const matchWeights = instrumentData.matchWeights || { interest: 0.45, confidence: 0.3, values: 0.25 };
  const reportCaps = instrumentData.reportCaps || { occupationListTop: 12, trainingClustersMax: 3, internationalClustersMax: 3 };

  // ---- Step 1+2 ----
  const interest: Record<string, number> = {};
  const confidence: Record<string, number> = {};
  const values: Record<string, number> = {};

  TYPES.forEach((t) => {
    const aItems = itemGroup("A").filter((it: any) => it.type === t);
    const aTotal = aItems.reduce((s: number, it: any) => s + (answers[it.id] || 0), 0);
    interest[t] = scoreOf(aTotal, aItems.length);

    const bItems = itemGroup("B").filter((it: any) => it.type === t);
    const bTotal = bItems.reduce((s: number, it: any) => s + (answers[it.id] || 0), 0);
    confidence[t] = scoreOf(bTotal, bItems.length);
  });

  VALUES.forEach((v) => {
    const cItems = itemGroup("C").filter((it: any) => it.value === v);
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

  const HEX = instrumentData.coherence?.hexagonOrder || TYPES;
  const p1 = HEX.indexOf(hollandCode[0]);
  const p2 = HEX.indexOf(hollandCode[1]);
  let d = Math.abs(p1 - p2);
  d = Math.min(d, 6 - d);
  const coherence = instrumentData.coherence?.distanceToCoherence?.[String(d)] ?? 1;

  // ---- Step 4+5: matching ----
  const pInterest = TYPES.map((t) => interest[t]);
  const pConfidence = TYPES.map((t) => confidence[t]);
  const pValues = VALUES.map((v) => values[v]);
  const w = matchWeights;

  const rankedMatches = occupations
    .map((o: any) => {
      const fitI = fit(pInterest, o.riasec);
      const fitC = fit(pConfidence, o.riasec);
      const fitV = fit(pValues, o.value);
      const match = w.interest * fitI + w.confidence * fitC + w.values * fitV;
      return { ...o, fitI, fitC, fitV, match, band: bandOf(match, instrumentData.matchBands) };
    })
    .sort((a: any, b: any) => b.match - a.match);

  const bandedMatches = rankedMatches.filter((m: any) => m.band);
  const top12 = (bandedMatches.length >= 6 ? bandedMatches : rankedMatches)
    .slice(0, reportCaps.occupationListTop)
    .map((m: any) => m.band ? m : {
      ...m,
      band: { label_en: "Worth exploring", label_bn: "অন্বেষণযোগ্য", min: 0 },
    });
  const top6 = rankedMatches.slice(0, 6);
  const topClusters: string[] = [];
  for (const match of top6) {
    if (match.cluster && !topClusters.includes(match.cluster)) topClusters.push(match.cluster);
    if (topClusters.length >= 3) break;
  }
  const pathwayConfig = instrumentData.pathways || { default: [] };
  const subjectConfig = instrumentData.subjects || { default: [] };
  const strengthenConfig = instrumentData.strengthenNow || {
    default: {
      en: ["English", "Writing in Bangla", "Basic statistics / SPSS"],
      bn: ["ইংরেজি", "বাংলায় লেখা", "মৌলিক পরিসংখ্যান / SPSS"],
    },
  };
  const preferenceConfig = instrumentData.preferences || [
    { key: "ORD", trait_en: "Organisation and punctuality", trait_bn: "সংগঠন ও সময়নিষ্ঠা" },
    { key: "SOC", trait_en: "Comfort working in a team", trait_bn: "দলে কাজের স্বাচ্ছন্দ্য" },
    { key: "RES", trait_en: "Handling pressure", trait_bn: "চাপ সামলানো" },
    { key: "NOV", trait_en: "Openness to new things", trait_bn: "নতুন বিষয়ে আগ্রহ" },
    { key: "COP", trait_en: "Patience with repetitive work", trait_bn: "পুনরাবৃত্ত কাজে ধৈর্য" },
  ];
  const activityConfig = instrumentData.activities || {};
  const clusterEntries = (section: Record<string, any[]>, cluster: string) =>
    section[cluster] || section.default || [];
  const trainingConfig = instrumentData.training || {};
  const trainingFallback = Array.isArray(trainingConfig.default)
    ? trainingConfig.default
    : Object.values(trainingConfig).find((entries): entries is any[] => Array.isArray(entries)) || [];

  // ---- Step 6a: training — top6 এর ভেতর থেকে unique cluster (max 3) ----
  const trainingSeen = new Set<string>();
  const trainingSections: any[] = [];
  for (const m of top6) {
    if (trainingSections.length >= reportCaps.trainingClustersMax) break;
    if (trainingSeen.has(m.cluster)) continue;
    const entries = Array.isArray(trainingConfig[m.cluster])
      ? trainingConfig[m.cluster]
      : trainingFallback;
    if (!entries.length) continue;
    trainingSeen.add(m.cluster);
    trainingSections.push({ cluster: m.cluster, entries });
  }
  if (!trainingSections.length && trainingFallback.length) {
    trainingSections.push({ cluster: "default", entries: trainingFallback });
  }

  // ---- Step 6b: cross-cutting skills ----
  const skillConfig = instrumentData.crossCuttingSkills || { maxSelected: 3, rules: {} };
  const skillRules = skillConfig.rules || {};
  const e6 = answers["E6"], e7 = answers["E7"], e9 = answers["E9"];
  const skillKeys: string[] = [];
  if (e6 === 0 || e6 === 1) skillKeys.push("english");
  if (e7 === 0 || e7 === 1) skillKeys.push("digital");
  if (interest["I"] >= 60) skillKeys.push("research");
  if (interest["S"] >= 60 || interest["E"] >= 60) skillKeys.push("communication");
  if (e9 === 0) skillKeys.push("trade");
  const crossCuttingSkills = skillKeys
    .slice(0, skillConfig.maxSelected)
    .map((k) => ({
      key: k,
      name_en: ({
        english: "English language skills",
        digital: "Computer and digital skills",
        research: "Statistics and research methods",
        communication: "Communication and presenting",
        trade: "National skills certification",
      } as Record<string, string>)[k] || k,
      ...skillRules[k],
    }));

  // ---- Step 7: overseas section ----
  const intlSeen = new Set<string>();
  const overseasSections: any[] = [];
  for (const m of top6) {
    if (overseasSections.length >= reportCaps.internationalClustersMax) break;
    if (intlSeen.has(m.cluster)) continue;
    if (!instrumentData.international?.[m.cluster]) continue;
    intlSeen.add(m.cluster);
    overseasSections.push({ cluster: m.cluster, routes: instrumentData.international[m.cluster] });
  }
  const showScholarships = true;
  const weakEnglish = e6 === 0 || e6 === 1;

  // ---- Step 8/9 ----
  const trackCfg = instrumentData.track || { sourceItem: "E1", trackBIndexes: [] };
  const e1 = answers[trackCfg.sourceItem];
  const track = trackCfg.trackBIndexes.includes(e1) ? "B" : "A";

  const gapCfg = instrumentData.interestConfidenceGap || { threshold: 15, highMsg_bn: "", lowMsg_bn: "" };
  const gaps: any[] = [];
  TYPES.forEach((t) => {
    const g = confidence[t] - interest[t];
    if (g >= gapCfg.threshold) gaps.push({ type: t, gap: g, message_bn: gapCfg.highMsg_bn });
    if (g <= -gapCfg.threshold) gaps.push({ type: t, gap: g, message_bn: gapCfg.lowMsg_bn });
  });

  const preferenceAnswers = preferenceConfig.map((preference: any) => {
    const facetItems = itemGroup("D").filter((item: any) => item.facet === preference.key);
    const matches = facetItems.reduce((count: number, item: any) => {
      const answer = answers[item.id];
      const normalized = typeof answer === "string" ? answer.toLowerCase() : answer;
      const keyed = String(item.keyed).toLowerCase();
      return count + (normalized === keyed || (typeof normalized === "number" && ((normalized > 0) === (keyed === "yes"))) ? 1 : 0);
    }, 0);
    const level = matches >= 2 ? "High" : matches === 1 ? "Moderate" : "Low";
    const levelBn = matches >= 2 ? "উচ্চ" : matches === 1 ? "মাঝারি" : "কম";
    return {
      trait_en: preference.trait_en,
      trait_bn: preference.trait_bn,
      tendency_en: level,
      tendency_bn: levelBn,
    };
  });
  const activities = hollandCode.slice(0, 3).flatMap((type: string) => activityConfig[type] || []);
  const resources = {
    courses: instrumentData.onlineResources?.courses || [],
    youtube: instrumentData.onlineResources?.youtube || [],
  };
  const pathways = topClusters.flatMap((cluster) => clusterEntries(pathwayConfig, cluster));
  const subjects = topClusters.flatMap((cluster) => clusterEntries(subjectConfig, cluster));
  const strengthenNow = topClusters.length > 0
    ? (strengthenConfig[topClusters[0]] || strengthenConfig.default)
    : strengthenConfig.default;
  const fallbackPathways = pathways.length > 0 ? pathways : pathwayConfig.default;
  const fallbackSubjects = subjects.length > 0 ? subjects : subjectConfig.default;
  const fallbackTraining = trainingSections.length > 0 ? trainingSections : [{
    cluster: "default",
    entries: instrumentData.training?.default || [],
  }];
  return {
    scoringType: "vector_matching",
    typeLabels_bn: instrumentData.typeLabels_bn,
    typeLabels_en: instrumentData.typeLabels_en,
    valueLabels_bn: instrumentData.valueLabels_bn,
    valueLabels_en: instrumentData.valueLabels_en,
    interest, confidence, values,
    hollandCode, clarity, clarityVerdict, coherence,
    matches: top12,
    training: fallbackTraining,
    crossCuttingSkills,
    overseas: {
      sections: overseasSections,
      showScholarships,
      weakEnglish,
      scholarships: instrumentData.scholarships || [],
      fraudWarning_bn: instrumentData.fraudWarning_bn,
      fraudWarning_en: instrumentData.fraudWarning_en,
    },
    pathways: fallbackPathways,
    subjects: fallbackSubjects,
    preferences: preferenceAnswers,
    activities,
    resources,
    strengthenNow,
    occupationCount: occupations.length,
    partAConfigured: itemGroup("A").length,
    partATotal: 48,
    gaps, track,
  };
}