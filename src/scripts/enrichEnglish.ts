import fs from "fs";
import path from "path";

// 1. Update Fadss.config.json
const fadssPath = path.join(__dirname, "..", "data", "Fadss.config.json");
const fadss = JSON.parse(fs.readFileSync(fadssPath, "utf-8"));

// English for FADSS items
const fadssEnMap: Record<number, string> = {
  1: "I worried excessively about minor or trivial matters.",
  2: "I felt that the things I tried to do were repeatedly failing.",
  3: "I could not find interest or pleasure in anything.",
  4: "I became irritable or easily angered over little things.",
  5: "I felt that no matter how hard I tried, nothing was progressing properly.",
  6: "I felt sudden heart palpitations or trembling in my hands and feet.",
  7: "I felt worthless or useless.",
  8: "I found it difficult to relax my mind and body.",
  9: "Most of the time, I felt calm and at ease.",
  10: "I got frustrated by minor setbacks and abandoned what I was doing.",
  11: "I felt little to no hope about my future.",
  12: "I felt overwhelmed by the pressure of juggling multiple tasks.",
  13: "I felt as though my life was completely stuck in one place.",
  14: "I was frequently restless out of fear that something terrible might happen.",
  15: "I felt positive and optimistic about life.",
  16: "I felt a persistent inner tension or restlessness.",
  17: "I felt satisfied when finishing tasks according to plan.",
  18: "It took me a long time to fall asleep because of persistent worries.",
  19: "I felt sad and depressed throughout the day.",
  20: "During breaks, I was able to rest and easily feel refreshed.",
  21: "I felt that I never truly get what I desire or work towards.",
  22: "I lacked the energy or enthusiasm to carry out daily activities.",
  23: "I felt distinctly nervous in crowds or unfamiliar situations.",
  24: "I found it very hard to tolerate delays or having to wait."
};

fadss.items = fadss.items.map((it: any) => ({
  ...it,
  text_en: fadssEnMap[it.id] || it.text_bn
}));

fadss.responseScale.labels = [
  { value: 0, bn: "কখনো না / একেবারেই না", en: "Never / Not at all" },
  { value: 1, bn: "মাঝে মাঝে", en: "Sometimes" },
  { value: 2, bn: "প্রায়ই", en: "Often" },
  { value: 3, bn: "প্রায় সবসময়", en: "Almost always" }
];

fadss.overallStates = [
  {
    rank: 0,
    label_bn: "মানসিকভাবে স্থিতিশীল",
    label_en: "Mentally Stable",
    message_bn: "চারটি ক্ষেত্রেই আপনার ফলাফল স্বাভাবিক পর্যায়ে রয়েছে — এটি একটি ইতিবাচক লক্ষণ। বর্তমান সুস্থ অভ্যাসগুলো বজায় রাখুন।",
    message_en: "Your scores across all four areas are within the normal range — this is a positive indicator. Continue your current healthy coping habits."
  },
  {
    rank: 1,
    label_bn: "সামান্য প্রভাবিত",
    label_en: "Mildly Affected",
    message_bn: "সামান্য মাত্রার লক্ষণ প্রকাশ পেয়েছে। এখনই উদ্বেগের কিছু নেই, তবে আত্ম-পর্যবেক্ষণ ও স্বাস্থ্যকর অভ্যাস চালিয়ে যান।",
    message_en: "Mild levels of distress were indicated. There is no immediate cause for concern, but self-monitoring and maintaining balanced routines are advised."
  },
  {
    rank: 2,
    label_bn: "মাঝারিভাবে প্রভাবিত",
    label_en: "Moderately Affected",
    message_bn: "মাঝারি মাত্রার লক্ষণ প্রকাশ পেয়েছে। উপসর্গ কয়েক সপ্তাহ ধরে চলতে থাকলে একজন কাউন্সেলর/মনোবিজ্ঞানীর সাথে পরামর্শ করা উত্তম।",
    message_en: "Moderate levels of distress were indicated. If these symptoms have persisted for several weeks, consulting a counsellor or psychologist is recommended."
  },
  {
    rank: 3,
    label_bn: "উল্লেখযোগ্যভাবে প্রভাবিত — সতর্কতা প্রয়োজন",
    label_en: "Significantly Affected — Caution Advised",
    message_bn: "তীব্র মাত্রার লক্ষণ প্রকাশ পেয়েছে। দয়া করে একজন কাউন্সেলর, মনোবিজ্ঞানী বা মনোরোগ বিশেষজ্ঞের সাথে যোগাযোগ করুন।",
    message_en: "Severe levels of symptoms were noted. Please reach out to a professional counsellor, psychologist, or psychiatrist for a comprehensive assessment."
  },
  {
    rank: 4,
    label_bn: "উদ্বেগজনক অবস্থা — জরুরি পেশাদার সহায়তা প্রয়োজন",
    label_en: "Alarming State — Immediate Professional Support Required",
    message_bn: "অত্যন্ত তীব্র মাত্রার লক্ষণ প্রকাশ পেয়েছে। দয়া করে দেরি না করে একজন মনোরোগ বিশেষজ্ঞ বা ক্লিনিক্যাল সাইকোলজিস্টের সাথে অবিলম্বে যোগাযোগ করুন।",
    message_en: "Extremely severe symptoms were reported. Please contact a psychiatrist or clinical psychologist promptly for supportive care."
  }
];

