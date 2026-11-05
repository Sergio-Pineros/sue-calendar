"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { copy } from "@/lib/copy";
import { isIosSafari, isStandaloneDisplay } from "@/lib/entry";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function subscribeNever() {
  return () => {};
}

export function InstallHint() {
  const standalone = useSyncExternalStore(
    subscribeNever,
    isStandaloneDisplay,
    () => false,
  );
  const ios = useSyncExternalStore(subscribeNever, isIosSafari, () => false);
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(
    null,
  );

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (standalone) return null;

  async function install() {
    if (!promptEvent) return;
    await promptEvent.prompt();
    await promptEvent.userChoice;
    setPromptEvent(null);
  }

  return (
    <section className="landing-install">
      <p className="text-sm text-ink-soft">{copy.landing.install}</p>
      {promptEvent ? (
        <button type="button" className="btn-fill landing-cta" onClick={() => void install()}>
          {copy.landing.installAction}
        </button>
      ) : ios ? (
        <p className="landing-hint">
          <span>{copy.landing.iosShare}</span>
          <span aria-hidden="true">→</span>
          <span>{copy.landing.iosAdd}</span>
        </p>
      ) : (
        <p className="landing-hint">{copy.landing.installFallback}</p>
      )}
    </section>
  );
}
