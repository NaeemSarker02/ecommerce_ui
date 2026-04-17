export function syncSearchForms() {
  const params = new URLSearchParams(window.location.search);
  const query = params.get("q") || "";

  document.querySelectorAll("[data-search-form]").forEach((form) => {
    const input = form.querySelector("[data-search-input]");
    const clearButton = form.querySelector("[data-search-clear]");

    if (input instanceof HTMLInputElement) {
      input.value = query;
    }

    const syncFieldState = () => {
      const hasValue = Boolean(String(input?.value || "").trim());

      form.dataset.searchHasValue = hasValue ? "true" : "false";

      if (clearButton instanceof HTMLButtonElement) {
        clearButton.hidden = !hasValue;
      }
    };

    syncFieldState();

    input?.addEventListener("input", () => {
      syncFieldState();
    });

    input?.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") {
        return;
      }

      if (!String(input.value || "").trim()) {
        return;
      }

      event.preventDefault();
      input.value = "";
      syncFieldState();
    });

    clearButton?.addEventListener("click", () => {
      if (!(input instanceof HTMLInputElement)) {
        return;
      }

      input.value = "";
      syncFieldState();
      input.focus();

      const nextParams = new URLSearchParams(window.location.search);
      nextParams.delete("q");
      window.location.search = nextParams.toString();
    });

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