// Enrich interpretations with English
const interpretationsEn: Record<string, Record<string, { en: string; actions_en: string[] }>> = {
  F: {
    "0": {
      en: "Frustration level is normal. You adapt comfortably to obstacles and goal pursuit.",
      actions_en: ["Maintain your current constructive problem-solving habits.", "Acknowledge and celebrate small milestones."]
    },
    "1": {
      en: "Mild frustration — occasional feelings that efforts are unrewarded or tasks are delayed.",
      actions_en: ["Break large goals down into manageable steps.", "Focus effort on factors within your direct control.", "Discuss bottlenecks openly with peers or mentors."]
    },
    "2": {
      en: "Moderate frustration — recurring setbacks are dampening your daily motivation.",
      actions_en: ["Reassess your expectations and timeline realism.", "Practice problem-focused stress reduction techniques.", "Consider talking through challenges with a counsellor."]
    },
    "3": {
      en: "Severe frustration — a persistent feeling of being stuck is impacting your efficiency and mood.",
      actions_en: ["Consult a mental health professional.", "Develop constructive channels for discharging pent-up irritation."]
    },
    "4": {
      en: "Extremely severe frustration — prolonged stagnation may lead to burnout or deep anger.",
      actions_en: ["Seek prompt guidance from a psychologist or therapist.", "Pause major impulsive decisions until you receive professional support."]
    }
  },
  A: {
    "0": {
      en: "Anxiety level is normal. Physical and cognitive relaxation is well-regulated.",
      actions_en: ["Continue regular breathing exercises and mindfulness.", "Maintain moderate intake of caffeine and stimulants."]
    },
    "1": {
      en: "Mild anxiety — occasional worrying thoughts or physical restlessness.",
      actions_en: ["Dedicate 10-15 minutes daily to physical relaxation.", "Journaling your worries often puts them into perspective."]
    },
    "2": {
      en: "Moderate anxiety — persistent worry and physical signs are interfering with work or peace of mind.",
      actions_en: ["Consider CBT-based anxiety coping techniques with a psychologist.", "Maintain structured sleep and eating routines."]
    },
    "3": {
      en: "Severe anxiety — frequent panic sensations or pronounced physical discomfort.",
      actions_en: ["Schedule a formal evaluation with a clinical psychologist or psychiatrist."]
    },
    "4": {
      en: "Extremely severe anxiety — daily functioning may be significantly disrupted.",
      actions_en: ["Seek immediate professional psychiatric or psychological assistance.", "If experiencing acute chest discomfort or palpitations, seek medical clearance first."]
    }
  },
  D: {
    "0": {
      en: "Depression score is within normal boundaries.",
      actions_en: ["Keep consistent routines, physical activity, and social connections.", "Make time for recreational hobbies and restorative rest."]
    },
    "1": {
      en: "Mild low mood — temporary dips in enthusiasm, energy, or joy.",
      actions_en: ["Stay connected with close friends and family.", "Engage in daily walking or outdoor sunlight exposure.", "If low mood persists beyond two weeks, consult a professional."]
    },
    "2": {
      en: "Moderate depression — interest, energy, and capacity for joy are notably dampened.",
      actions_en: ["Schedule a consultation with a psychologist or mental health specialist.", "Structure tasks into minimal, achievable daily steps."]
    },
    "3": {
      en: "Severe depression — self-worth, motivation, and hope for the future are deeply impaired.",
      actions_en: ["Consult a psychiatrist or clinical psychologist as soon as possible.", "Avoid isolation and lean on trusted family members or friends."]
    },
    "4": {
      en: "Extremely severe depression — urgent professional care is strongly indicated.",
      actions_en: ["Contact a psychiatrist or clinical psychologist immediately.", "Do not stay alone; keep supportive family or friends close by.", "If experiencing thoughts of self-harm, immediately call an emergency helpline."]
    }
  },
  S: {
    "0": {
      en: "Stress level is well-managed and within normal limits.",
      actions_en: ["Continue your effective stress management practices.", "Preserve designated downtime and leisure activities."]
    },
    "1": {
      en: "Mild stress — occasional irritability, impatience, or feeling hurried.",
      actions_en: ["Improve daily time and task scheduling.", "Set aside dedicated relaxation moments away from screens."]
    },
    "2": {
      en: "Moderate stress — nervous tension, low frustration tolerance, and frequent agitation.",
      actions_en: ["Identify key stress triggers and negotiate manageable boundaries.", "Incorporate mindfulness or progressive muscle relaxation."]
    },
    "3": {
      en: "Severe stress — tension is placing noticeable strain on relationships and productivity.",
      actions_en: ["Seek professional stress counselling.", "Temporarily delegate or reduce non-essential workload where possible."]
    },
    "4": {
      en: "Extremely severe stress — acute nervous exhaustion.",
      actions_en: ["Consult a mental health professional without delay.", "Take an intentional rest period and seek support from trusted people."]
    }
  }
};

