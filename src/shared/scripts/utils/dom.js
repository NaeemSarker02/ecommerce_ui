export function qs(selector, root = document) {
  return root.querySelector(selector);
}

export function qsa(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

export function setText(selector, value, root = document) {
  qsa(selector, root).forEach((node) => {
    node.textContent = value ?? "";
  });
}

export function setAttr(selector, attribute, value, root = document) {
  qsa(selector, root).forEach((node) => {
    node.setAttribute(attribute, value);
  });
}
