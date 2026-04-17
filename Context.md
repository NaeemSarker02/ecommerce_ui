# Context: SaaS Multi-Theme Storefront

## Purpose

This document defines the implementation blueprint for turning the current ZedSale storefront architecture into a SaaS ecommerce platform with multiple selectable storefront themes.

The goal is to keep one shared ecommerce engine while allowing different customers to choose a theme that matches their business type. Themes may change visual style, layout composition, content emphasis, and section ordering, but they must not change the core data model, route structure, or business logic.

This is a structural and product-planning document, not a visual clone of the current storefront.

## Reference Preservation Directive

For this project, the ZedSale storefront is not just inspiration. It is the base functional reference.

That means any new theme, template, or UI variation must keep the core public-store structure, key modules, and major interaction patterns of the reference storefront.

Visual improvements are allowed.
Layout polish is allowed.
Modernized UI treatment is allowed.
Extra UX enhancements are allowed.

But the following rule is mandatory:

- Preserve the original storefront shell first
- Preserve the original conversion flow second
- Preserve the original content hierarchy third
- Only then add enhancements where they improve clarity, responsiveness, or usability

This means the implementation direction is:

- Match core architecture first
- Improve presentation second
- Never redesign away the reference store's main blocks or main journey

## Instruction To Self For Future Implementation

When building any new theme or module in this repository:

- Do not start from a blank ecommerce layout pattern
- Start from the ZedSale reference structure already observed in this document
- Treat the reference store's public shell as the baseline contract
- If adding a new block, make sure it does not remove or weaken a reference block
- If changing layout, keep the same content purpose and interaction outcome
- If a new design idea conflicts with the reference conversion flow, reject the new idea
- Build module by module, not page by page in one large pass
- Complete and validate one shared module before moving to the next one

## Reference Storefront Summary

Reference site: https://zedsale.bearcavepro.com/

Observed public page archetypes:
- Home: /
- Search or catalog: /search
- Category listing: /category/:id
- Product detail: /product/:id

Observed shared modules across public pages:
- Top announcement strip with WhatsApp ordering prompt
- Promotional hero or page heading
- Category discovery links
- Product-card grid
- Trust badges or credibility blocks
- Contact or help block
- Footer quick links
- Social links
- WhatsApp-assisted conversion CTA

Observed product and conversion patterns:
- Category-first discovery
- Product cards with price, title, category label, and purchase CTA
- Category and search pages using a shared listing pattern
- Product detail page emphasizing price, SKU, trust cues, and WhatsApp ordering
- Footer and support blocks repeated across route types

Observed concrete shell details from the reference storefront:
- A narrow top strip above the header with the message `Order via WhatsApp: +8801303997358`
- A main header/navigation area with brand identity and fast actions
- Homepage hero banner with exactly two primary navigation outcomes: shop/search path and category-browse path
- A `Shop by Category` section using category cards with image/icon, name, and item count
- A `Latest Products` section using product cards with image, category label, product name, price, discount price when relevant, and add-to-cart action
- A trust/info band between product discovery and footer-style support areas
- A `Need help? Get in touch` support/contact block before the footer
- A footer that repeats categories, contact details, quick links, store identity, and social links

Observed category page details from the reference storefront:
- Category title at the top
- Category description under the title
- Results count
- Sort control
- Product grid using the same card contract as the search page
- Support/contact area and footer repeated after listing content

Observed product page details from the reference storefront:
- Breadcrumb or additional links back to Home and Category
- Product title
- SKU line
- Price and unit label
- Main product image/media
- Add to Cart action
- Order via WhatsApp action with product-specific prefilled message
- Trust badges such as `Authentic`, `Fast Reply`, and `Trusted`
- Support/contact area and footer repeated after the product content

## Non-Removable Reference Modules

The following blocks must be retained in the new theme system whenever the storefront is trying to match the ZedSale core architecture:

- Top WhatsApp announcement strip
- Main header and navigation shell
- Search/shop-all access
- Category discovery section on home
- Latest products section on home
- Add-to-cart path from product cards and product detail page
- WhatsApp-assisted order CTA
- Trust and assurance messaging
- Support/contact section before footer
- Footer with quick links, categories, contact, store info, and social links

These modules can be visually improved, rearranged slightly, or made more responsive, but they should not be removed from the base experience.

## Product Goal

Build a multi-tenant SaaS storefront system where:
- Each tenant uses the same backend and core commerce rules
- Each tenant can select a storefront theme based on business type
- Themes remain compatible with the same routes, product data, category data, and conversion flows
- Tenant branding can override selected theme basics such as logo, colors, contact info, and social links
- New themes can be added later without rewriting the core storefront engine

## Scope Boundaries

In scope:
- Multi-theme storefront architecture
- Shared page archetypes and component contracts
- Theme system rules and token boundaries
- Tenant-level theme selection and branding overrides
- Four initial base themes aligned to business types

Out of scope for the current phase:
- End-user drag-and-drop theme builder
- Deep tenant-level layout editor
- Native mobile apps
- Marketplace for third-party themes
- Redesign of private admin workflows unless required later

## Core Architecture Principle

The system must be split into two layers:

1. Fixed platform layer
This is the stable ecommerce engine shared by every tenant and every theme.

2. Themeable presentation layer
This is the visual and layout layer that changes by theme while consuming the same underlying data and route contracts.

## Fixed Platform Layer

### Public Route Map

Required public routes:
- /
- /search
- /category/:id
- /product/:id

Optional future public routes:
- /cart
- /checkout
- /account
- /faq
- /about
- /contact

Route behavior rules:
- Home remains the marketing and discovery entry point
- Search remains the global catalog discovery surface
- Category pages remain filtered views of the same product dataset
- Product pages remain the detailed commerce view for a single product
- Theme selection must not create route fragmentation or theme-specific route logic

### Shared Data Entities

#### Tenant
Fields should include:
- tenantId
- storeName
- storeDescription
- businessType
- themeKey
- logoUrl
- faviconUrl
- primaryColor
- secondaryColor
- accentColor
- announcementBar
- checkoutPreferences
- contactPhone
- contactEmail
- whatsappNumber
- address
- socialLinks
- homepageConfiguration
- featureToggles

Announcement bar should support:
- id
- tone
- badgeLabel
- text
- linkLabel
- linkHref
- secondaryLinkLabel
- secondaryLinkHref
- dismissible

Checkout preferences should support:
- deliveryZones
- paymentMethods
- deliveryWindows

Delivery zone options should use a stable internal `value` plus tenant-facing `label` so shared checkout rules can target canonical zone keys while each storefront keeps its own wording.
- guidance.profileNote
- guidance.cartNote
- guidance.checkoutHint
- validationRules.minimumOrderAmount
- validationRules.paymentMethodRules[].allowedZones
- validationRules.paymentMethodRules[].blockedZones
- validationRules.paymentMethodRules[].minimumOrderAmount
- validationRules.paymentMethodRules[].message
- validationRules.paymentMethodRules[].zoneRequiredMessage

#### Product
Fields should include:
- productId
- sku
- slug
- name
- shortDescription
- longDescription
- categoryId
- subcategoryIds
- basePrice
- salePrice
- currency
- stockStatus
- stockCount
- brand
- images
- badges
- ratingSummary
- attributes
- checkoutRules
- variants
- unitLabel
- seoData

Product checkout rules may include:
- pickupOnly
- requiresDeliveryWindow
- allowedDeliveryZones
- blockedDeliveryZones
- blockedPaymentMethods
- allowedPaymentMethods
- message

#### Category
Fields should include:
- categoryId
- slug
- name
- description
- imageUrl
- icon
- parentCategoryId
- displayOrder
- seoData

#### Cart
Fields should include:
- cartId
- tenantId
- customerId
- items
- subtotal
- discountTotal
- shippingTotal
- taxTotal
- grandTotal
- appliedCoupons

#### Order
Fields should include:
- orderId
- tenantId
- customerId
- items
- pricingBreakdown
- paymentStatus
- fulfillmentStatus
- shippingAddress
- billingAddress
- contactChannels
- createdAt

#### Customer
Fields should include:
- customerId
- name
- email
- phone
- savedAddresses
- orderHistory
- preferences
- authState

Lightweight storefront profile preferences should support:
- deliveryZone
- deliveryWindow
- paymentPreference
- checkoutNote

### Shared Business Rules

These rules must remain theme-agnostic:
- Pricing and discount calculation
- Inventory and stock-status handling
- Search, sorting, and filtering behavior
- Cart add, remove, and quantity update logic
- Order creation and order-status lifecycle
- Customer auth and session behavior
- WhatsApp message generation rules
- Category and product routing resolution

### Shared Interaction Flows

#### Discovery Flow
- User lands on home page
- User browses categories, banners, featured products, or search
- User moves to search or category listing
- User opens product detail page

#### Purchase Flow
- User reviews product details
- User adds to cart or uses direct order action
- User continues through cart or uses WhatsApp-assisted purchase flow

#### Support Flow
- User sees persistent contact/help sections
- User opens WhatsApp, phone, or email channel from product or footer areas

#### Theme Selection Flow
- Tenant chooses a base theme in admin or tenant settings
- Theme key is resolved at storefront runtime
- Same data and routes are rendered using a different presentation layer

## Reference Match Rules

When building a new theme meant to stay compatible with the ZedSale storefront, the following matching rules apply:

### Structure Match Rules

- Keep the top announcement strip above the main header
- Keep a navigation shell with logo, brand, primary links, search access, profile/account access when enabled, cart access, and WhatsApp shortcut
- Keep the home page order centered around hero, categories, latest products, trust/info, help/contact, and footer
- Keep listing and category pages as dense browsing surfaces, not marketing-first landing pages
- Keep the product page as a purchase-focused layout, not a storytelling-first layout

### Interaction Match Rules

- Search must still lead to the shop-all or listing experience
- Category cards must still lead to category listing pages
- Product cards must still lead to product detail pages
- Product cards and product pages must keep add-to-cart actions
- Product pages must keep WhatsApp order action with product-specific message data
- Listing pages must keep result counts and sort controls
- Trust signals must remain visible in the purchase journey

