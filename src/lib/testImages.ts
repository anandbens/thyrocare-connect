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

// Map test name keywords to specific fallback images — ordered by specificity
const keywordImageMap: [string[], string][] = [
  [["aarogyam", "family health", "health package"], aarogyamFamily],
  [["full body", "comprehensive", "annual"], fullBody],
  [["wellness", "preventive", "master"], familyHealth],
  [["women", "female", "pcos", "pcod", "pregnancy", "prenatal", "antenatal"], womenHealth],
  [["men", "male", "psa", "prostate"], mensHealth],
  [["thyroid", "t3", "t4", "tsh"], thyroid],
  [["diabetes", "sugar", "hba1c", "glucose", "glycosylated"], diabetes],
  [["heart", "cardiac", "lipid", "cholesterol", "cardio", "ecg", "troponin"], heart],
  [["vitamin", "vit d", "vit b", "b12", "25-oh", "folate", "folic"], vitamin],
  [["kidney", "renal", "kft", "creatinine", "bun"], kidney],
  [["liver", "hepatic", "lft", "sgpt", "sgot", "bilirubin", "hepatitis"], liver],
  [["cbc", "complete blood count", "hemoglobin", "haemoglobin", "platelet", "wbc", "rbc"], cbc],
  [["urine", "urinalysis"], urine],
  [["hormone", "estrogen", "testosterone", "prolactin", "fertility", "lh", "fsh"], hormone],
  [["allergy", "ige", "immunoglobulin", "food intolerance"], allergy],
  [["senior", "elderly", "geriatric", "old age", "50+", "60+"], seniorHealth],
  [["fever", "dengue", "malaria", "typhoid", "widal", "covid", "viral"], fever],
  [["infection", "sepsis", "culture", "sensitivity"], infection],
  [["arthritis", "rheumatoid", "ra factor", "joint", "uric acid", "gout", "crp", "esr", "anti ccp"], arthritis],
  [["iron", "ferritin", "tibc", "anemia", "anaemia"], iron],
  [["electrolyte", "sodium", "potassium", "calcium", "magnesium", "phosphorus"], electrolyte],
  [["panel", "profile", "screen", "package", "basic", "routine"], bloodPanel],
  [["blood", "serum", "plasma", "test"], bloodGeneral],
];

export function getTestImage(test: { name: string; image_url?: string | null; description?: string | null }): string {
  if (test.image_url) return test.image_url;

  const searchText = `${test.name} ${test.description || ""}`.toLowerCase();

  for (const [keywords, image] of keywordImageMap) {
    if (keywords.some((kw) => searchText.includes(kw))) {
      return image;
    }
  }

  return defaultBlood;
}
