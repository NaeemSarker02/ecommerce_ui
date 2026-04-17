export function getThemePagePath(pageName) {
  return `./${pageName}.html`;
}

export function withQuery(pageName, key, value) {
  const url = new URL(getThemePagePath(pageName), window.location.href);

  if (value) {
    url.searchParams.set(key, value);
  }

  return `${url.pathname.split("/").pop()}${url.search}`;
}