for (const construct of ["F", "A", "D", "S"]) {
  if (fadss.interpretations[construct]) {
    for (const rank of ["0", "1", "2", "3", "4"]) {
      if (fadss.interpretations[construct][rank] && interpretationsEn[construct]?.[rank]) {
        fadss.interpretations[construct][rank].en = interpretationsEn[construct][rank].en;
        fadss.interpretations[construct][rank].actions_en = interpretationsEn[construct][rank].actions_en;
      }
    }
  }
}

fadss.referral.message_en = "One or more of your domain scores reflect severe or extremely severe levels. Please reach out to a certified counsellor, psychologist, or psychiatrist for supportive consultation.";
fadss.crisisNote.message_en = "If you are having thoughts of harming yourself or feel overwhelmed, please do not carry this alone. Reach out immediately to the helpline contacts below or visit the nearest emergency healthcare facility.";

fadss.helplines = [
  { name_bn: "জাতীয় মানসিক স্বাস্থ্য হেল্পলাইন (স্বাস্থ্য অধিদপ্তর)", name_en: "National Mental Health Helpline (DGHS)", number: "16789", hours_en: "24/7 Toll-Free" },
  { name_bn: "কান পেতে রই (মানসিক সহায়তা ও আত্মহত্যা প্রতিরোধ)", name_en: "Kaan Pete Roi (Emotional Support & Suicide Prevention)", number: "09612-119911", hours_en: "Daily 3:00 PM – 3:00 AM" },
  { name_bn: "জাতীয় মানসিক স্বাস্থ্য ইনস্টিটিউট ও হাসপাতাল (NIMH)", name_en: "National Institute of Mental Health (NIMH)", number: "02-9116551", hours_en: "Office Hours" },
  { name_bn: "জাতীয় জরুরি সেবা", name_en: "National Emergency Service", number: "999", hours_en: "Immediate Emergency (24/7)" }
];

