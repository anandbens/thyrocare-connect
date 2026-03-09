import defaultBlood from "@/assets/test-default-blood.jpg";
import familyHealth from "@/assets/test-family-health.jpg";
import thyroid from "@/assets/test-thyroid.jpg";
import diabetes from "@/assets/test-diabetes.jpg";
import heart from "@/assets/test-heart.jpg";
import vitamin from "@/assets/test-vitamin.jpg";

// Map category names or test name keywords to fallback images
const keywordImageMap: [string[], string][] = [
  [["aarogyam", "family", "full body", "health package", "comprehensive", "wellness"], familyHealth],
  [["thyroid", "t3", "t4", "tsh"], thyroid],
  [["diabetes", "sugar", "hba1c", "glucose", "glycosylated"], diabetes],
  [["heart", "cardiac", "lipid", "cholesterol", "cardio"], heart],
  [["vitamin", "nutrition", "iron", "calcium", "mineral"], vitamin],
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
