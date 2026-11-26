export function buildServiceImagePrompt({
  titleEn,
  descriptionEn,
  category,
}: {
  titleEn: string;
  descriptionEn: string;
  category: string;
}): string {
  const cleanTitle = titleEn.trim();
  const cleanDesc = descriptionEn.trim().slice(0, 220);

  return [
    `Photorealistic commercial architectural photography representing "${cleanTitle}" (${category} cleaning service) in a luxury modern property in Doha, Qatar.`,
    cleanDesc ? `Context: ${cleanDesc}.` : "",
    "Visual style: bright, sunlit hygienic interior, polished cream travertine or marble surfaces, crisp contemporary upholstery or executive fixtures, subtle dark forest green botanical accents matching Vistara luxury branding.",
    "Include realistic professional cleaning details where natural (uniformed specialist in dark green attire or spotless modern hospitality presentation).",
    "Strict requirements: natural daylight, realistic photography, no text, no logos, no watermarks, no cartoon or illustration styles, no distorted hands.",
  ]
    .filter(Boolean)
    .join(" ");
}

export function buildCategoryImagePrompt({
  nameEn,
  descriptionEn,
}: {
  nameEn: string;
  descriptionEn: string;
}): string {
  return [
    `Photorealistic luxury editorial interior photograph representing "${nameEn}" cleaning services in Qatar.`,
    descriptionEn ? `Context: ${descriptionEn.slice(0, 200)}.` : "",
    "Bright natural sunlight, immaculate marble and neutral linen textures, subtle dark emerald green accents, hospitality-grade cleanliness, no text, no watermarks, no illustrations.",
  ]
    .filter(Boolean)
    .join(" ");
}
