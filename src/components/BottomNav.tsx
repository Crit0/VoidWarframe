"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav";

// Mobile bottom navigation — shows the five primary destinations.
const MOBILE_ITEMS = NAV_ITEMS.filter((i) =>
  ["/", "/tracker", "/inventory", "/ai", "/files"].includes(i.href),
);

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border-gold bg-ink/95 backdrop-blur md:hidden">
      <div className="flex">
        {MOBILE_ITEMS.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-1 py-2 font-mono text-[0.6rem] uppercase tracking-wide ${
                active ? "text-gold" : "text-text-2"
              }`}
            >
              <span className="text-base">{item.label.charAt(0)}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
