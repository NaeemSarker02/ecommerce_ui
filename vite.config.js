import { cpSync, existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";

function getHtmlInputs() {
  const themeRoot = resolve(process.cwd(), "src/themes");
  const inputs = {};
  const rootIndex = resolve(process.cwd(), "index.html");

  if (existsSync(rootIndex)) {
    inputs.home = rootIndex;
  }

  if (!existsSync(themeRoot)) {
    return inputs;
  }

  for (const themeName of readdirSync(themeRoot)) {
    const pagesDir = resolve(themeRoot, themeName, "pages");

    if (!existsSync(pagesDir)) {
      continue;
    }

    for (const pageName of readdirSync(pagesDir)) {
      if (!pageName.endsWith(".html")) {
        continue;
      }

      const entryKey = `${themeName}-${pageName.replace(".html", "")}`;
      inputs[entryKey] = resolve(pagesDir, pageName);
    }
  }

  return inputs;
}

function getRuntimeAssetCopies() {
  const themeRoot = resolve(process.cwd(), "src/themes");
  const copies = [
    {
      from: resolve(process.cwd(), "src/shared/partials"),
      to: resolve(process.cwd(), "dist/src/shared/partials")
    },
    {
      from: resolve(process.cwd(), "src/data"),
      to: resolve(process.cwd(), "dist/src/data")
    },
    {
      from: resolve(process.cwd(), "tenant-config"),
      to: resolve(process.cwd(), "dist/tenant-config")
    }
  ];

  if (!existsSync(themeRoot)) {
    return copies;
  }

  for (const themeName of readdirSync(themeRoot)) {
    const sectionsDir = resolve(themeRoot, themeName, "sections");

    if (!existsSync(sectionsDir)) {
      continue;
    }

    copies.push({
      from: sectionsDir,
      to: resolve(process.cwd(), `dist/src/themes/${themeName}/sections`)
    });
  }

  return copies;
}

function copyRuntimeAssetsPlugin() {
  return {
    name: "copy-runtime-assets",
    closeBundle() {
      for (const asset of getRuntimeAssetCopies()) {
        if (!existsSync(asset.from)) {
          continue;
        }

        cpSync(asset.from, asset.to, { recursive: true });
      }
    }
  };
}

export default defineConfig({
  publicDir: "public",
  plugins: [copyRuntimeAssetsPlugin()],
  server: {
    open: "/"
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: getHtmlInputs()
    }
  }
});
