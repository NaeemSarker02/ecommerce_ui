export function formatCurrency(value, currency = "BDT", locale = "en-BD") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(value);
}