### Enhancement Rules

These are allowed as long as the reference flow remains intact:

- Dark and light mode toggle
- Better responsive header behavior
- Cleaner icon system
- Better hover states and motion
- Improved spacing and typography
- Enhanced filter UX
- Better empty states
- Better gallery behavior
- Improved product badges and stock states

These should be treated as enhancement layers, not replacements for the reference structure.

## Page Archetypes

Every theme must implement the same four public page archetypes.

### Home Page

Purpose:
- Introduce the store
- Highlight promotions
- Drive category discovery
- Push users toward products and conversion

Required content slots:
- Top WhatsApp announcement strip
- Header and primary navigation
- Hero or promotional banner
- Category discovery section
- Featured or latest products section
- Divider, trust strip, or information band between product discovery and support area
- Trust or credibility section
- Support or contact CTA section
- Footer with quick links and social links

Optional content slots:
- Newsletter signup
- Collection highlights
- Best seller block
- Seasonal banner
- FAQ teaser

Primary interactions:
- Open category page
- Open search or shop-all view
- Open product detail page
- Open WhatsApp or support channel

Reference-critical home page composition:
- Small top strip with WhatsApp order line
- Main navigation shell
- Hero banner with two CTA buttons
- `Shop by Category` section
- `Latest Products` section
- A visual divider, strip, or info band after products
- `Need help? Get in touch` support block
- Footer info area

### Search or Catalog Page

Purpose:
- Browse the full product inventory
- Filter and sort products
- Compare products quickly

Required content slots:
- Top WhatsApp announcement strip
- Header and navigation
- Page title or intro block
- Filter and sort controls
- Results count
- Product grid or list
- Pagination or load-more pattern
- Footer

Optional content slots:
- Trust strip
- Empty-state guidance
- Recently viewed products

Primary interactions:
- Apply filters
- Change sort order
- Open product detail page
- Quick add to cart if supported

Reference-critical listing behavior:
- The page should still feel like `Shop All`
- Product cards should remain visually consistent with category and home-product modules
- Listing content should remain the main focus above support/footer areas

### Category Listing Page

Purpose:
- Browse a specific category or subcategory
- Narrow a product set within a known merchandising context

Required content slots:
- Top WhatsApp announcement strip
- Header and navigation
- Category heading and optional breadcrumb
- Category description
- Optional subcategory links
- Filter and sort controls
- Results count
- Product grid or list
- Pagination or load-more pattern
- Footer

Optional content slots:
- Category description
- Category banner
- Related categories
- Mid-page promotional insert

Primary interactions:
- Change filters or sort order
- Move to sibling or child categories
- Open product detail page

Reference-critical category behavior:
- Preserve the category title plus description block
- Preserve result count and sort
- Use the same product card system as the search page

### Product Detail Page

Purpose:
- Present the full product information needed for purchase
- Drive add-to-cart or WhatsApp-assisted ordering

Required content slots:
- Top WhatsApp announcement strip
- Header and navigation
- Breadcrumb or context path
- Product media gallery
- Product info stack
- SKU line
- Price and stock block
- Unit label if available
- Main CTA stack
- Trust or assurance block
- Related products
- Footer

Optional content slots:
- Reviews
- Specifications accordion
- Variant selectors
- FAQ block
- Delivery and returns block
- Brand story block

Primary interactions:
- Select variant
- Change quantity
- Add to cart
- Open WhatsApp order path
- Open related product

Reference-critical product behavior:
- Keep breadcrumb or additional navigation links back to Home and Category
- Keep SKU visible near the title/price context
- Keep add-to-cart and WhatsApp CTA together in the main action area
- Keep a small trust badge cluster near the product information area

## Shared Component Contracts

These components should be implemented once at the contract level, then themed visually.

### Header and Navigation
Shared contract:
- Top announcement strip above the main header
- Logo
- Store name
- Navigation links
- Search trigger or search field
- Profile or account entry point
- Theme toggle or quick-display mode toggle if enabled
- Cart indicator
- WhatsApp shortcut
- Account entry point if enabled

Themeable properties:
- Sticky vs non-sticky behavior
- Menu density
- Background treatment
- Logo scale
- Search field prominence
- Mobile navigation pattern

Reference-preservation rule:
- The top strip and the action-heavy main header must remain part of the shared shell contract

### Hero or Page Heading
Shared contract:
- Title
- Subtitle
- Background media or illustration
- Primary CTA
- Secondary CTA

Themeable properties:
- Full-width vs contained
- Text-left vs centered
- Split layout vs overlay layout
- Background tone and depth
- CTA emphasis

Reference-preservation rule:
- Home hero should keep two clear CTA outcomes matching the reference store's shop-now and browse-category behavior

### Category Discovery Block
Shared contract:
- Category image or icon
- Category name
- Optional item count
- Link to category

Themeable properties:
- Tile size
- Grid vs carousel vs horizontal chips
- Icon-first vs image-first
- Count visibility

Reference-preservation rule:
- On the home page this should remain a dedicated `Shop by Category` module, not be merged into another block

