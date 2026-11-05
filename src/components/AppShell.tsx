"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { gregorianToSue, todayISO } from "@/lib/sue-calendar";
import { copy } from "@/lib/copy";
import { useSueStore } from "./StoreProvider";
import { GlyphScramble, AsciiVine } from "./Ascii";

const NAV = [
  { href: "/", label: copy.nav.today },
  { href: "/year", label: copy.nav.year },
  { href: "/period", label: copy.nav.period },
  { href: "/sprints", label: copy.nav.sprints },
  { href: "/tune", label: copy.nav.tune },
  { href: "/reflect", label: copy.nav.reflect },
  { href: "/research", label: copy.nav.research },
  { href: "/settings", label: copy.nav.settings },
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
    return (
      <div className="app-loading">
        <div className="text-center">
          <AsciiVine />
          <div>{copy.app.loading}</div>
        </div>
      </div>
    );
  }

  if (!state.settings.onboarded && !onboarding) {
    return (
      <div className="app-loading">
        <div className="text-center">
          <AsciiVine />
          <div>{copy.app.loading}</div>
        </div>
      </div>
    );
  }

  if (onboarding) {
    return <div className="min-h-screen">{children}</div>;
  }

  const naming = {
    preset: state.settings.naming,
    customNames: state.settings.customPeriodNames,
  };

  return (
    <div className="min-h-screen pb-24 md:pb-0">
      <header className="sticky top-0 z-20 border-b border-line/80 bg-paper/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
          <Link href="/year" className="display text-2xl tracking-[0.28em]">
            <GlyphScramble text={copy.app.name} />
          </Link>
          <nav className="hidden flex-wrap items-center gap-1 text-sm md:flex">
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
                      ? `/period/${gregorianToSue(todayISO(), naming).suePeriod ?? 1}`
                      : item.href
                  }
                  className={`chip rounded-full px-3 ${
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
              className="tap rounded-full border border-line px-3"
              onClick={() => setViewYear(state.settings.viewYear - 1)}
            >
              ←
            </button>
            <span>{state.settings.viewYear}</span>
            <button
              type="button"
              className="tap rounded-full border border-line px-3"
              onClick={() => setViewYear(state.settings.viewYear + 1)}
            >
              →
            </button>
          </div>
        </div>
      </header>
      <main
        className={
          pathname === "/year"
            ? "w-full"
            : "mx-auto w-full max-w-6xl px-5 py-8"
        }
      >
        {children}
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 gap-1 border-t border-line bg-paper/95 px-1 py-2 backdrop-blur-md md:hidden">
        {NAV.slice(0, 5).map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={
                item.href === "/period"
                  ? `/period/${gregorianToSue(todayISO(), naming).suePeriod ?? 1}`
                  : item.href
              }
              className={`flex min-h-11 items-center justify-center rounded-xl text-xs ${
                active ? "bg-ink text-paper" : "text-ink-soft"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
