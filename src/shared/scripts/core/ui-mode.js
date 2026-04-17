import { getJson, setJson } from "../utils/storage.js";

const STORAGE_KEY = "storefront-ui-mode";
let basePalette = null;

function getDefaultMode() {
  const surface = parseColor(getComputedStyle(document.documentElement).getPropertyValue("--color-surface").trim());

  if (!surface) {
    return "light";
  }

  return luminance(surface) < 0.24 ? "dark" : "light";
}

function clamp(value, min = 0, max = 255) {
  return Math.min(max, Math.max(min, value));
}

function parseHex(value) {
  const normalized = value.replace("#", "").trim();

  if (normalized.length === 3) {
    return {
      r: Number.parseInt(normalized[0] + normalized[0], 16),
      g: Number.parseInt(normalized[1] + normalized[1], 16),
      b: Number.parseInt(normalized[2] + normalized[2], 16)
    };
  }

  if (normalized.length === 6) {
    return {
      r: Number.parseInt(normalized.slice(0, 2), 16),
      g: Number.parseInt(normalized.slice(2, 4), 16),
      b: Number.parseInt(normalized.slice(4, 6), 16)
    };
  }

  return null;
}

function parseRgb(value) {
  const match = value.match(/rgba?\(([^)]+)\)/i);

  if (!match) {
    return null;
  }

  const [r, g, b] = match[1]
    .split(/[\s,\/]+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((item) => Number.parseFloat(item));

  if ([r, g, b].some((item) => Number.isNaN(item))) {
    return null;
  }

  return { r, g, b };
}

function parseColor(value) {
  if (!value) {
    return null;
  }

  return value.trim().startsWith("#") ? parseHex(value) : parseRgb(value);
}

function toRgbString(color) {
  return `rgb(${Math.round(color.r)} ${Math.round(color.g)} ${Math.round(color.b)})`;
}

function mix(left, right, weight = 0.5) {
  return {
    r: clamp(left.r * (1 - weight) + right.r * weight),
    g: clamp(left.g * (1 - weight) + right.g * weight),
    b: clamp(left.b * (1 - weight) + right.b * weight)
  };
}