### Product Card
Shared contract:
- Product image
- Category label
- Product title
- Short description where the theme supports it
- Price block
- Offer or compare price when available
- Optional sale badge
- Stock or trust badge
- Link to product detail
- Add-to-cart action

Themeable properties:
- Image aspect ratio
- Card density
- Hover behavior
- Badge treatment
- CTA placement
- Metadata visibility

Reference-preservation rule:
- Home, listing, and category pages should all keep a recognizable product-card structure aligned with the reference storefront

### Product Grid
Shared contract:
- Product collection
- Grid/list toggle if supported
- Sort controls
- Result count display
- Pagination or load-more handling

Themeable properties:
- Columns per breakpoint
- Gap scale
- Skeleton loading style
- Empty-state design

### Filter Panel
Shared contract:
- Category filters
- Attribute filters
- Price filters
- Rating or trust filters if supported
- Active filter state
- Reset action

Themeable properties:
- Sidebar vs top-bar
- Collapsible vs always visible
- Chip style vs checklist style
- Mobile sheet behavior

### Trust Block
Shared contract:
- Badge icon
- Badge title
- Short message

Themeable properties:
- Inline strip vs grid
- Icon style
- Visual prominence
- Background contrast

### Contact and WhatsApp Block
Shared contract:
- WhatsApp number
- Phone number
- Email
- Help text
- CTA link pattern

Themeable properties:
- Floating vs inline CTA
- Text-heavy vs button-heavy presentation
- Placement near product CTA vs footer-only support

Reference-preservation rule:
- The support/help block before the footer should remain present across home, listing, category, and product pages

### Footer
Shared contract:
- Quick links
- Category links
- Contact info
- Social links
- Legal or copyright info

Themeable properties:
- Column count
- Link grouping
- Background tone
- Brand summary placement

Reference-preservation rule:
- Footer should continue to expose categories, contact, quick links, store identity, and social links in one combined support/navigation area

## Themeability Model

### What Must Stay Fixed

These elements must remain shared across all themes:
- Route structure
- Product, category, tenant, cart, order, and customer schemas
- Search and filter logic
- Pricing and stock logic
- Cart and conversion logic
- WhatsApp order-link generation rules
- API response shapes used by the storefront
- Shared component data contracts

### What Themes May Change

These elements may vary by theme:
- Page composition and section order
- Grid density
- Typography system
- Color palette
- Shape language
- Shadow and border treatment
- Hero layout
- Product-card presentation
- CTA hierarchy and visual intensity
- Footer grouping
- Marketing tone and merchandising emphasis

### Design Token Categories

Every theme should define:
- Color tokens
- Typography tokens
- Spacing tokens
- Radius tokens
- Shadow tokens
- Border tokens
- Button variants
- Badge variants
- Form control variants
- Motion and transition tokens
- Section spacing presets
- Grid and breakpoint rules

### Tenant-Level Overrides

Tenant configuration should be able to override:
- Logo and favicon
- Primary and accent colors
- Contact info
- Social links
- Homepage section toggles
- Featured collection IDs
- Business-type metadata
- Support messaging

Tenant configuration should not override:
- Shared route behavior
- Product schema
- Search logic
- Cart logic
- Core component contracts

## Recommended Theme System Architecture

This project should be implemented as a modern multi-page frontend using HTML5, Tailwind CSS, and vanilla JavaScript with ES modules.

### Chosen Frontend Stack

- HTML5 for page templates and semantic structure
- Tailwind CSS v4 for utility styling, tokens, layout primitives, and fast theming
- Vanilla JavaScript with ES modules for interactions, state helpers, and page logic
- Vite for development server, bundling, multi-page builds, and faster local iteration
- PostCSS and Autoprefixer through the Tailwind and Vite workflow
- Lightweight HTML partial composition during development so shared headers, footers, cards, and sections can be updated once and reused across themes

### Why This Stack Fits the Project

- HTML keeps the output simple and portable for storefront templates
- Tailwind makes it easier to create multiple visual systems without writing large duplicated CSS files
- Vanilla JavaScript keeps interactions lightweight and avoids framework overhead for template-driven storefronts
- Vite keeps development fast and makes multi-page template previews easier to manage
- Partial-based template composition reduces duplication and makes global updates easier across all themes

### Development Principles

- Keep one shared core for data contracts, interactions, and route assumptions
- Keep theme logic in presentation files only, not inside business behavior modules
- Do not introduce frontend frameworks such as React, Vue, Angular, Svelte, Next.js, or Nuxt into this project
- Keep the storefront as a multi-page HTML + Tailwind + vanilla JavaScript ES module implementation
- Keep repeated markup in partials or shared components, not duplicated page by page
- Keep repeated class combinations in component-layer CSS utilities where Tailwind class strings become too long or repeated
- Keep tenant branding and theme selection data outside HTML page markup
- Keep page files focused on composition and section order, not embedded logic
- Avoid inline CSS and inline JavaScript in template files
- Use one file per major responsibility so future edits remain localized
- Preserve the reference storefront shell before introducing new design ideas
- If a new theme block does not map to a reference need, treat it as optional enhancement only
- Avoid replacing reference modules with abstract landing-page patterns that reduce conversion clarity

### Recommended Folder and File Structure

