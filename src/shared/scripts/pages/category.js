import { renderCategoryChips, renderProductCards } from "../core/renderers.js";
import { findCategory, getProductsByCategory, getQueryParam, sortProducts } from "../core/store-data.js";
import { bootstrapPage } from "../core/app.js";
import { subscribeToCustomerProfile } from "../core/customer-profile.js";
import { setText } from "../utils/dom.js";
import { loadPageData } from "./shared-page-data.js";

function getCategoryOptions(themeKey) {
  switch (themeKey) {
    case "tech-electronics":
      return {
        showDescription: false,
        compact: true,
        buttonLabel: "Add to Cart"
      };
    case "fashion-lifestyle":
      return {
        showDescription: true,
        aspectClass: "aspect-[4/5]",
        buttonLabel: "Add to Bag"
      };
    case "daily-essentials":
      return {
        showDescription: false,
        compact: true,
        buttonLabel: "Add to Basket"
      };
    default:
      return {
        showDescription: true,
        buttonLabel: "Add to Cart"
      };
  }
}

bootstrapPage("category", async ({ tenant }) => {
  const { categories, products, categoryMap } = await loadPageData();
  const category = findCategory(categories, getQueryParam("category"));
  const themeKey = document.body.dataset.theme || tenant.themeKey || "universal-minimal";
  const categoryProducts = category ? getProductsByCategory(products, category.categoryId) : [];
  const sortSelect = document.querySelector("[data-sort-select]");
  const resultsCount = document.querySelector("[data-results-count]");
  const current = document.querySelector("[data-breadcrumb-current]");
  const categoryLinks = document.querySelector("[data-category-links]");
  const grid = document.querySelector("[data-product-grid]");
  const options = getCategoryOptions(themeKey);
  const allowQuickAdd = tenant.featureToggles?.showQuickAdd !== false;

  if (!category) {
    return;
  }

  if (current) {
    current.textContent = category.name;
  }

  document.title = `${category.name} | ${tenant.storeName || "Storefront"}`;
  setText("[data-category-title]", category.name);
  setText("[data-category-description]", category.description || `Browse ${category.name.toLowerCase()} products from ${tenant.storeName || "this store"}.`);

  if (categoryLinks) {
    renderCategoryChips(categoryLinks, categories, category);
  }

  const render = () => {
    const sorted = sortProducts(categoryProducts, sortSelect?.value || "default");

    if (resultsCount) {
      resultsCount.textContent = `Showing ${sorted.length} product${sorted.length === 1 ? "" : "s"}`;
    }

    if (grid) {
      renderProductCards(grid, sorted, categoryMap, {
        ...options,
        tenant,
        showQuickAdd: allowQuickAdd,
        emptyMessage: "No products are assigned to this category yet."
      });
    }
  };

  sortSelect?.addEventListener("change", render);
  subscribeToCustomerProfile(() => {
    render();
  });
  render();
});
