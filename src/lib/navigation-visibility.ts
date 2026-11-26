export interface NavigationVisibility {
  about: boolean;
  services: boolean;
  residential: boolean;
  commercial: boolean;
  reviews: boolean;
  faq: boolean;
  contact: boolean;
  quote: boolean;
}

export const DEFAULT_NAVIGATION_VISIBILITY: NavigationVisibility = {
  about: true,
  services: true,
  residential: true,
  commercial: true,
  reviews: true,
  faq: true,
  contact: true,
  quote: true,
};

export function normalizeNavigationVisibility(
  raw: Partial<NavigationVisibility> | null | undefined
): NavigationVisibility {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_NAVIGATION_VISIBILITY };
  }
  return {
    about: typeof raw.about === "boolean" ? raw.about : true,
    services: typeof raw.services === "boolean" ? raw.services : true,
    residential: typeof raw.residential === "boolean" ? raw.residential : true,
    commercial: typeof raw.commercial === "boolean" ? raw.commercial : true,
    reviews: typeof raw.reviews === "boolean" ? raw.reviews : true,
    faq: typeof raw.faq === "boolean" ? raw.faq : true,
    contact: typeof raw.contact === "boolean" ? raw.contact : true,
    quote: typeof raw.quote === "boolean" ? raw.quote : true,
  };
}
