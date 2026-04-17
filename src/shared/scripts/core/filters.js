export function bindFilterReset() {
  document.querySelectorAll("[data-filter-reset]").forEach((button) => {
    button.addEventListener("click", () => {
      const form = button.closest("form");
      if (form) {
        form.reset();
      }
    });
  });
}
