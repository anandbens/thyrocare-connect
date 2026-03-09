import defaultBlood from "@/assets/test-default-blood.jpg";
import familyHealth from "@/assets/test-family-health.jpg";
import thyroid from "@/assets/test-thyroid.jpg";
import diabetes from "@/assets/test-diabetes.jpg";
import heart from "@/assets/test-heart.jpg";
import vitamin from "@/assets/test-vitamin.jpg";
import bloodGeneral from "@/assets/test-blood-general.jpg";
import kidney from "@/assets/test-kidney.jpg";
import liver from "@/assets/test-liver.jpg";
import aarogyamFamily from "@/assets/test-aarogyam-family.jpg";
import cbc from "@/assets/test-cbc.jpg";
import urine from "@/assets/test-urine.jpg";
import hormone from "@/assets/test-hormone.jpg";
import allergy from "@/assets/test-allergy.jpg";
import seniorHealth from "@/assets/test-senior-health.jpg";
import infection from "@/assets/test-infection.jpg";
import bloodPanel from "@/assets/test-blood-panel.jpg";
import womenHealth from "@/assets/test-women-health.jpg";
import iron from "@/assets/test-iron.jpg";
import fever from "@/assets/test-fever.jpg";
import mensHealth from "@/assets/test-mens-health.jpg";
import arthritis from "@/assets/test-arthritis.jpg";
import fullBody from "@/assets/test-full-body.jpg";
import electrolyte from "@/assets/test-electrolyte.jpg";
import lipid from "@/assets/test-lipid.jpg";
import bone from "@/assets/test-bone.jpg";
import pancreas from "@/assets/test-pancreas.jpg";
import eye from "@/assets/test-eye.jpg";
import immunity from "@/assets/test-immunity.jpg";
import cancer from "@/assets/test-cancer.jpg";
import glucose from "@/assets/test-glucose.jpg";
import stool from "@/assets/test-stool.jpg";

// Each category maps keywords to an ARRAY of images for rotation
const keywordImageMap: [string[], string[]][] = [
  [["aarogyam"], [aarogyamFamily]],
  [["full body", "comprehensive", "annual"], [fullBody, familyHealth]],
  [["wellness", "preventive", "master", "executive"], [familyHealth, fullBody]],
  [["women", "female", "pcos", "pcod", "pregnancy", "prenatal", "antenatal"], [womenHealth]],
  [["men", "male", "psa", "prostate"], [mensHealth]],
  [["thyroid", "t3", "t4", "tsh"], [thyroid]],
  [["diabetes", "hba1c", "glycosylated"], [diabetes, glucose]],
  [["sugar", "glucose", "fasting sugar", "pp sugar", "gtт", "ogtt"], [glucose, diabetes]],
  [["heart", "cardiac", "cardio", "ecg", "troponin", "bnp"], [heart]],
  [["lipid", "cholesterol", "hdl", "ldl", "triglyceride", "vldl"], [lipid, heart]],
  [["vitamin", "vit d", "vit b", "b12", "25-oh", "folate", "folic"], [vitamin]],
  [["kidney", "renal", "kft", "creatinine", "bun", "urea"], [kidney]],
  [["liver", "hepatic", "lft", "sgpt", "sgot", "bilirubin"], [liver]],
  [["hepatitis", "hbsag", "hcv"], [liver, infection]],
  [["cbc", "complete blood count", "hemoglobin", "haemoglobin"], [cbc]],
  [["platelet", "wbc", "rbc", "blood count"], [cbc, bloodGeneral]],
  [["urine", "urinalysis", "microalbumin"], [urine]],
  [["stool", "occult", "fecal"], [stool]],
  [["hormone", "estrogen", "testosterone", "prolactin", "lh", "fsh"], [hormone]],
  [["fertility", "amh", "semen", "sperm"], [hormone, mensHealth]],
  [["allergy", "ige", "immunoglobulin", "food intolerance"], [allergy]],
  [["immunity", "immune", "autoimmune", "ana", "complement"], [immunity]],
  [["senior", "elderly", "geriatric", "old age", "50+", "60+"], [seniorHealth]],
  [["fever", "dengue", "malaria", "typhoid", "widal"], [fever]],
  [["covid", "viral", "flu", "influenza"], [fever, infection]],
  [["infection", "sepsis", "culture", "sensitivity", "procalcitonin"], [infection]],
  [["arthritis", "rheumatoid", "ra factor", "anti ccp"], [arthritis]],
  [["joint", "uric acid", "gout", "crp", "esr"], [arthritis, bone]],
  [["iron", "ferritin", "tibc", "anemia", "anaemia"], [iron]],
  [["electrolyte", "sodium", "potassium"], [electrolyte]],
  [["calcium", "magnesium", "phosphorus", "bone", "osteo"], [bone, electrolyte]],
  [["cancer", "tumor", "tumour", "marker", "cea", "afp", "ca 125", "ca 19"], [cancer]],
  [["pancrea", "amylase", "lipase"], [pancreas]],
  [["eye", "vision", "retino"], [eye]],
  [["panel", "profile", "screen"], [bloodPanel, lipid]],
  [["package", "basic", "routine", "mini", "maxi"], [bloodPanel, bloodGeneral]],
  [["blood", "serum", "plasma"], [bloodGeneral, bloodPanel]],
];

// All available images for fallback rotation
const allImages = [
  defaultBlood, familyHealth, thyroid, diabetes, heart, vitamin,
  bloodGeneral, kidney, liver, aarogyamFamily, cbc, urine,
  hormone, allergy, seniorHealth, infection, bloodPanel,
  womenHealth, iron, fever, mensHealth, arthritis, fullBody,
  electrolyte, lipid, bone, pancreas, eye, immunity, cancer,
  glucose, stool,
];

// Simple hash to get a deterministic number from a string
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getTestImage(test: { name: string; image_url?: string | null; description?: string | null }): string {
  if (test.image_url) return test.image_url;

  const searchText = `${test.name} ${test.description || ""}`.toLowerCase();
  const nameHash = hashString(test.name);

  for (const [keywords, images] of keywordImageMap) {
    if (keywords.some((kw) => searchText.includes(kw))) {
      // Use hash to pick from the category's image array
      return images[nameHash % images.length];
    }
  }

  // Fallback: use hash to pick from ALL images so even unmatched tests get unique images
  return allImages[nameHash % allImages.length];
}
