import { IAmBattery } from "../../models/Ambattery.model ";



type AnyObj = Record<string, any>;
type Answers = Record<string, string | number>;

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Percentage of Maximum Possible: 1-5 likert কে 0-100 এ আনার জন্য */
function pomp(mean: number, min = 1, max = 5) {
  return ((mean - min) / (max - min)) * 100;
}

function itemsOf(config: AnyObj, instrumentKey: string, form: string) {
  return (config.items || []).filter(
    (it: AnyObj) => it.instrumentKey === instrumentKey && it.form === form
  );
}

function groupByFacet(items: AnyObj[]) {
  const map: Record<string, AnyObj[]> = {};
  for (const it of items) {
    if (!map[it.facet]) map[it.facet] = [];
    map[it.facet].push(it);
  }
  return map;
}

/** Standard reverse-then-average Likert logic -> POMP (0-100) স্কেলড facet score */
function scoreLikertFacet(items: AnyObj[], answers: Answers): number | null {
  const recoded: number[] = [];
  for (const it of items) {
    const raw = answers[it.id];
    if (raw === undefined || raw === null || raw === "") continue;
    const v = Number(raw);
    recoded.push(it.reverse ? 6 - v : v);
  }
  if (recoded.length === 0) return null;
  const mean = recoded.reduce((a, b) => a + b, 0) / recoded.length;
  return round1(pomp(mean, 1, 5));
}

/** MCQ / SJT facet score: sum(correct)/n_items_in_facet * 100 (ম্যানুয়েল অনুযায়ী n = মোট আইটেম, শুধু উত্তর দেওয়াগুলো না) */
function scoreMcqFacet(items: AnyObj[], answers: Answers): number | null {
  let correct = 0;
  let anyAnswered = false;
  for (const it of items) {
    const sel = answers[it.id];
    if (sel === undefined || sel === null || sel === "") continue;
    anyAnswered = true;
    if (String(sel) === String(it.correctOptionId)) correct++;
  }
  if (!anyAnswered) return null;
  return round1((correct / items.length) * 100);
}

/** validity item(গুলো) চেক করে "failed" | "passed" রিটার্ন করে */
function checkValidity(validityItems: AnyObj[], answers: Answers): "failed" | "passed" | "not_assessed" {
  let assessedAny = false;
  for (const it of validityItems) {
    const raw = answers[it.id];
    if (raw === undefined || raw === null || raw === "" || !it.validityRule) continue;
    assessedAny = true;
    const v = Number(raw);
    const { type, value } = it.validityRule as AnyObj;
    let failed = false;
    if (type === "fails_if_gte") failed = v >= value;
    else if (type === "fails_if_lte") failed = v <= value;
    else if (type === "fails_if_eq") failed = v === value;
    else if (type === "fails_if_neq") failed = v !== value;
    if (failed) return "failed";
  }
  return assessedAny ? "passed" : "not_assessed";
}

function bandForScore(bands: AnyObj[], score: number) {
  const sorted = [...(bands || [])].sort((a, b) => a.min - b.min);
  for (const b of sorted) {
    if (score >= b.min && score <= b.max) return b;
  }
  return sorted[sorted.length - 1] || null;
}

