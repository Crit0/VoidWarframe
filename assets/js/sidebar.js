import { t } from "./i18n.js";

let toastTimeout;

function showToast(message) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("is-visible"), 2400);
}

export function initSidebar() {
  const sidebar = document.querySelector(".sidebar");
  const burger = document.querySelector(".header__burger");
  const backdrop = document.querySelector(".sidebar__backdrop");

  const close = () => sidebar?.classList.remove("is-open");
  const open = () => sidebar?.classList.add("is-open");

  burger?.addEventListener("click", () => {
    sidebar?.classList.toggle("is-open");
  });

  backdrop?.addEventListener("click", close);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  document.querySelectorAll(".sidebar__link").forEach((link) => {
    link.addEventListener("click", (e) => {
      if (link.dataset.placeholder !== undefined) {
        e.preventDefault();
        showToast(t("nav.comingSoon"));
        close();
        return;
      }
      if (window.innerWidth <= 900) close();
    });
  });

  const path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".sidebar__link").forEach((link) => {
    const href = link.getAttribute("href");
    if (href === path) link.setAttribute("aria-current", "page");
  });
}