```text
ecommerce tamplate/
	Context.md
	plan.md
	promt.md
	package.json
	vite.config.js
	postcss.config.js
	src/
		data/
			tenants/
				default.json
				demo-electronics.json
				demo-fashion.json
			products/
				products.json
			categories/
				categories.json
			banners/
				banners.json
		shared/
			partials/
				head.html
				header.html
				footer.html
				mobile-menu.html
				trust-strip.html
				whatsapp-cta.html
				breadcrumb.html
			components/
				product-card.html
				category-card.html
				filter-group.html
				button.html
				badge.html
				section-heading.html
			layouts/
				storefront-shell.html
			scripts/
				core/
					app.js
					cart.js
					search.js
					filters.js
					whatsapp.js
					theme-loader.js
					tenant-loader.js
				pages/
					home.js
					listing.js
					category.js
					product.js
				utils/
					dom.js
					currency.js
					storage.js
					events.js
			styles/
				app.css
				base.css
				components.css
				utilities.css
				tokens.css
		themes/
			universal-minimal/
				tokens.css
				theme.css
				sections/
					hero.html
					category-grid.html
					featured-products.html
					trust-block.html
				pages/
					index.html
					search.html
					category.html
					product.html
			tech-electronics/
				tokens.css
				theme.css
				sections/
					hero.html
					category-grid.html
					featured-products.html
					trust-block.html
				pages/
					index.html
					search.html
					category.html
					product.html
			fashion-lifestyle/
				tokens.css
				theme.css
				sections/
					hero.html
					category-grid.html
					featured-products.html
					trust-block.html
				pages/
					index.html
					search.html
					category.html
					product.html
			daily-essentials/
				tokens.css
				theme.css
				sections/
					hero.html
					category-grid.html
					featured-products.html
					trust-block.html
				pages/
					index.html
					search.html
					category.html
					product.html
		tenant-config/
			themes.json
			business-types.json
			section-presets.json
			branding-defaults.json
		public/
			images/
			icons/
			fonts/
```

### Folder Responsibility Map

#### src/shared/
Contains everything reused by all themes.

Use this folder for:
- Global layout shell
- Shared HTML partials
- Shared component markup contracts
- Shared JavaScript logic
- Global Tailwind entry styles and utility layers

Do not put theme-specific colors, spacing decisions, or homepage ordering rules here.

#### src/themes/
Contains the visual and page-composition layer for each theme.

Use this folder for:
- Theme tokens
- Theme-specific page composition
- Section ordering
- Theme-specific section markup when the layout genuinely differs
- Theme-specific CSS overrides

Do not duplicate shared JS business logic inside theme folders.

#### src/data/
Contains mock or preview data for local template development.

Use this folder for:
- Product preview data
- Category preview data
- Demo tenants
- Demo banners and section content

#### tenant-config/
Contains configuration that maps tenants to themes and base defaults.

Use this folder for:
- Theme keys
- Business-type presets
- Section toggles
- Brand defaults

### Tailwind Strategy

Tailwind should be used in a way that supports fast theme creation without making files hard to edit.

Rules:
- Keep shared foundational styles in src/shared/styles/app.css as the main Tailwind entry file
- Use CSS custom properties for theme tokens so each theme can swap colors and key visual decisions cleanly
- Keep global reset, typography defaults, and container rules in shared style files
- Keep repeated UI patterns in component classes when raw utility strings become duplicated across many files
- Keep theme tokens isolated inside themes/<theme>/tokens.css
- Keep visual component overrides isolated inside themes/<theme>/theme.css
- Avoid hardcoding theme-specific color classes inside shared HTML partials

Recommended token groups per theme:
- Brand colors
- Surface colors
- Text colors
- Border colors
- Button states
- Badge styles
- Radius scale
- Shadow scale
- Section spacing
- Card density
- Typography scale

### Editing and Update Rules

This project should be easy to update by editing the correct layer only.

If the change affects all themes, edit shared files.

If the change affects only one theme, edit that theme folder.

If the change affects business behavior, edit shared scripts, not page HTML.

If the change affects only branding or defaults, edit tenant-config or token files.

### What To Edit For Common Changes

Change the header globally:
- src/shared/partials/header.html

Change the footer globally:
- src/shared/partials/footer.html

Change all-theme product-card markup:
- src/shared/components/product-card.html

Change all-theme cart or filter behavior:
- src/shared/scripts/core/cart.js
- src/shared/scripts/core/filters.js

Change one theme's colors or typography:
- src/themes/<theme>/tokens.css

Change one theme's visual styling:
- src/themes/<theme>/theme.css

Change one theme's homepage order:
- src/themes/<theme>/pages/index.html

Change one theme's hero section only:
- src/themes/<theme>/sections/hero.html

Change tenant branding defaults:
- tenant-config/branding-defaults.json

Change demo product or category data:
- src/data/products/products.json
- src/data/categories/categories.json

### Naming and Maintainability Rules

- Use kebab-case for folders and file names
- Keep one section per HTML file where possible
- Keep one primary responsibility per JS file
- Keep page files as assembly files, not logic-heavy files
- Prefer shared partials before copying markup across themes
- Duplicate markup only when the structure is genuinely theme-specific
- Keep images and icons out of theme CSS where possible; reference them through clear asset paths

