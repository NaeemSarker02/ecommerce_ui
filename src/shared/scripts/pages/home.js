import { setHref } from "../core/page-links.js";
import { renderCategoryCards, hydrateMediaFrames, renderMediaMarkup, renderProductCards } from "../core/renderers.js";
import { bootstrapPage } from "../core/app.js";
import { subscribeToCustomerProfile } from "../core/customer-profile.js";
import { findCategory, getCategoryProductCounts, getProductsByCategory, resolveBannersForTenant } from "../core/store-data.js";
import { getThemePagePath, withQuery } from "../core/theme-pages.js";
import { getJson, setJson } from "../utils/storage.js";
import { setText } from "../utils/dom.js";
import { loadPageData } from "./shared-page-data.js";

const NEWSLETTER_KEY = "storefront-newsletter-signups";
let revealObserver = null;

function formatCollectionLabel(value) {
	return String(value || "")
		.replaceAll("-", " ")
		.replaceAll("_", " ")
		.replace(/\b\w/g, (letter) => letter.toUpperCase())
		.trim();
}

function setOptionalText(selector, value) {
	if (!value) {
		return;
	}

	setText(selector, value);
}

function markRevealVisible(node) {
	node.classList.add("is-visible");
}

function observeRevealNodes(root = document) {
	const nodes = [];

	if (root?.matches?.("[data-reveal]")) {
		nodes.push(root);
	}

	if (root?.querySelectorAll) {
		nodes.push(...root.querySelectorAll("[data-reveal]"));
	}

	if (!nodes.length) {
		return;
	}

	const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

	nodes.forEach((node) => {
		if (node.dataset.revealDelay) {
			node.style.setProperty("--reveal-delay", `${node.dataset.revealDelay}ms`);
		}
	});

	if (reducedMotion || !("IntersectionObserver" in window)) {
		nodes.forEach(markRevealVisible);
		return;
	}

	if (!revealObserver) {
		revealObserver = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (!entry.isIntersecting) {
						return;
					}

					markRevealVisible(entry.target);
					revealObserver?.unobserve(entry.target);
				});
			},
			{
				threshold: 0.16,
				rootMargin: "0px 0px -10% 0px"
			}
		);
	}

	nodes.forEach((node) => {
		if (node.dataset.revealObserved === "true") {
			return;
		}

		node.dataset.revealObserved = "true";
		revealObserver.observe(node);
	});
}

function applyRevealStagger(root, selector, startDelay = 0, step = 80, effect = "rise") {
	if (!root?.querySelectorAll) {
		return;
	}

	root.querySelectorAll(selector).forEach((node, index) => {
		node.dataset.reveal = effect;
		node.dataset.revealDelay = String(startDelay + index * step);
	});

	observeRevealNodes(root);
}

function refreshHeroMotion(heroShell) {
	if (!heroShell) {
		return;
	}

	heroShell.classList.remove("is-refreshing");
	void heroShell.offsetWidth;
	heroShell.classList.add("is-refreshing");
	window.setTimeout(() => {
		heroShell.classList.remove("is-refreshing");
	}, 520);
}

function getHomeFeatureOptions(themeKey, tenant) {
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

function applyHomeSectionVisibility(homepageConfiguration = {}) {
	const sectionVisibility = homepageConfiguration.sectionVisibility || {};
	const defaults = {
		hero: true,
		categories: true,
		featured: true,
		newsletter: homepageConfiguration.showNewsletter ?? false,
		trust: true,
		support: true
	};

	Object.entries(defaults).forEach(([sectionKey, defaultValue]) => {
		const shouldShow = sectionVisibility[sectionKey] ?? defaultValue;
		document.querySelectorAll(`[data-home-section="${sectionKey}"]`).forEach((node) => {
			node.hidden = !shouldShow;
		});
	});
}

function getNewsletterContent(homepageConfiguration = {}, tenant = {}) {
	return {
		kicker: homepageConfiguration.newsletterKicker || "Stay Updated",
		title: homepageConfiguration.newsletterTitle || `Get offers and product updates from ${tenant.storeName || "this store"}.`,
		description: homepageConfiguration.newsletterDescription || "Join the store mailing list for launch drops, daily deals, and useful shopping updates.",
		buttonLabel: homepageConfiguration.newsletterButtonLabel || "Join Newsletter",
		placeholder: homepageConfiguration.newsletterPlaceholder || "Enter your email"
	};
}

function initNewsletterForm(homepageConfiguration = {}, tenant = {}) {
	const form = document.querySelector("[data-newsletter-form]");
	const emailInput = document.querySelector("[data-newsletter-email]");
	const statusNode = document.querySelector("[data-newsletter-status]");
	const content = getNewsletterContent(homepageConfiguration, tenant);

	setOptionalText("[data-newsletter-kicker]", content.kicker);
	setOptionalText("[data-newsletter-title]", content.title);
	setOptionalText("[data-newsletter-description]", content.description);
	setOptionalText("[data-newsletter-button-label]", content.buttonLabel);

	if (emailInput) {
		emailInput.placeholder = content.placeholder;
	}

	if (!form || !emailInput || !statusNode) {
		return;
	}

	const signups = getJson(NEWSLETTER_KEY, []);
	const existingSignup = signups.find((entry) => entry.tenantId === tenant.tenantId);

	if (existingSignup?.email) {
		emailInput.value = existingSignup.email;
		statusNode.dataset.tone = "success";
		statusNode.textContent = `Saved ${existingSignup.email} for ${tenant.storeName || "this store"} updates.`;
	}

	form.addEventListener("submit", (event) => {
		event.preventDefault();
		const email = String(emailInput.value || "").trim();

		if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			statusNode.dataset.tone = "warning";
			statusNode.textContent = "Enter a valid email address to save newsletter updates.";
			return;
		}

		const nextSignups = [
			...signups.filter((entry) => entry.tenantId !== tenant.tenantId),
			{
				tenantId: tenant.tenantId,
				storeName: tenant.storeName,
				email
			}
		];

		setJson(NEWSLETTER_KEY, nextSignups);
		statusNode.dataset.tone = "success";
		statusNode.textContent = `${email} saved for ${tenant.storeName || "this store"} updates.`;
	});
}

