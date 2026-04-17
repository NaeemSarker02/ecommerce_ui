const PREVIEW_THEMES = [
  {
    key: "universal-minimal",
    name: "Universal Minimal"
  },
  {
    key: "tech-electronics",
    name: "Tech and Electronics"
  },
  {
    key: "fashion-lifestyle",
    name: "Fashion and Lifestyle"
  },
  {
    key: "daily-essentials",
    name: "Daily Essentials and Care"
  }
];

function getThemePageUrl(themeKey) {
  const url = new URL(window.location.href);
  const match = url.pathname.match(/^(.*\/themes\/)([^/]+)(\/pages\/[^/?#]+)$/);

  if (!match) {
    return null;
  }

  url.pathname = `${match[1]}${themeKey}${match[3]}`;
  return `${url.pathname}${url.search}${url.hash}`;
}

export function initPreviewThemeSwitcher() {
  const switchers = Array.from(document.querySelectorAll("[data-theme-switcher]"));

  if (!switchers.length) {
    return;
  }

  const currentTheme = document.body.dataset.theme || "universal-minimal";

  switchers.forEach((switcher) => {
    if (!switcher.dataset.ready) {
      switcher.innerHTML = PREVIEW_THEMES.map((theme) => {
        return `<option value="${theme.key}">${theme.name}</option>`;
      }).join("");
      switcher.dataset.ready = "true";
    }

    switcher.value = currentTheme;
    switcher.addEventListener("change", () => {
      if (!switcher.value || switcher.value === currentTheme) {
        return;
      }

      const nextUrl = getThemePageUrl(switcher.value);

      if (!nextUrl) {
        return;
      }

      window.location.assign(nextUrl);
    });
  });
}
