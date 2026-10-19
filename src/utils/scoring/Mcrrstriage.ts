import { Answers, ScoringResult } from "./Type";


function roundHalfUp(n: number): number {
  return Math.round(n);
}

export function scoreMcrrsTriage(
  instrumentData: Record<string, any>,
  answers: Answers
): ScoringResult {
  const form = answers._form || "M";
  const formData = instrumentData.forms[form];
  const items: any[] = formData.items;
  const domainKeys: string[] = formData.domains;

  // Care module check — highest priority, overrides everything
  const careAnswers = instrumentData.careModule.items.map((c: any) => answers[c.id]);
  const careFlag = careAnswers.includes("yes");

  // reverse-code
  const recoded: Record<string, number> = {};
  items.forEach((it) => {
    const raw = answers[it.id];
    if (raw === undefined || raw === null) return;
    recoded[it.id] = it.reverse ? 6 - raw : raw;
  });

  // domain means with prorate rule
  const domainResults: Record<string, any> = {};
  domainKeys.forEach((d) => {
    const dItems = items.filter((it) => it.domain === d);
    const answered = dItems.filter((it) => recoded[it.id] !== undefined);
    if (answered.length <= 2) {
      domainResults[d] = {
        name_bn: instrumentData.domains[d].name_bn,
        name_en: instrumentData.domains[d].name_en,
        scored: false,
      };
      return;
    }
    const mean = answered.reduce((s, it) => s + recoded[it.id], 0) / answered.length;
    const index = roundHalfUp(((mean - 1) / 4) * 100);
    domainResults[d] = {
      name_bn: instrumentData.domains[d].name_bn,
      name_en: instrumentData.domains[d].name_en,
      scored: true,
      mean,
      index,
      prorated: answered.length === 3,
      band: bandFor(index, instrumentData.bands),
    };
  });

  // total
  const scoredDomains = domainKeys.filter((d) => domainResults[d].scored);
  const unscored = domainKeys.length - scoredDomains.length;
  let total = null;
  if (unscored < 2) {
    const meanOfMeans =
      scoredDomains.reduce((s, d) => s + domainResults[d].mean, 0) / scoredDomains.length;
    total = {
      index: roundHalfUp(((meanOfMeans - 1) / 4) * 100),
      note: unscored === 1 ? "একটি ক্ষেত্র স্কোর করা যায়নি" : null,
    };
    (total as any).band = bandFor(total.index, instrumentData.bands);
  }

  // PRI — only if D1, D4, D5 all scored, and only forms M/E
  let pri = null;
  if (
    (form === "M" || form === "E") &&
    domainResults["D5"]?.scored &&
    domainResults["D4"]?.scored &&
    domainResults["D1"]?.scored
  ) {
    const w = instrumentData.priFormula.weights;
    const priMean =
      w.D5 * domainResults["D5"].mean + w.D4 * domainResults["D4"].mean + w.D1 * domainResults["D1"].mean;
    const priIndex = roundHalfUp(((priMean - 1) / 4) * 100);
    pri = { index: priIndex, band: bandFor(priIndex, instrumentData.bands) };
  }

  // triage — first match wins
  let tier = 0;
  if (careFlag) tier = 4;
  else if (total && total.index < 40) tier = 3;
  else if (total && (total.index < 55 || domainKeys.some((d) => domainResults[d].scored && domainResults[d].index < 40))) tier = 2;
  else if (total && total.index < 70) tier = 1;
  else tier = 0;

  // strongest / focus domains
  const scored = domainKeys.filter((d) => domainResults[d].scored);
  const sorted = [...scored].sort((a, b) => domainResults[b].index - domainResults[a].index);
  const strongest = sorted[0];
  const focusAreas = sorted.slice(-2).reverse();

  return {
    scoringType: "mcrrs_triage",
    form,
    careFlag,
    domainResults,
    total,
    pri,
    tier,
    tierLabel_bn: instrumentData.triageRules.find((r: any) => r.tier === tier)?.label_bn,
    tierLabel_en: instrumentData.triageRules.find((r: any) => r.tier === tier)?.label_en,
    strongest,
    focusAreas,
    domainModalityMap: instrumentData.domainModalityMap,
    referralResources: instrumentData.referralResources,
    tier4Message_bn: careFlag ? instrumentData.tier4Message_bn : null,
    tier4Message_en: careFlag ? (instrumentData.tier4Message_en || instrumentData.tier4Message_bn) : null,
    disclaimer_bn: instrumentData.disclaimer_bn,
    disclaimer_en: instrumentData.disclaimer_en,
  };
}

function bandFor(score: number, bands: any[]) {
  return bands.find((b) => score >= b.min && score < b.max) ?? bands[bands.length - 1];
}