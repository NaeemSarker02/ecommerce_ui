const FALLBACK_TENANT = {
  tenantId: "tenant-default",
  storeName: "Storefront",
  storeDescription: "Multi-theme storefront scaffold.",
  themeKey: "universal-minimal",
  logoUrl: "",
  faviconUrl: "/icons/favicon-default.svg",
  primaryColor: "#111827",
  secondaryColor: "#020617",
  accentColor: "#0ea5e9",
  announcementBar: null,
  checkoutPreferences: {
    deliveryZones: [
      { value: "inside-dhaka", label: "Inside Dhaka" },
      { value: "outside-dhaka", label: "Outside Dhaka" },
      { value: "pickup", label: "Store Pickup" }
    ],
    paymentMethods: ["Cash on Delivery", "bKash", "Nagad", "Card on Delivery"],
    deliveryWindows: ["10 AM - 1 PM", "1 PM - 5 PM", "5 PM - 9 PM"],
    guidance: {
      profileNote: "Save your checkout preferences once and reuse them across future orders.",
      cartNote: "Confirm delivery timing and payment method before sending the order on WhatsApp.",
      checkoutHint: "The store will confirm delivery timing and payment instructions after reviewing your message."
    },
    validationRules: {
      minimumOrderAmount: null,
      paymentMethodRules: {}
    }
  },
  contactPhone: "+8801913539767",
  contactEmail: "hello@example.com",
  whatsappNumber: "8801303997358",
  socialLinks: {}
};

export async function loadTenantConfig() {
  const configPath = document.body.dataset.tenantConfig || "/src/data/tenants/default.json";

  try {
    const response = await fetch(configPath);

    if (!response.ok) {
      return FALLBACK_TENANT;
    }

    return {
      ...FALLBACK_TENANT,
      ...(await response.json())
    };
  } catch {
    return FALLBACK_TENANT;
  }
}
