export function syncSearchForms() {
  const params = new URLSearchParams(window.location.search);
  const query = params.get("q") || "";

  document.querySelectorAll("[data-search-input]").forEach((input) => {
    input.value = query;
  });

  document.querySelectorAll("[data-search-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      const value = String(formData.get("q") || "").trim();
      const nextParams = new URLSearchParams(window.location.search);

      if (value) {
        nextParams.set("q", value);
      } else {
        nextParams.delete("q");
      }

      window.location.search = nextParams.toString();
    });
  });
}