fs.writeFileSync(fadssPath, JSON.stringify(fadss, null, 2), "utf-8");
console.log("✅ Updated Fadss.config.json with English texts.");

// 2. Update cfi-bd.config.json
const cfiPath = path.join(__dirname, "..", "data", "cfi-bd.config.json");
const cfi = JSON.parse(fs.readFileSync(cfiPath, "utf-8"));

cfi.typeLabels_en = {
  R: "Realistic",
  I: "Investigative",
  A: "Artistic",
  S: "Social",
  E: "Enterprising",
  C: "Conventional"
};

cfi.valueLabels_en = {
  SEC: "Security & Stability",
  INC: "Income & Promotion",
  PRS: "Social Prestige",
  SRV: "Service & Contribution",
  AUT: "Autonomy & Creativity",
  BAL: "Balance & Well-being"
};

const cfiAEn: Record<string, string> = {
  A1: "Repairing a broken mobile phone or laptop.",
  A2: "Operating and maintaining machinery in a factory or workshop.",
  A3: "Working outdoors at a farm, fishery project, or nursery.",
  A4: "Installing or repairing electrical wiring in a home or building.",
  A5: "Driving or navigating a vehicle, water vessel, or aircraft as part of a profession.",
  A6: "Participating in physically demanding training and field drills.",
  A14: "Testing soil, water, or air samples and interpreting the results.",
  A15: "Writing computer programs to solve real-world problems.",
  A16: "Investigating why a machine failed or a system broke down.",
  A17: "Designing posters, logos, or book covers.",
  A18: "Writing stories, poetry, or drama scripts.",
  A19: "Performing music, theatre, or dance in front of an audience.",
  A20: "Creating short films or video content for social media.",
  A21: "Designing clothing, textiles, or handicrafts.",
  A22: "Planning the interior decoration of a home, office, or exhibition.",
  A23: "Drawing, painting, or sculpting as part of regular work.",
  A24: "Using art, music, or drama to help express complex emotions.",
  A25: "Teaching subjects to school or college students.",
  A26: "Providing counsel and emotional support to someone in distress.",
  A27: "Caring for patients in a hospital or clinic.",
  A28: "Visiting villages to work on community health and livelihood improvement.",
  A29: "Training adults in new skills for earning a livelihood.",
  A30: "Helping children with special needs learn and grow.",
  A31: "Mediating disputes fairly between two parties.",
  A32: "Spending most of the working day listening to people and helping them.",
  A33: "Starting and managing one's own business venture.",
  A34: "Persuading a customer to purchase a product or service.",
  A35: "Leading a team and taking responsibility for its outcomes.",
  A36: "Negotiating contracts or business agreements.",
  A37: "Giving public speeches to convince audiences of ideas.",
  A38: "Taking calculated risks in pursuit of substantial success.",
  A39: "Managing marketing campaigns for new products.",
  A40: "Holding a position of authority where others follow your decisions.",
  A41: "Keeping financial accounts accurate and up to date.",
  A42: "Organizing files, records, and documents systematically."
};

const cfiBEn: Record<string, string> = {
  B1: "Using tools and machinery correctly and safely.",
  B2: "Performing hard physical labor over extended periods.",
  B3: "Understanding how mechanical or electrical systems operate.",
  B4: "Learning advanced mathematics or statistics.",
  B5: "Designing a small research study and analyzing its data.",
  B6: "Learning to write computer code.",
  B7: "Producing creative work that others will appreciate.",
  B8: "Developing original ideas when there is no predetermined answer.",
  B9: "Mastering design or media software thoroughly.",
  B10: "Making a distressed person feel genuinely heard and understood.",
  B11: "Explaining a difficult topic in a way others easily grasp.",
  B12: "Working patiently with individuals who require extra support.",
  B13: "Persuading others to accept my proposal or viewpoint.",
  B14: "Leading a team toward a goal under time pressure.",
  B15: "Managing a small organization or business profitably.",
  B16: "Working accurately with numbers and records over long periods.",
  B17: "Following complex procedures without making errors.",
  B18: "Staying well-organized and consistently meeting every deadline."
};