### Recommended Development Workflow

This workflow must now be followed as a strict phased delivery process.

Do not implement the entire new storefront in one pass.
Do not redesign the entire theme in one large patch.
Do not mix shared-shell work, listing work, product-detail work, and theme-polish work in the same uncontrolled step.

Use the phased structure below so development remains conflict-safe and easy to validate.

#### Phase 1: Tooling and Base Scaffold
- Set up Vite multi-page frontend
- Set up Tailwind CSS v4 entry file and build pipeline
- Add shared styles, scripts, and partial directories
- Add sample JSON data for products, categories, banners, and demo tenants

#### Phase 2: Shared Core Layer
- Build shared header, footer, product card, category card, trust block, and WhatsApp CTA partials
- Build shared JS modules for filters, cart, search, theme loading, and tenant loading
- Create presentation-agnostic markup contracts for listing and product pages

#### Phase 2A: Reference Shell Lock
- Build the top WhatsApp announcement strip
- Build the main header/nav shell
- Keep logo, nav items, search, profile/account entry, cart entry, and WhatsApp shortcut in the shared header contract
- Add dark/light toggle only as an enhancement, not as a replacement for any reference action
- Validate header behavior first on desktop and mobile before moving on

#### Phase 2B: Home Module Lock
- Build hero banner with two buttons
- Build `Shop by Category`
- Build `Latest Products`
- Build post-products divider or info band
- Build support/contact block
- Build footer information block
- Validate this module stack on one baseline theme before moving to another theme

#### Phase 2C: Listing Module Lock
- Build shop-all/search page shell
- Keep result count and sort control
- Reuse the same product card contract
- Validate add-to-cart and navigation behavior from listing

#### Phase 2D: Category Module Lock
- Build category title and description block
- Keep results count and sort
- Reuse listing behavior and product card contract
- Validate category navigation continuity

#### Phase 2E: Product Detail Module Lock
- Build breadcrumb or additional links
- Build title, SKU, price, unit label, media, quantity, add-to-cart, and WhatsApp CTA
- Build trust badge cluster near the main action area
- Validate WhatsApp prefilled message behavior

#### Phase 3: Base Theme First
- Implement Universal Minimal first as the fallback theme
- Use it to validate route structure, page composition, and shared components
- Confirm home, search, category, and product pages work cleanly with mock data

#### Phase 4: Add Opinionated Themes
- Build Tech and Electronics next
- Build Fashion and Lifestyle after the second theme architecture is stable
- Build Daily Essentials after component flexibility is proven

#### Phase 5: Tenant Configuration Layer
- Add tenant theme mapping
- Add branding overrides for colors, logo, social links, and contact channels
- Add homepage section toggles and curated collection controls

#### Phase 6: QA and Update Safety
- Validate responsive behavior on mobile, tablet, and desktop
- Validate that all themes still use the same business and data contracts
- Check that changing shared files updates all themes safely
- Check that theme-specific edits do not break shared scripts or markup contracts
- Check that the ZedSale core structure is still recognizable after each phase
- Check that enhancements did not remove reference actions or reference modules

### Recommended Page Development Order

Build pages in this order for smoother development:

1. Universal Minimal home page
2. Universal Minimal listing page
3. Universal Minimal category page
4. Universal Minimal product page
5. Tech and Electronics home and product pages
6. Fashion and Lifestyle home and product pages
7. Daily Essentials listing and product pages
8. Finish remaining page variants once shared gaps are identified

### Preview and Development Strategy

For easier editing, each theme should have its own preview pages during development.

Recommended preview approach:
- themes/universal-minimal/pages/index.html
- themes/tech-electronics/pages/index.html
- themes/fashion-lifestyle/pages/index.html
- themes/daily-essentials/pages/index.html

Use preview data to test:
- Long product names
- Discounted prices
- Out-of-stock items
- Large category lists
- Multiple badge combinations
- Different tenant branding combinations

### Separation Rules For Easy Updates

To keep the project easy to maintain over time:

- Shared structure lives in src/shared/
- Theme look and feel lives in src/themes/
- Demo or development content lives in src/data/
- Tenant-specific configuration lives in tenant-config/
- Static assets live in public/
- No theme should directly modify shared business logic files
- No shared component should hardcode a single theme's visual decisions

## Detailed Implementation Plan For Tailwind HTML Templates

### Build Goal

Deliver four storefront templates built with latest HTML, Tailwind CSS, and vanilla JavaScript on top of one shared component and interaction system.

### Implementation Sequence

1. Create the Vite + Tailwind project foundation
2. Create the shared partials and JS module layer
3. Build Universal Minimal as the baseline theme
4. Extract any repeated utilities or classes into shared styles
5. Add Tech and Electronics using the same core markup contracts
6. Add Fashion and Lifestyle with section and card variations
7. Add Daily Essentials with fast-buy and trust-first patterns
8. Add tenant-config driven theme resolution and branding overrides
9. Run responsive, accessibility, and update-safety checks

