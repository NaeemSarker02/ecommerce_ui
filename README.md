# Storefront Template Portal

This project is a multi-template ecommerce storefront built with plain HTML, vanilla JavaScript ES modules, Tailwind CSS, and Vite.

The root page is the only template-selection portal. Users start there, choose a template, and then enter a separated storefront. Templates are not cross-linked inside the storefront itself.

## Stack

- HTML multi-page app
- Vanilla JavaScript ES modules
- Tailwind CSS v4
- Vite
- PostCSS + Autoprefixer

## Project Structure

```text
index.html                     Root template portal
public/                        Static images, icons, fonts
src/data/                      Shared catalog, banner, and tenant JSON data
src/shared/partials/           Shared storefront UI fragments
src/shared/styles/             Shared design tokens and CSS layers
src/shared/scripts/core/       Shared storefront runtime logic
src/shared/scripts/pages/      Page-specific controllers
src/shared/scripts/config/     Portal and runtime configuration modules
src/themes/                    Separate storefront templates
tenant-config/                 Tenant-level external config
```

## Template Flow

1. Open `/`
2. Choose a business type or template from the root portal
3. Choose the starting page
4. Open the selected storefront
5. Use `Back to Templates` to return to the root selector

## Development

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Maintenance Notes

- Root portal data lives in `src/shared/scripts/config/template-portal.js`
- Portal UI behavior lives in `src/shared/scripts/pages/theme-access.js`
- Shared storefront behavior lives under `src/shared/scripts/core/`
- Each template is isolated under `src/themes/<theme-key>/`

## Cleanup Applied

- Removed unused preview-switching runtime from storefront flow
- Removed unused shared demo/layout files that were not part of the live runtime
- Kept the root portal as the only template selection entry point

