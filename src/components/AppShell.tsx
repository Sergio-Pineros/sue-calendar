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

  function hrefFor(href: string) {
    return href === "/period"
      ? `/period/${gregorianToSue(todayISO(), naming).suePeriod ?? 1}`
      : href;
  }

  return (
    <div className="app-root">
      <header className="chrome-top">
        <div className="chrome-top-inner">
          <Link href="/year" className="display text-2xl">
            <GlyphScramble text={copy.app.name} />
          </Link>
          <nav className="chrome-desk">
            {NAV.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={hrefFor(item.href)}
                  className={active ? "is-active" : ""}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="chrome-year">
            <button type="button" onClick={() => setViewYear(state.settings.viewYear - 1)}>
              ←
            </button>
            <span>{state.settings.viewYear}</span>
            <button type="button" onClick={() => setViewYear(state.settings.viewYear + 1)}>
              →
            </button>
          </div>
        </div>
      </header>
      <main className={pathname === "/year" ? "page-year" : "page"}>
        {children}
      </main>
      <nav className="chrome-tab" aria-label="Primary">
        {NAV.slice(0, 5).map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={hrefFor(item.href)}
              className={active ? "is-active" : ""}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
