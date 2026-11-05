"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { YearWheel } from "@/components/YearWheel";
import { InstallHint } from "@/components/InstallHint";
import { useSueStore } from "@/components/StoreProvider";
import { copy } from "@/lib/copy";
import {
  hasEntered,
  isStandaloneDisplay,
  markEntered,
  shouldSkipLanding,
} from "@/lib/entry";

export function LandingPage() {
  const router = useRouter();
  const { state } = useSueStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function gate() {
      let native = false;
      try {
        const { Capacitor } = await import("@capacitor/core");
        native = Capacitor.isNativePlatform();
      } catch {
        /* web */
      }
      if (cancelled) return;
      if (
        shouldSkipLanding({
          standalone: isStandaloneDisplay(),
          native,
          entered: hasEntered(),
          onboarded: state.settings.onboarded,
        })
      ) {
        router.replace("/app");
        return;
      }
      setReady(true);
    }
    void gate();
    return () => {
      cancelled = true;
    };
  }, [router, state.settings.onboarded]);

  function openApp() {
    markEntered();
    router.push(state.settings.onboarded ? "/app" : "/onboarding");
  }

  if (!ready) return <div className="landing landing-wait" />;

  return (
    <div className="landing">
      <section className="landing-hero" aria-hidden="true">
        <YearWheel compact hideChrome />
      </section>

      <div className="landing-copy">
        <h1 className="display">{copy.app.name}</h1>
        <p className="landing-pitch">{copy.app.tagline}</p>
        <button type="button" className="btn-fill landing-cta" onClick={openApp}>
          {copy.landing.open}
        </button>
      </div>

      <ul className="landing-beats">
        {copy.landing.beats.map((beat) => (
          <li key={beat}>{beat}</li>
        ))}
      </ul>

      <InstallHint />

      <footer className="landing-foot">
        <p>{copy.landing.oss}</p>
        <a href="https://github.com/Sergio-Pineros/sue-calendar">{copy.landing.github}</a>
      </footer>
    </div>
  );
}
