export const STORAGE_KEY = "storefront-template-access";

export const BUSINESS_TYPES = [
  {
    key: "general-store",
    label: "General Store",
    description: "Mixed catalog with different product types.",
    recommendedTheme: "universal-minimal"
  },
  {
    key: "electronics",
    label: "Electronics",
    description: "Devices, accessories, launches, and technical products.",
    recommendedTheme: "tech-electronics"
  },
  {
    key: "fashion",
    label: "Fashion",
    description: "Apparel, beauty, curated looks, and brand storytelling.",
    recommendedTheme: "fashion-lifestyle"
  },
  {
    key: "essentials",
    label: "Essentials",
    description: "Groceries, care products, repeat purchases, and trust-heavy shopping.",
    recommendedTheme: "daily-essentials"
  }
];

export const TEMPLATE_THEMES = [
  {
    key: "universal-minimal",
    name: "Universal Minimal",
    badge: "Default",
    bestFor: "Best for general retail",
    audience: ["General store", "Multi-category catalog", "Neutral SaaS demo"],
    description: "Clean, neutral storefront for general retail and shared SaaS validation.",
    previewImage: "/images/banner-general.svg",
    previewAlt: "Universal Minimal storefront preview",
    sampleCategory: "electronics",
    sampleProduct: "iphone-17-pro-max"
  },
  {
    key: "tech-electronics",
    name: "Tech and Electronics",
    badge: "Devices",
    bestFor: "Best for electronics",
    audience: ["Gadgets", "Launch campaigns", "Specs-heavy shopping"],
    description: "Best for gadgets, launches, specifications, and compact utility-first browsing.",
    previewImage: "/images/banner-tech.svg",
    previewAlt: "Tech and Electronics storefront preview",
    sampleCategory: "electronics",
    sampleProduct: "iphone-17-pro-max"
  },
  {
    key: "fashion-lifestyle",
    name: "Fashion and Lifestyle",
    badge: "Editorial",
    bestFor: "Best for fashion",
    audience: ["Apparel", "Beauty", "Brand storytelling"],
    description: "Optimized for apparel, beauty, mood-driven content, and curated product storytelling.",
    previewImage: "/images/banner-fashion.svg",
    previewAlt: "Fashion and Lifestyle storefront preview",
    sampleCategory: "apparels",
    sampleProduct: "premium-performance-tshirt"
  },
  {
    key: "daily-essentials",
    name: "Daily Essentials",
    badge: "Fast-moving",
    bestFor: "Best for essentials",
    audience: ["Groceries", "Care products", "Repeat purchases"],
    description: "Built for essentials, refill-heavy catalogs, trust cues, and repeat purchase flow.",
    previewImage: "/images/banner-essentials.svg",
    previewAlt: "Daily Essentials storefront preview",
    sampleCategory: "baby-care",
    sampleProduct: "savlon-liquid-1l"
  }
];

export const DESTINATIONS = [
  {
    key: "home",
    label: "Home",
    description: "Storefront landing page",
    helper: "Best place to understand the full template"
  },
  {
    key: "search",
    label: "Search",
    description: "Browse all products",
    helper: "Open the full product listing"
  },
  {
    key: "category",
    label: "Category",
    description: "Open a safe sample category",
    helper: "Jump into a ready-to-browse category"
  },
  {
    key: "product",
    label: "Product",
    description: "Open a safe sample product",
    helper: "See a single product page instantly"
  },
  {
    key: "cart",
    label: "Cart",
    description: "Open the cart flow",
    helper: "Test the ordering experience"
  }
];

export const TOTAL_WIZARD_STEPS = 3;

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function findTheme(themeKey) {
  return TEMPLATE_THEMES.find((item) => item.key === themeKey) || TEMPLATE_THEMES[0];
}

export function findDestination(destinationKey) {
  return DESTINATIONS.find((item) => item.key === destinationKey) || DESTINATIONS[0];
}

export function findBusinessType(businessKey) {
  return BUSINESS_TYPES.find((item) => item.key === businessKey) || null;
}

export function buildTemplatePath(themeKey, destinationKey) {
  const theme = findTheme(themeKey);
  const base = `/src/themes/${theme.key}/pages`;

  switch (destinationKey) {
    case "search":
      return `${base}/search.html`;
    case "category":
      return `${base}/category.html?category=${encodeURIComponent(theme.sampleCategory)}`;
    case "product":
      return `${base}/product.html?product=${encodeURIComponent(theme.sampleProduct)}`;
    case "cart":
      return `${base}/cart.html`;
    default:
      return `${base}/index.html`;
  }
}