### Definition Of Done For The Scaffold

The scaffold is considered ready when:
- Shared partials exist for header, footer, trust block, and support CTA
- Shared JS exists for cart, search, filters, and WhatsApp behavior
- Every theme has page files for home, search, category, and product
- Every theme has its own token file and theme stylesheet
- Mock data exists to test all page archetypes
- A future developer can change one shared component or one theme file without guessing where responsibility lives

## Theme Matrix

The four base themes below must render the same routes and shared data contracts.

### Theme 1: Tech and Electronics

Target businesses:
- Electronics
- Gadgets
- Accessories
- Spec-driven catalogs

Visual direction:
- Sharp
- High contrast
- Dense information hierarchy
- Strong utility feel

#### Homepage Structure
Recommended order:
1. High-impact hero with launch or deal emphasis
2. Category grid with counts or labels
3. Best sellers or new arrivals
4. Compact trust and support strip
5. Fast access to support or WhatsApp
6. Dense footer with support links

Content emphasis:
- Specs
- Price visibility
- Availability
- Warranty or support confidence

CTA hierarchy:
- Primary: Shop now or view product
- Secondary: Browse categories
- Tertiary: Contact support or WhatsApp

Shared vs theme-specific behavior:
- Shared product and category queries
- Theme-specific compact cards, tighter spacing, stronger highlight colors, and more visible stock states

#### Listing and Search Structure
Recommended order:
1. Page heading and result count
2. Left filter panel
3. Dense multi-column product grid
4. Pagination or load more
5. Optional related categories or support strip

Content emphasis:
- Rapid comparison
- Specs or badges inside cards
- Sorting clarity

Listing behavior:
- 3 to 4 columns on desktop
- Smaller card footprint
- Strong badge and stock-status visibility

#### Category Structure
Recommended order:
1. Breadcrumb and category title
2. Subcategory chips or cards
3. Filter controls
4. Product grid
5. Related categories or cross-sell row

Content emphasis:
- Narrowing and comparison
- Clear category boundaries

#### Product Detail Structure
Recommended order:
1. Media and product info in a side-by-side layout
2. Price and primary CTA block above the fold
3. Quick specs table
4. Extended specifications accordion
5. Reviews or trust block
6. Related products
7. Persistent WhatsApp help CTA

Content emphasis:
- Price
- Availability
- Specs
- Warranty and support confidence

### Theme 2: Fashion and Lifestyle

Target businesses:
- Fashion
- Beauty
- Boutique brands
- Lifestyle retail

Visual direction:
- Editorial
- Image-led
- Spacious
- Aspirational

#### Homepage Structure
Recommended order:
1. Full-bleed hero or carousel
2. Curated collections or editorial blocks
3. Trend or category spotlight
4. Lifestyle-driven featured products
5. Brand or value story section
6. Newsletter or insider signup
7. Editorial-style footer

Content emphasis:
- Lifestyle imagery
- Collection storytelling
- Curated discovery

CTA hierarchy:
- Primary: Shop collection
- Secondary: Explore look or collection
- Tertiary: Read story or brand values

Shared vs theme-specific behavior:
- Shared product and category contracts
- Theme-specific larger imagery, softer cards, more whitespace, and stronger storytelling sections

#### Listing and Search Structure
Recommended order:
1. Minimal heading with optional mood image
2. Top-bar or toggle filters
3. Spacious product grid
4. Load-more interaction or pagination
5. Optional editorial insert or social proof

Content emphasis:
- Product imagery
- Variants like size and color where relevant
- Trend curation

Listing behavior:
- 2 to 3 columns on desktop
- Larger images
- Hover-reveal CTA or softer purchase cues

#### Category Structure
Recommended order:
1. Large category hero image
2. Visual subcategory gallery
3. Filters
4. Product grid
5. Editorial message or seasonal insert
6. Customer or social proof block

Content emphasis:
- Mood
- Collection identity
- Discovery through imagery

#### Product Detail Structure
Recommended order:
1. Large immersive gallery
2. Product title, brand, price, rating
3. Variant selectors
4. Add to bag CTA stack
5. Narrative product description
6. Materials, care, and sizing details
7. Reviews
8. Shop-the-look or related products

Content emphasis:
- Imagery
- Variants
- Review confidence
- Brand narrative

### Theme 3: Daily Essentials and Care

Target businesses:
- Grocery
- Pharmacy
- Baby care
- Household essentials
- Wellness and convenience retail

Visual direction:
- Practical
- Trust-heavy
- Fast-buy oriented
- High clarity

#### Homepage Structure
Recommended order:
1. Benefit-led promo banner
2. Quick category shortcuts
3. Flash deals or discount strip
4. Best sellers or repeat-purchase products
5. Trust and certification badges
6. Help and support CTA
7. Utility-focused footer

Content emphasis:
- Deals
- Trust
- Category speed
- Reorder and convenience

CTA hierarchy:
- Primary: Shop now or add to cart
- Secondary: Browse category
- Tertiary: Contact support or WhatsApp

Shared vs theme-specific behavior:
- Shared discovery and commerce flow
- Theme-specific quick-buy patterns, stronger offer visibility, unit-price clarity, and trust-first layout

