"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", bn: "হোম", ic: "🏠" },
  { href: "/zikr", bn: "যিকির", ic: "📿" },
  { href: "/dua", bn: "দুআ", ic: "🤲" },
  { href: "/ilm", bn: "ইলম", ic: "📚" },
  { href: "/stats", bn: "স্ট্যাটস", ic: "📊" },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
      <div className="safe-bottom mx-auto flex max-w-lg">
        {TABS.map((t) => {
          const active = pathname === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={
                "flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition " +
                (active ? "text-emerald-600 dark:text-emerald-400" : "text-gray-500 dark:text-gray-400")
              }
            >
              <span className="text-xl leading-none">{t.ic}</span>
              {t.bn}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
