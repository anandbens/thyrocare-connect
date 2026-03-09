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

// Map test name keywords to specific fallback images — ordered by specificity
const keywordImageMap: [string[], string][] = [
  [["aarogyam", "family health", "health package"], aarogyamFamily],
  [["full body", "comprehensive", "wellness", "preventive", "annual"], familyHealth],
  [["thyroid", "t3", "t4", "tsh"], thyroid],
  [["diabetes", "sugar", "hba1c", "glucose", "glycosylated"], diabetes],
  [["heart", "cardiac", "lipid", "cholesterol", "cardio", "ecg"], heart],
  [["vitamin", "nutrition", "mineral"], vitamin],
  [["kidney", "renal", "kft", "creatinine", "urea", "bun"], kidney],
  [["liver", "hepatic", "lft", "sgpt", "sgot", "bilirubin"], liver],
  [["cbc", "complete blood count", "hemoglobin", "haemoglobin", "platelet", "wbc", "rbc"], cbc],
  [["urine", "urinalysis", "urea"], urine],
  [["hormone", "estrogen", "testosterone", "prolactin", "fertility", "pcod", "pcos"], hormone],
  [["allergy", "ige", "immunoglobulin", "food intolerance"], allergy],
  [["senior", "elderly", "geriatric", "old age", "50+", "60+"], seniorHealth],
  [["infection", "fever", "dengue", "malaria", "typhoid", "widal", "covid", "viral"], infection],
  [["iron", "ferritin", "calcium", "electrolyte"], bloodGeneral],
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