#### Listing and Search Structure
Recommended order:
1. Search-first heading and quick filters
2. Sticky or visible filter controls
3. Compact product grid
4. Stock, discount, and delivery cues inside cards
5. Pagination or load more

Content emphasis:
- Fast comparison
- Availability
- Discounts
- Delivery confidence

Listing behavior:
- 3 to 4 columns on desktop
- Compact cards
- Inline quantity or quick-buy actions if supported

#### Category Structure
Recommended order:
1. Category title and shortcuts
2. Quick filter bar
3. Product grid
4. Frequently bought together or related row
5. Trust strip or testimonial snippet

Content emphasis:
- Speed
- Practicality
- Basket building

#### Product Detail Structure
Recommended order:
1. Functional split between image and info
2. Price and unit-label clarity
3. Quantity and add-to-cart stack
4. Delivery, stock, and certification block
5. Essential product information
6. Reviews or FAQ
7. Related or complementary products

Content emphasis:
- Price
- Unit value
- Trust and safety
- Delivery and convenience

### Theme 4: Universal Minimal

Target businesses:
- General merchants
- Mixed inventory stores
- White-label deployments
- Small retailers

Visual direction:
- Neutral
- Flexible
- Low-friction
- Easy to brand

#### Homepage Structure
Recommended order:
1. Simple hero
2. Category grid
3. Popular or recent products
4. Minimal trust or info section
5. Footer

Content emphasis:
- Utility
- Simplicity
- Flexible branding

CTA hierarchy:
- Primary: Browse products
- Secondary: View category
- Tertiary: Contact or support

Shared vs theme-specific behavior:
- Shared engine and modules
- Theme-specific restrained visual styling, simple grids, neutral defaults, and easier tenant-level color overrides

#### Listing and Search Structure
Recommended order:
1. Title and result summary
2. Simple filters
3. Clean product grid
4. Pagination or load more

Content emphasis:
- Clarity
- Speed
- Generic compatibility across business types

Listing behavior:
- 2 to 4 columns depending on breakpoint
- Standard card density
- Minimal visual ornament

#### Category Structure
Recommended order:
1. Category title and breadcrumb
2. Filters
3. Product grid
4. Pagination or related row

Content emphasis:
- Straightforward browsing
- Easy adaptation to tenant branding

#### Product Detail Structure
Recommended order:
1. Standard gallery and info split
2. Price and CTA block
3. Key details
4. Description and specifications
5. Reviews if enabled
6. Related products

Content emphasis:
- Readability
- Clear CTA
- General-purpose merchandising

## Cross-Theme Consistency Rules

These rules must hold across all themes:
- Same route map
- Same product schema
- Same category schema
- Same pricing logic
- Same search and filter logic
- Same cart and checkout assumptions
- Same WhatsApp link-generation rules
- Same tenant configuration structure

Themes may change:
- Layout ordering
- Card treatment
- Grid density
- Typography
- Color and emphasis
- Footer grouping
- CTA visual weight

Themes must not change:
- Core business logic
- API data shapes
- Commerce rules
- Route resolution logic

## Implementation Priorities

Recommended build order:
1. Lock the reference storefront shell in shared context
2. Finalize shared route and entity contracts
3. Define presentation-agnostic core components
4. Build the header/top-strip/support/footer modules first
5. Build the home-page module stack next
6. Implement Universal Minimal as the fallback theme using the locked modules
7. Implement listing and category modules using the same product-card system
8. Implement the product detail module with add-to-cart plus WhatsApp parity
9. Implement Tech and Electronics theme
10. Implement Fashion and Lifestyle theme
11. Implement Daily Essentials and Care theme
12. Add tenant theme selection and branding overrides
13. Validate all page archetypes across all themes

## Acceptance Criteria

The implementation should be considered aligned with this document when:
- Every theme renders the same four public page archetypes
- All themes use the same underlying data and business logic
- Themed layouts remain visually distinct by business profile
- Tenants can change theme and branding without engineering changes to the core engine
- Shared components are reused at the contract level rather than reimplemented as separate business components
- WhatsApp-assisted ordering remains available consistently across supported themes
- The new theme still clearly matches the ZedSale storefront's core public structure
- The top strip, main navigation shell, home hero, category section, latest products, support block, and footer remain present in the base experience
- Product detail keeps SKU, price, add-to-cart, WhatsApp CTA, and trust signals together in the purchase area

## Next Implementation Step

After this document, the next practical step is to choose the frontend implementation strategy and create the initial shared component and theme folder scaffold. Recommended first build target: Universal Minimal plus one opinionated theme to validate the architecture before completing all four themes.

## Updated Immediate Next Step

The next implementation work should now follow this order:

1. Lock and refine the shared header shell so it includes the top WhatsApp strip, logo, nav links, search, profile access, cart access, optional theme toggle, and WhatsApp shortcut
2. Lock the home page module stack so it contains hero, category discovery, latest products, divider/info band, support block, and footer in the reference-compatible order
3. Then continue listing, category, and product detail modules one by one

If future implementation starts to drift away from the reference storefront shell, return to this document and re-align before continuing.
