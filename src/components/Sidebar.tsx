"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border-gold bg-panel/60 p-4 md:flex">
      <Link href="/" className="mb-8 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-md border border-border-gold bg-ink font-display text-lg font-black text-gold">
          V
        </div>
        <div className="leading-tight">
          <div className="font-display text-sm font-black tracking-[0.2em] text-text-0">
            VOIDE WARFRAME
          </div>
          <div className="font-display text-[0.6rem] tracking-[0.4em] text-gold">
            TENNO NETWORK
          </div>
        </div>
      </Link>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between rounded-md px-3 py-2 font-body text-sm transition-colors ${
                active
                  ? "bg-gold/10 text-gold"
                  : "text-text-1 hover:bg-panel-light hover:text-text-0"
              }`}
            >
              <span>{item.label}</span>
              {item.soon && (
                <span className="rounded bg-border px-1.5 py-0.5 font-mono text-[0.55rem] uppercase text-text-2">
                  скоро
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 font-mono text-[0.6rem] leading-relaxed text-text-2">
        Неофициальный фан-сайт.
        <br />
        Данные: warframestat.us
      </div>
    </aside>
  );
}
