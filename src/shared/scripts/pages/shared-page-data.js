import { getCategoryMap, loadStoreData } from "../core/store-data.js";

export async function loadPageData() {
  const data = await loadStoreData();
  return {
    ...data,
    categoryMap: getCategoryMap(data.categories)
  };
}
