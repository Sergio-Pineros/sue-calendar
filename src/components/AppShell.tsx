"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { gregorianToSue, todayISO } from "@/lib/sue-calendar";
import { useSueStore } from "./StoreProvider";

const NAV = [
  { href: "/", label: "Hoy" },
  { href: "/period", label: "Periodo" },
  { href: "/year", label: "Año" },
  { href: "/reflect", label: "Revisión" },
  { href: "/research", label: "Origen" },
  { href: "/settings", label: "Ajustes" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { state, setViewYear } = useSueStore();
  const onboarding = pathname.startsWith("/onboarding");
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    if (isClient && !state.settings.onboarded && !onboarding) {
      router.replace("/onboarding");
    }
  }, [isClient, onboarding, router, state.settings.onboarded]);

  if (!isClient) {
    return <div className="app-loading">SÚE</div>;
  }

  if (!state.settings.onboarded && !onboarding) {
    return <div className="app-loading">SÚE</div>;
  }

  if (onboarding) {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-line/80 bg-paper/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
          <Link href="/" className="display text-2xl tracking-[0.28em]">
            SÚE
          </Link>
          <nav className="flex flex-wrap items-center gap-1 text-sm">
            {NAV.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={
                    item.href === "/period"
                      ? `/period/${gregorianToSue(todayISO(), state.settings.naming).suePeriod ?? 1}`
                      : item.href
                  }
                  className={`rounded-full px-3 py-1.5 ${
                    active ? "bg-ink text-paper" : "text-ink-soft hover:text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2 font-mono text-xs text-ink-soft">
            <button
              type="button"
              className="rounded-full border border-line px-2 py-1"
              onClick={() => setViewYear(state.settings.viewYear - 1)}
            >
              ←
            </button>
            <span>{state.settings.viewYear}</span>
            <button
              type="button"
              className="rounded-full border border-line px-2 py-1"
              onClick={() => setViewYear(state.settings.viewYear + 1)}
            >
              →
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-5 py-8">{children}</main>
    </div>
  );
}
