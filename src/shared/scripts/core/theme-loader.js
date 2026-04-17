export function applyTheme(tenant = {}) {
  const pageTheme = document.body.dataset.theme;
  const themeKey = pageTheme || tenant.themeKey || "universal-minimal";

  document.documentElement.dataset.theme = themeKey;
  document.body.dataset.theme = themeKey;

  return themeKey;
}