function getBannerCtaHref(banner, primaryCategory) {
  if (banner?.ctaPage === "category") {
    return withQuery("category", "category", banner.ctaCategorySlug || primaryCategory?.slug);
  }

  if (banner?.ctaPage === "search" && banner.ctaQuery) {
    return withQuery("search", "q", banner.ctaQuery);
  }

  if (banner?.ctaPage) {
    return getThemePagePath(banner.ctaPage);
  }

  return getThemePagePath("search");
}

function renderHeroDots(container, banners, activeIndex) {
  if (!container) {
    return;
  }

  if (banners.length <= 1) {
    container.hidden = true;
    container.innerHTML = "";
    return;
  }

  container.hidden = false;
  container.innerHTML = banners
		.map((banner, index) => `<button class="hero-dot" type="button" aria-label="Go to banner ${index + 1}" aria-pressed="${index === activeIndex ? "true" : "false"}" data-home-slider-dot="${index}" data-active="${index === activeIndex ? "true" : "false"}" title="${banner.title || `Banner ${index + 1}`}"></button>`)
    .join("");
}

bootstrapPage("home", async ({ tenant }) => {
	const { banners, categories, products, categoryMap } = await loadPageData();
	const homepageConfiguration = tenant.homepageConfiguration || {};
	const heroBanners = resolveBannersForTenant(banners, tenant);
	const initialBanner = heroBanners[0] || null;
	const matchedPrimaryCategory = categories.find((category) => category.slug === tenant.businessType || category.categoryId === tenant.businessType) || null;
	const primaryCategory = matchedPrimaryCategory || findCategory(categories, tenant.businessType);
	const featuredProducts = matchedPrimaryCategory ? getProductsByCategory(products, matchedPrimaryCategory.categoryId) : products;
	const themeKey = document.body.dataset.theme || tenant.themeKey || "universal-minimal";
	const categoryCounts = getCategoryProductCounts(products);
	const heroMedia = document.querySelector("[data-home-media]");
	const heroShell = document.querySelector(".home-hero-shell");
	const heroPrev = document.querySelector("[data-home-slider-prev]");
	const heroNext = document.querySelector("[data-home-slider-next]");
	const heroNav = document.querySelector("[data-home-slider-nav]");
	const heroDots = document.querySelector("[data-home-slider-dots]");
	const derivedFeaturedKicker = formatCollectionLabel(homepageConfiguration.featuredCollection);
	const featureOptions = getHomeFeatureOptions(themeKey, tenant);
	let activeBannerIndex = 0;
	let sliderTimer = null;

	applyHomeSectionVisibility(homepageConfiguration);

	document.title = `${tenant.storeName || "Storefront"} | ${initialBanner?.title || "Multi-theme ecommerce preview"}`;
	setOptionalText("[data-home-category-kicker]", homepageConfiguration.categoryKicker);
	setOptionalText("[data-home-category-title]", homepageConfiguration.categoryTitle);
	setOptionalText("[data-home-featured-kicker]", homepageConfiguration.featuredKicker || derivedFeaturedKicker);
	setOptionalText("[data-home-featured-title]", homepageConfiguration.featuredTitle);
	initNewsletterForm(homepageConfiguration, tenant);

	const renderHeroBanner = (nextIndex) => {
		if (!heroBanners.length) {
			return;
		}

		activeBannerIndex = (nextIndex + heroBanners.length) % heroBanners.length;
		const banner = heroBanners[activeBannerIndex];

		setText("[data-home-kicker]", tenant.storeName || "Storefront");
		setText("[data-home-title]", banner.title || "Featured collection");
		setText("[data-home-description]", banner.subtitle || tenant.storeDescription);
		setText("[data-home-highlight-kicker]", matchedPrimaryCategory?.name || tenant.businessType?.replaceAll("-", " ") || "Flexible commerce");
		setText("[data-home-highlight-copy]", tenant.storeDescription || `${banner.ctaLabel || "Browse"} through a reusable storefront layout powered by shared data.`);
		setText("[data-home-primary-link]", banner.ctaLabel || "Shop Now");

		if (heroMedia) {
			heroMedia.innerHTML = renderMediaMarkup({
				src: banner.imageUrl,
				alt: banner.title,
				label: banner.title,
				frameClass: "media-fill inherit-radius"
			});
			hydrateMediaFrames(heroMedia);
		}

		setHref("[data-home-primary-link]", getBannerCtaHref(banner, primaryCategory));
		renderHeroDots(heroDots, heroBanners, activeBannerIndex);
		heroShell?.setAttribute("data-active-banner", banner.bannerId || String(activeBannerIndex));
		refreshHeroMotion(heroShell);
	};

	const stopHeroAutoRotate = () => {
		if (sliderTimer) {
			window.clearInterval(sliderTimer);
			sliderTimer = null;
		}
	};

	const startHeroAutoRotate = () => {
		stopHeroAutoRotate();

		if (heroBanners.length <= 1 || document.hidden) {
			return;
		}

		sliderTimer = window.setInterval(() => {
			renderHeroBanner(activeBannerIndex + 1);
		}, 7000);
	};

	renderHeroBanner(0);

	if (heroNav) {
		heroNav.hidden = heroBanners.length <= 1;
	}

	heroPrev?.addEventListener("click", () => {
		renderHeroBanner(activeBannerIndex - 1);
		startHeroAutoRotate();
	});

	heroNext?.addEventListener("click", () => {
		renderHeroBanner(activeBannerIndex + 1);
		startHeroAutoRotate();
	});

	heroDots?.addEventListener("click", (event) => {
		const dot = event.target.closest("[data-home-slider-dot]");

		if (!dot) {
			return;
		}

		renderHeroBanner(Number(dot.getAttribute("data-home-slider-dot") || 0));
		startHeroAutoRotate();
	});

	heroShell?.addEventListener("mouseenter", stopHeroAutoRotate);
	heroShell?.addEventListener("mouseleave", startHeroAutoRotate);
	heroShell?.addEventListener("focusin", stopHeroAutoRotate);
	heroShell?.addEventListener("focusout", (event) => {
		if (heroShell.contains(event.relatedTarget)) {
			return;
		}

		startHeroAutoRotate();
	});

	document.addEventListener("visibilitychange", () => {
		if (document.hidden) {
			stopHeroAutoRotate();
			return;
		}

		startHeroAutoRotate();
	});

	startHeroAutoRotate();

	if (primaryCategory) {
		setHref("[data-home-secondary-link]", `./category.html?category=${encodeURIComponent(primaryCategory.slug)}`);
	}

	setHref("[data-home-view-all-link]", "./search.html");

	const categoryGrid = document.querySelector("[data-categories-grid]");
	const featuredGrid = document.querySelector("[data-featured-products-grid]");
	observeRevealNodes(document);
	applyRevealStagger(document, "[data-home-section=\"trust\"] .trust-card", 110, 70);
	applyRevealStagger(document, ".support-contact-card", 140, 90);
	const renderFeaturedProducts = () => {
		if (!featuredGrid) {
			return;
		}

		renderProductCards(featuredGrid, (featuredProducts.length ? featuredProducts : products).slice(0, 4), categoryMap, {
			...featureOptions,
			showQuickAdd: tenant.featureToggles?.showQuickAdd !== false && featureOptions.buttonLabel !== "View Product",
			tenant
		});

		applyRevealStagger(featuredGrid, ".product-card", 120, 90);
	};

	if (categoryGrid) {
		renderCategoryCards(categoryGrid, categories, {
			showCount: true,
			categoryCounts
		});

		applyRevealStagger(categoryGrid, ".category-card", 80, 80);
	}

	renderFeaturedProducts();
	subscribeToCustomerProfile(() => {
		renderFeaturedProducts();
	});
});