const cfiCEn: Record<string, string> = {
  C1: "Having a job with minimal risk of layoff or job loss.",
  C2: "Having guaranteed pension and regular benefits.",
  C3: "Earning more income compared to peers.",
  C4: "Clear opportunities for promotion and salary growth.",
  C5: "Working in a profession held in high esteem by family and society.",
  C6: "Holding a position of public recognition and prestige.",
  C7: "Doing work that directly improves the quality of other people's lives.",
  C8: "Contributing meaningfully to national development.",
  C9: "Having autonomy to decide when and how to accomplish work.",
  C10: "Freedom to experiment with new and creative methods.",
  C11: "Ample time for family, personal practices, rest, and personal interests.",
  C12: "Working in a low-stress environment with predictable working hours."
};

const cfiDEn: Record<string, string> = {
  D1: "I prefer planning my day ahead rather than making decisions on the fly.",
  D2: "I feel irritated when a workplace has excessive rigid rules.",
  D3: "Interacting with lots of new people throughout the day energizes me.",
  D4: "I perform at my best when working alone for long stretches.",
  D5: "I stay calm even when deadlines are approaching very fast.",
  D6: "Mistakes in work or studies disturb my sleep.",
  D7: "I enjoy taking on tasks where the procedure has not yet been established.",
  D8: "I prefer using methods that have already been proven to work well.",
  D9: "I usually compromise on personal preferences to keep team work running smoothly.",
  D10: "I find it hard to accept a team decision that I disagree with."
};

const cfiEEn: Record<string, { en: string; options: string[] }> = {
  E1: {
    en: "What is your current education or career stage?",
    options: ["Completed HSC / A-Levels (Track A)", "Currently studying at University", "Completed Graduation / Bachelor's (Track B)", "Completed Post-graduation / Master's (Track B)"]
  },
  E5: {
    en: "How far are you willing to relocate for the right career?",
    options: ["Only within my home district", "Anywhere in Bangladesh", "Anywhere including remote postings", "Overseas as well"]
  },
  E6: {
    en: "How would you rate your English proficiency for work and study?",
    options: ["Basic", "Can read, but hesitate to speak", "Comfortable in most situations", "Fluent in speaking and writing"]
  },
  E7: {
    en: "How would you rate your computer and digital literacy?",
    options: ["Mobile phone only", "Basic computer use", "Proficient in office software", "Can use specialized software"]
  },
  E9: {
    en: "How urgently do you need to start earning?",
    options: ["Within 6 months", "Within 1-2 years", "After completing education", "No immediate time pressure"]
  },
  E11: {
    en: "Which sector attracts you the most at this moment?",
    options: ["Government Service", "Private Corporate Sector", "NGO / Development Sector", "Own Business / Entrepreneurship", "Overseas Employment", "Undecided yet"]
  }
};

cfi.items.A = cfi.items.A.map((it: any) => ({ ...it, en: cfiAEn[it.id] || it.bn }));
cfi.items.B = cfi.items.B.map((it: any) => ({ ...it, en: cfiBEn[it.id] || it.bn }));
cfi.items.C = cfi.items.C.map((it: any) => ({ ...it, en: cfiCEn[it.id] || it.bn }));
cfi.items.D = cfi.items.D.map((it: any) => ({ ...it, en: cfiDEn[it.id] || it.bn }));
cfi.items.E = cfi.items.E.map((it: any) => {
  const meta = cfiEEn[it.id];
  return {
    ...it,
    en: meta?.en || it.bn,
    options: meta?.options || it.options
  };
});

