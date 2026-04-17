import { renderProductCards } from "../core/renderers.js";
import { getQueryParam, searchProducts, sortProducts } from "../core/store-data.js";
import { bootstrapPage } from "../core/app.js";
import { subscribeToCustomerProfile } from "../core/customer-profile.js";
import { setText } from "../utils/dom.js";
import { loadPageData } from "./shared-page-data.js";

function getListingOptions(themeKey, tenant) {
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
				buttonLabel: tenant.featureToggles?.showQuickAdd === false ? "View Product" : "Add to Cart"
			};
	}
}

bootstrapPage("listing", async ({ tenant }) => {
	const { products, categoryMap } = await loadPageData();
	const query = getQueryParam("q") || "";
	const themeKey = document.body.dataset.theme || tenant.themeKey || "universal-minimal";
	const grid = document.querySelector("[data-product-grid]");
	const resultsCount = document.querySelector("[data-results-count]");
	const sortSelect = document.querySelector("[data-sort-select]");
	const listingDescription = document.querySelector("[data-listing-description]");
	const options = getListingOptions(themeKey, tenant);
	const allowQuickAdd = tenant.featureToggles?.showQuickAdd !== false;

	document.title = `${query ? `Search: ${query}` : "Shop All"} | ${tenant.storeName || "Storefront"}`;

	if (query) {
		setText("[data-listing-title]", `Results for \"${query}\"`);
		if (listingDescription) {
			listingDescription.textContent = `Browse products matching "${query}" from ${tenant.storeName || "this store"}.`;
		}
	} else if (listingDescription && !listingDescription.textContent.trim()) {
		listingDescription.textContent = tenant.storeDescription || "Browse our complete collection of products.";
	}

	const render = () => {
		const filtered = searchProducts(products, query);
		const sorted = sortProducts(filtered, sortSelect?.value || "default");

		if (resultsCount) {
			resultsCount.textContent = `Showing ${sorted.length} product${sorted.length === 1 ? "" : "s"}`;
		}

		if (grid) {
			renderProductCards(grid, sorted, categoryMap, {
				...options,
				tenant,
				showQuickAdd: allowQuickAdd && options.buttonLabel !== "View Product",
				emptyMessage: "No products matched this search."
			});
		}
	};

	sortSelect?.addEventListener("change", render);
	subscribeToCustomerProfile(() => {
		render();
	});
	render();
});