function luminance(color) {
  const convert = (channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * convert(color.r) + 0.7152 * convert(color.g) + 0.0722 * convert(color.b);
}

function ensureReadableBrand(color, mode) {
  const white = { r: 255, g: 255, b: 255 };
  const black = { r: 15, g: 23, b: 42 };
  const tone = luminance(color);

  if (mode === "dark" && tone < 0.32) {
    return mix(color, white, 0.34);
  }

  if (mode === "light" && tone > 0.62) {
    return mix(color, black, 0.28);
  }

  return color;
}

function readCssVariable(root, name) {
  return getComputedStyle(root).getPropertyValue(name).trim();
}

function captureBasePalette(root) {
  if (basePalette) {
    return basePalette;
  }

  basePalette = {
    brand: readCssVariable(root, "--color-brand") || "#0f172a",
    brandStrong: readCssVariable(root, "--color-brand-strong") || "#020617",
    accent: readCssVariable(root, "--color-accent") || "#0ea5e9",
    shadowCard: readCssVariable(root, "--shadow-card") || "0 20px 45px rgba(15, 23, 42, 0.08)"
  };

  return basePalette;
}

function buildPalette(mode, root) {
  const base = captureBasePalette(root);
  const brand = parseColor(base.brand) || { r: 15, g: 23, b: 42 };
  const brandStrong = parseColor(base.brandStrong) || brand;
  const accent = parseColor(base.accent) || brand;

  if (mode === "dark") {
    return {
      "--color-surface": "rgb(8 13 24)",
      "--color-surface-elevated": "rgb(15 23 42)",
      "--color-text": "rgb(234 241 251)",
      "--color-text-muted": "rgb(154 169 190)",
      "--color-border": "rgb(48 62 86)",
      "--color-footer-bg": "rgb(4 9 18)",
      "--color-footer-text": "rgb(242 247 252)",
      "--color-footer-muted": "rgb(178 193 214)",
      "--color-brand": toRgbString(ensureReadableBrand(mix(brand, accent, 0.18), "dark")),
      "--color-brand-strong": toRgbString(ensureReadableBrand(mix(brandStrong, brand, 0.18), "dark")),
      "--color-accent": toRgbString(ensureReadableBrand(accent, "dark")),
      "--shadow-card": "0 28px 62px rgba(2, 6, 23, 0.42)"
    };
  }

  return {
    "--color-surface": "rgb(248 250 252)",
    "--color-surface-elevated": "rgb(255 255 255)",
    "--color-text": "rgb(15 23 42)",
    "--color-text-muted": "rgb(100 116 139)",
    "--color-border": "rgb(226 232 240)",
    "--color-footer-bg": toRgbString(mix(brandStrong, { r: 2, g: 6, b: 23 }, 0.32)),
    "--color-footer-text": "rgb(248 250 252)",
    "--color-footer-muted": "rgb(203 213 225)",
    "--color-brand": toRgbString(ensureReadableBrand(brand, "light")),
    "--color-brand-strong": toRgbString(ensureReadableBrand(brandStrong, "light")),
    "--color-accent": toRgbString(accent),
    "--shadow-card": base.shadowCard
  };
}

function updateToggleLabels(mode) {
  document.querySelectorAll("[data-ui-mode-label]").forEach((node) => {
    node.textContent = mode === "dark" ? "Dark" : "Light";
  });

  document.querySelectorAll("[data-ui-mode-toggle]").forEach((node) => {
    const nextMode = mode === "dark" ? "light" : "dark";
    node.setAttribute("title", `Switch to ${nextMode} mode`);
    node.setAttribute("aria-label", `Switch to ${nextMode} mode`);
  });
}

function clearUiOverrides(root) {
  [
    "--color-surface",
    "--color-surface-elevated",
    "--color-text",
    "--color-text-muted",
    "--color-border",
    "--color-footer-bg",
    "--color-footer-text",
    "--color-footer-muted",
    "--color-brand",
    "--color-brand-strong",
    "--color-accent",
    "--shadow-card"
  ].forEach((key) => {
    root.style.removeProperty(key);
  });

  document.body.style.removeProperty("background");
  document.body.style.removeProperty("color");
}

function applyUiMode(mode, defaultMode) {
  const root = document.documentElement;
  const isDefaultMode = mode === defaultMode;

  if (isDefaultMode) {
    clearUiOverrides(root);
  } else {
    const palette = buildPalette(mode, root);

    Object.entries(palette).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    document.body.style.background = "var(--color-surface)";
    document.body.style.color = "var(--color-text)";
  }

  root.dataset.uiMode = mode;
  root.style.colorScheme = mode;
  updateToggleLabels(mode);
  setJson(STORAGE_KEY, mode);
}

function resolveInitialMode(defaultMode) {
  const savedMode = getJson(STORAGE_KEY, null);

  if (savedMode === "light" || savedMode === "dark") {
    return savedMode;
  }

  return defaultMode;
}

export function initUiMode() {
  const toggles = Array.from(document.querySelectorAll("[data-ui-mode-toggle]"));

  if (!toggles.length) {
    return;
  }

  const defaultMode = getDefaultMode();
  const mode = resolveInitialMode(defaultMode);
  applyUiMode(mode, defaultMode);

  toggles.forEach((toggle) => {
    if (toggle.dataset.uiModeReady === "true") {
      return;
    }

    toggle.dataset.uiModeReady = "true";
    toggle.addEventListener("click", () => {
      const current = document.documentElement.dataset.uiMode === "dark" ? "dark" : "light";
      applyUiMode(current === "dark" ? "light" : "dark", defaultMode);
    });
  });
}