// Update occupations with English names
const occupationEnNames: Record<string, string> = {
  "পুরকৌশলী": "Civil Engineer",
  "বিদ্যুৎ ও ইলেকট্রনিক প্রকৌশলী": "Electrical & Electronics Engineer",
  "যানপ্রকৌশলী": "Automobile Engineer",
  "বস্ত্র প্রকৌশলী": "Textile Engineer",
  "নৌ-প্রকৌশলী": "Marine Engineer",
  "এয়ারক্রাফট মেইনটেন্যান্স ইঞ্জিনিয়ার": "Aircraft Maintenance Engineer",
  "আইটি সাপোর্ট ও নেটওয়ার্ক প্রশাসক": "IT Support & Network Administrator",
  "বিমানবাহিনীর কমিশনড অফিসার": "Air Force Commissioned Officer",
  "নৌবাহিনীর কমিশনড অফিসার": "Navy Commissioned Officer",
  "ফায়ার সার্ভিস অফিসার": "Fire Service Officer",
  "প্রাতিষ্ঠানিক প্রশিক্ষক": "Corporate Trainer",
  "কৃষি সম্প্রসারণ কর্মকর্তা": "Agriculture Extension Officer",
  "মৎস্য কর্মকর্তা": "Fisheries Officer",
  "পশুচিকিৎসক": "Veterinary Doctor",
  "পেশাদার শেফ": "Executive Chef",
  "বাণিজ্যিক পাইলট": "Commercial Airline Pilot",
  "মার্চেন্ট মেরিন অফিসার": "Merchant Marine Officer",
  "শিল্প প্রকৌশলী (RMG)": "Industrial Engineer (RMG)",
  "চর্ম ও পাদুকা প্রযুক্তিবিদ": "Leather & Footwear Technologist",
  "সাইট ইঞ্জিনিয়ার": "Site Construction Engineer",
  "জরিপকারী": "Land & Geodetic Surveyor",
  "দক্ষ কারিগর (ইলেকট্রিক্যাল/ওয়েল্ডিং/প্লাম্বিং)": "Skilled Technician (Electrical/Welding/Plumbing)",
  "প্রবাসী দক্ষ কর্মী": "Overseas Skilled Specialist",
  "চিকিৎসক (এমবিবিএস)": "Medical Doctor (MBBS)",
  "দন্ত শল্যচিকিৎসক": "Dental Surgeon",
  "ফার্মাসিস্ট": "Registered Pharmacist",
  "মেডিকেল ল্যাব প্রযুক্তিবিদ": "Medical Laboratory Technologist",
  "জনস্বাস্থ্য বিশেষজ্ঞ": "Public Health Specialist",
  "নগর পরিকল্পনাবিদ": "Urban & Regional Planner",
  "কৃষিবিজ্ঞানী": "Agricultural Scientist",
  "পরিবেশ বিজ্ঞানী": "Environmental Scientist",
  "গবেষক বিজ্ঞানী": "Research Scientist",
  "সফটওয়্যার ইঞ্জিনিয়ার": "Software Engineer",
  "ডাটা সায়েন্টিস্ট / এআই ইঞ্জিনিয়ার": "Data Scientist / AI Engineer",
  "সাইবার নিরাপত্তা বিশ্লেষক": "Cybersecurity Analyst",
  "ফ্রিল্যান্সার": "Digital Freelancer & Consultant",
  "আর্থিক বিশ্লেষক": "Financial Analyst",
  "সহকারী জজ": "Assistant Judge / Judicial Magistrate",
  "বাংলাদেশ ব্যাংক অফিসার": "Bangladesh Bank Officer",
  "পরিসংখ্যানবিদ": "Statistician / Biostatistician",
  "বিশ্ববিদ্যালয় শিক্ষক": "University Lecturer / Professor",
  "মনিটরিং ও মূল্যায়ন কর্মকর্তা": "Monitoring & Evaluation (M&E) Officer",
  "স্থপতি": "Architect",
  "ইউআই/ইউএক্স ডিজাইনার": "UI/UX Product Designer",
  "সাংবাদিক": "Journalist & Media Producer"
};

cfi.occupations = cfi.occupations.map((o: any) => ({
  ...o,
  name_en: occupationEnNames[o.name_bn] || o.name_bn
}));

cfi.fraudWarning_en = "Before accepting any job offer abroad, verify the recruiting agency with BMET. Never pay advance fees without official government verification.";

fs.writeFileSync(cfiPath, JSON.stringify(cfi, null, 2), "utf-8");
console.log("✅ Updated cfi-bd.config.json with English texts.");
