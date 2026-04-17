const DATA_PATHS = {
  products: "/src/data/products/products.json",
  categories: "/src/data/categories/categories.json",
  banners: "/src/data/banners/banners.json"
};

const cache = new Map();

async function loadJson(path) {
  if (cache.has(path)) {
    return cache.get(path);
  }

  const promise = fetch(path).then(async (response) => {
    if (!response.ok) {
      throw new Error(`Failed to load ${path}`);
    }

    return response.json();
  });

  cache.set(path, promise);
  return promise;
}

export async function loadStoreData() {
  const [products, categories, banners] = await Promise.all([
    loadJson(DATA_PATHS.products),
    loadJson(DATA_PATHS.categories),
    loadJson(DATA_PATHS.banners)
  ]);

  return {
    products: [...products],
    categories: [...categories].sort((left, right) => (left.displayOrder ?? 0) - (right.displayOrder ?? 0)),
    banners
  };
}

export function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

export function getCategoryMap(categories) {
  return new Map(categories.map((category) => [category.categoryId, category]));
}

export function getCategoryProductCounts(products) {
  return products.reduce((counts, product) => {
    counts.set(product.categoryId, (counts.get(product.categoryId) || 0) + 1);
    return counts;
  }, new Map());
}

export function findCategory(categories, value) {
  return categories.find((category) => category.slug === value || category.categoryId === value) || categories[0] || null;
}

export function findProduct(products, value) {
  return products.find((product) => product.slug === value || product.productId === value) || products[0] || null;
}

export function getProductsByCategory(products, categoryId) {
  return products.filter((product) => product.categoryId === categoryId);
}

export function searchProducts(products, query) {
  const normalized = String(query || "").trim().toLowerCase();

  if (!normalized) {
    return [...products];
  }

  return products.filter((product) => {
    const haystack = [
      product.name,
      product.shortDescription,
      product.longDescription,
      product.brand,
      product.slug,
      product.categoryId
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalized);
  });
}

export function sortProducts(products, sortKey) {
  const next = [...products];

  switch (sortKey) {
    case "price-asc":
      next.sort((left, right) => (left.salePrice ?? left.basePrice) - (right.salePrice ?? right.basePrice));
      break;
    case "price-desc":
      next.sort((left, right) => (right.salePrice ?? right.basePrice) - (left.salePrice ?? left.basePrice));
      break;
    case "name":
      next.sort((left, right) => left.name.localeCompare(right.name));
      break;
    default:
      break;
  }

  return next;
}

function includesMatch(list, value) {
  return Array.isArray(list) && Boolean(value) && list.includes(value);
}

function isBannerRelevant(banner, tenant = {}) {
  if (!banner) {
    return false;
  }

  const hasThemeRules = Array.isArray(banner.themeKeys) && banner.themeKeys.length;
  const hasBusinessRules = Array.isArray(banner.businessTypes) && banner.businessTypes.length;

  if (!hasThemeRules && !hasBusinessRules) {
    return true;
  }

  return includesMatch(banner.themeKeys, tenant.themeKey) || includesMatch(banner.themeKeys, "all") || includesMatch(banner.businessTypes, tenant.businessType);
}

function scoreBanner(banner, tenant = {}) {
  let score = banner.priority ?? 0;

  if (includesMatch(banner.themeKeys, tenant.themeKey)) {
    score += 8;
  }

  if (includesMatch(banner.businessTypes, tenant.businessType)) {
    score += 5;
  }

  if (includesMatch(banner.themeKeys, "all")) {
    score += 1;
  }

  return score;
}

export function resolveBannerForTenant(banners, tenant = {}) {
  return resolveBannersForTenant(banners, tenant).at(0) || null;
}

export function resolveBannersForTenant(banners, tenant = {}) {
  if (!Array.isArray(banners) || !banners.length) {
    return [];
  }

  const relevantBanners = banners.filter((banner) => isBannerRelevant(banner, tenant));
  const source = relevantBanners.length ? relevantBanners : banners;

  return [...source]
    .sort((left, right) => scoreBanner(right, tenant) - scoreBanner(left, tenant))
    .slice(0, 4);
}
