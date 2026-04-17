export function buildWhatsAppUrl(phone, message) {
  const safePhone = String(phone || "").replace(/\D/g, "");
  const safeMessage = encodeURIComponent(message || "Hi, I want to know more about this product.");
  return `https://wa.me/${safePhone}?text=${safeMessage}`;
}

export function initWhatsAppLinks(tenant) {
  const message = document.body.dataset.whatsappMessage || "Hi, I want to know more about this storefront item.";
  const url = buildWhatsAppUrl(tenant.whatsappNumber, message);

  document.querySelectorAll("[data-whatsapp-link]").forEach((node) => {
    node.setAttribute("href", url);
    node.setAttribute("target", "_blank");
    node.setAttribute("rel", "noreferrer");
  });
}
