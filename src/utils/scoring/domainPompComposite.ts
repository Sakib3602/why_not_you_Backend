

import { Answers, ScoringResult } from "./Type";

function pomp(sumRecoded: number, nAnswered: number): number {
  if (nAnswered === 0) return 0;
  return Math.round(((sumRecoded / (nAnswered * 4)) * 100) * 10) / 10; // ১ দশমিক ঘর
}

export function scoreDomainPompComposite(
  instrumentData: Record<string, any>,
  answers: Answers
): ScoringResult {
  const items: any[] = instrumentData.items;
  const domainKeys = Object.keys(instrumentData.domains); // ["TP","MS","MG","AS","KA","CO","MD"]
  const minAnswered = instrumentData.missingDataRule.minAnsweredPerDomain;

  // ---- Step 1+2: raw capture + recode reverse-keyed ----
  const recoded: Record<string, number> = {};
  items.forEach((it) => {
    const raw = answers[it.id];
    if (raw === undefined || raw === null) return;
    recoded[it.id] = it.reverse ? 4 - raw : raw;
  });

  // ---- Step 3: প্রতিটা ডোমেইনের POMP index ----
  const domainResults: Record<string, any> = {};
  domainKeys.forEach((d) => {
    const dItems = items.filter((it) => it.domain === d);
    const answeredItems = dItems.filter((it) => recoded[it.id] !== undefined);

    if (answeredItems.length < minAnswered) {
      domainResults[d] = { name_bn: instrumentData.domains[d].name_bn, index: null, scored: false };
      return;
    }
    const sum = answeredItems.reduce((s, it) => s + recoded[it.id], 0);
    const index = pomp(sum, answeredItems.length);
    domainResults[d] = {
      name_bn: instrumentData.domains[d].name_bn,
      name_en: instrumentData.domains[d].name_en,
      index,
      scored: true,
      band: bandFor(index, instrumentData.bands),
    };
  });

  // ---- Step 4: composite = mean of scored domain indices ----
  const scoredDomains = domainKeys.filter((d) => domainResults[d].scored);
  let composite: number | null = null;
  let compositeBand: any = null;
  if (scoredDomains.length >= instrumentData.missingDataRule.minScoredDomainsForComposite) {
    const mean =
      scoredDomains.reduce((s, d) => s + domainResults[d].index, 0) / scoredDomains.length;
    composite = Math.round(mean * 10) / 10;
    compositeBand = bandFor(composite, instrumentData.bands);
  }

  // ---- Step 6: Impression Management index ----
  const imItems = items.filter((it) => it.domain === "IM");
  const imAnswered = imItems.filter((it) => recoded[it.id] !== undefined);
  const imSum = imAnswered.reduce((s, it) => s + recoded[it.id], 0);
  const imIndex = pomp(imSum, imAnswered.length);
  const imNote = instrumentData.imBands.find(
    (b: any) => imIndex >= b.min && imIndex <= b.max
  );

  // ---- flags: recoded value <= 1 হলে fire (uniform rule) ----
  const flagsFired = instrumentData.safeguardingFlags.items.filter(
    (code: string) => recoded[code] !== undefined && recoded[code] <= 1
  );

  return {
    scoringType: "domain_pomp_composite",
    domainResults,
    composite,
    compositeBand,
    imIndex,
    imNote: imNote?.note_bn ? imNote : null, // 0-49 রেঞ্জে note null, তাই দেখানো হবে না
    flagsFired,
    itemsAnswered: Object.keys(recoded).length,
  };
}

function bandFor(score: number, bands: any[]) {
  // inclusive of lower bound — 70.0 ঠিক "Effective", "Developing" না
  return bands.find((b) => score >= b.min && score < b.max) ?? bands[bands.length - 1];
}