export function computeAmBatteryScore(
  config: IAmBattery["config"],
  answers: Answers,
  form: string
) {
  const facetScores: Record<string, number> = {}; // key: "instrumentKey.facetKey"
  const validityResults: Record<string, "failed" | "passed" | "not_assessed"> = {};

  for (const inst of config.instruments) {
    const instItems = itemsOf(config, inst.key, form);
    const byFacet = groupByFacet(instItems);

    for (const facet of inst.facets) {
      const facetItems = byFacet[facet.key] || [];
      if (facetItems.length === 0) continue;

      const isValidityFacet = inst.hasValidity && inst.validityFacetKey === facet.key;
      if (isValidityFacet) {
        validityResults[inst.key] = checkValidity(facetItems, answers);
        continue; // validity facet এর score কোনো ডোমেইনে যায় না
      }

      const format = facetItems[0].format;
      let scaled: number | null = null;
      if (format === "likert_5") scaled = scoreLikertFacet(facetItems, answers);
      else if (format === "mcq_single_best") scaled = scoreMcqFacet(facetItems, answers);

      if (scaled !== null) {
        facetScores[`${inst.key}.${facet.key}`] = scaled;
      }
    }

    if (inst.hasValidity && !(inst.key in validityResults)) {
      validityResults[inst.key] = "not_assessed";
    }
  }

  // ---- Domain composition (Section 4) ----
  const domainResults: Record<string, AnyObj> = {};
  for (const domain of config.domains) {
    const refs = domain.formula || [];
    const values = refs
      .map((r) => facetScores[`${r.instrumentKey}.${r.facetKey}`])
      .filter((v) => v !== undefined && v !== null);

    const validityFailed =
      !!domain.inconclusiveIfValidityFailedOn &&
      validityResults[domain.inconclusiveIfValidityFailedOn] === "failed";

    if (validityFailed) {
      domainResults[domain.key] = {
        key: domain.key,
        name_bn: domain.name_bn,
        name_en: domain.name_en,
        cluster: domain.cluster,
        scored: false,
        inconclusive: true,
        note_bn: "ভ্যালিডিটি চেক ব্যর্থ — এই ডোমেইনের ফলাফল অনিশ্চিত, স্ট্রাকচার্ড ইন্টারভিউ সুপারিশকৃত।",
      };
      continue;
    }

    if (values.length === 0 || values.length < refs.length) {
      domainResults[domain.key] = {
        key: domain.key,
        name_bn: domain.name_bn,
        name_en: domain.name_en,
        cluster: domain.cluster,
        scored: false,
      };
      continue;
    }

    const score = round1(values.reduce((a, b) => a + b, 0) / values.length);
    const band = bandForScore(config.bands, score);

    domainResults[domain.key] = {
      key: domain.key,
      name_bn: domain.name_bn,
      name_en: domain.name_en,
      cluster: domain.cluster,
      scored: true,
      score,
      percentile: score, // Path A (provisional/rational scoring): 0-100 স্কেলড কম্পোজিটই percentile
      band,
    };
  }

  // ---- Convergence check (Section 3.8 / 6.1 step 2) ----
  let convergenceFlag: "consistent" | "inconsistent" | null = null;
  if (config.convergenceCheck) {
    const { instrumentA, instrumentB, maxBandDiff } = config.convergenceCheck;
    const bandRankOf = (ref: AnyObj) => {
      const val = facetScores[`${ref.instrumentKey}.${ref.facetKey}`];
      if (val === undefined) return null;
      const b = bandForScore(config.bands, val);
      return b ? b.rank : null;
    };
    const rankA = bandRankOf(instrumentA);
    const rankB = bandRankOf(instrumentB);
    if (rankA !== null && rankB !== null) {
      convergenceFlag = Math.abs(rankA - rankB) > maxBandDiff ? "inconsistent" : "consistent";
    }
  }

  // ---- Fit statement (Section 6.1 steps 1-3) ----
  let fitStatement: string | null = null;
  let fitStatementOverride = false;

  // step 1: কোনো validity fail থাকলে সংশ্লিষ্ট ডোমেইন আগেই "inconclusive" হয়ে গেছে,
  // কিন্তু pipeline যদি সবগুলো critical validity একসাথে fail করে সেটা caller-লেভেলে আলাদা flag করা হবে (edge case)

  if (convergenceFlag === "inconsistent") {
    fitStatement = "Recommend a structured interview before deciding";
    fitStatementOverride = true;
  } else if (config.fitStatementRule) {
    const rule = config.fitStatementRule;
    const integrity = domainResults[rule.integrityDomainKey];
    const judgment = domainResults[rule.judgmentDomainKey];

    if (integrity?.scored && judgment?.scored) {
      const anchor = (integrity.band.rank + judgment.band.rank) / 2;
      let downgrade = 0;
      for (const dk of rule.downgradeIfBandEquals1 || []) {
        if (domainResults[dk]?.scored && domainResults[dk].band.rank === 1) downgrade = 1;
      }
      const adjusted = anchor - downgrade;
      if (adjusted >= rule.thresholds.wellSuited) fitStatement = "Well suited";
      else if (adjusted >= rule.thresholds.suitedWithCoaching) fitStatement = "Suited, with coaching support";
      else fitStatement = "Likely to need substantial management coaching";
    }
  }

  // ---- Strengths / development area (top 2 / lowest band, excluding inconclusive) ----
  const scoredEntries = Object.values(domainResults).filter((d) => d.scored);
  const sorted = [...scoredEntries].sort(
    (a, b) => b.band.rank - a.band.rank || b.score - a.score
  );
  const strengths = sorted.slice(0, 2).map((d) => d.key);
  const developmentArea = sorted.length ? sorted[sorted.length - 1].key : null;

  // ---- Any validity failure across the 3 validity-bearing instruments? (Section 7 edge case) ----
  const validityFailCount = Object.values(validityResults).filter((v) => v === "failed").length;

  return {
    scoringType: "am_battery",
    form,
    facetScores,
    validityResults,
    validityFailCount,
    needsManualReview: validityFailCount >= 2, // ম্যানুয়েল Section 7: দুই বা তিনটা validity একসাথে fail = পুরো রিপোর্ট manual review-এ পাঠান
    domainResults,
    convergenceFlag,
    fitStatement,
    fitStatementOverride,
    strengths,
    developmentArea,
  };
}