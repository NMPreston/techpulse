"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Feed" },
  { href: "/stocks", label: "Stocks" },
  { href: "/learn", label: "Learn" },
  { href: "/research", label: "Research" },
  { href: "/saved", label: "Saved" },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 bg-zinc-900 rounded-xl p-1 mt-4">
      {TABS.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? "bg-zinc-800 text-white"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}