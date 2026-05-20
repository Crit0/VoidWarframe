/* Single source of truth for primary navigation. */

export type NavItem = {
  href: string;
  label: string;
  soon?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Главная" },
  { href: "/tracker", label: "Трекер" },
  { href: "/inventory", label: "Инвентарь" },
  { href: "/wiki", label: "Вики", soon: true },
  { href: "/builder", label: "Билдер", soon: true },
  { href: "/ai", label: "AI-ассистент" },
  { href: "/files", label: "Файлы" },
];
