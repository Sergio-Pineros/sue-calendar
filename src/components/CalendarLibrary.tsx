"use client";

import { useEffect, useRef, useState } from "react";
import { useSueStore } from "./StoreProvider";
import { useLocalDateISO } from "@/hooks/useLocalDateISO";
import {
  COMPANION_CALENDARS,
  companionCalendarInfo,
  companionGroupLabel,
  formatCompanionDate,
} from "@/lib/companion-calendars";
import { copy } from "@/lib/copy";
import type { CompanionCalendarId } from "@/lib/types";

export function CompanionCalendarLine({
  iso,
  className = "",
}: {
  iso: string;
  className?: string;
}) {
  const { state, updateSettings } = useSueStore();
  const [open, setOpen] = useState(false);
  const selected = state.settings.companionCalendar;
  const info = companionCalendarInfo(selected);
  const date = formatCompanionDate(iso, selected, state.settings.timezone);
  const following = state.settings.companionMode === "follow" && info.followable;

  function selectCalendar(id: CompanionCalendarId) {
    const next = companionCalendarInfo(id);
    updateSettings({
      companionCalendar: id,
      companionMode: next.followable ? state.settings.companionMode : "companion",
    });
  }

  return (
    <>
      <button
        type="button"
        className={`companion-date-line ${className}`}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={`${info.title}: ${date.label}. ${copy.settings.companionCalendarChange}`}
      >
        <span className="companion-date-main">
          <span>{info.shortTitle}</span>
          <span aria-hidden>·</span>
          <span>{date.label}</span>
        </span>
        <span className="companion-date-meta">
          {following ? copy.settings.companionModeFollow : copy.settings.companionModeCompanion}
          {following ? " · " : " · "}
          {date.detail}
        </span>
        {following && (
          <span className="companion-date-structure">{date.monthStructure}</span>
        )}
      </button>
      <CalendarLibrary
        open={open}
        selectedId={selected}
        onClose={() => setOpen(false)}
        onSelect={selectCalendar}
      />
    </>
  );
}

export function CompanionCalendarSettings() {
  const { state, updateSettings } = useSueStore();
  const today = useLocalDateISO();
  const info = companionCalendarInfo(state.settings.companionCalendar);
  const following = state.settings.companionMode === "follow";

  return (
    <section className="companion-settings space-y-4">
      <header>
        <h2 className="display text-2xl">{copy.settings.companionCalendar}</h2>
        <p className="mt-2 text-sm text-ink-soft">
          {copy.settings.companionCalendarHint}
        </p>
      </header>
      <CompanionCalendarLine iso={today} />
      <div className="companion-mode" aria-label={copy.settings.companionCalendar}>
        <button
          type="button"
          className={following ? "" : "is-active"}
          onClick={() => updateSettings({ companionMode: "companion" })}
        >
          {copy.settings.companionModeCompanion}
        </button>
        <button
          type="button"
          className={following ? "is-active" : ""}
          disabled={!info.followable}
          onClick={() => updateSettings({ companionMode: "follow" })}
        >
          {copy.settings.companionModeFollow}
        </button>
      </div>
      <p className="text-xs text-ink-soft">{copy.settings.companionModeHint}</p>
    </section>
  );
}

export function CalendarLibrary({
  open,
  selectedId,
  onClose,
  onSelect,
}: {
  open: boolean;
  selectedId: CompanionCalendarId;
  onClose: () => void;
  onSelect: (id: CompanionCalendarId) => void;
}) {
  const [activeId, setActiveId] = useState<CompanionCalendarId>(selectedId);
  const activeTabRef = useRef<HTMLButtonElement>(null);
  const active = companionCalendarInfo(activeId);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, open]);

  useEffect(() => {
    if (open) {
      activeTabRef.current?.scrollIntoView({
        block: "nearest",
        inline: "center",
      });
    }
  }, [activeId, open]);

  if (!open) return null;

  return (
    <div className="calendar-library" role="dialog" aria-modal="true" aria-labelledby="calendar-library-title">
      <button
        type="button"
        className="calendar-library-scrim"
        aria-label={copy.settings.calendarLibraryClose}
        onClick={onClose}
      />
      <div className="calendar-library-panel">
        <header className="calendar-library-head">
          <div>
            <p className="eyebrow">{copy.settings.calendarLibrary}</p>
            <h2 id="calendar-library-title" className="display text-3xl">
              {active.title}
            </h2>
          </div>
          <button type="button" className="ghost-action" onClick={onClose} autoFocus>
            {copy.settings.calendarLibraryClose}
          </button>
        </header>

        <nav className="calendar-library-tabs" aria-label={copy.settings.calendarLibrary}>
          {COMPANION_CALENDARS.map((calendar) => (
            <button
              key={calendar.id}
              type="button"
              role="tab"
              ref={calendar.id === activeId ? activeTabRef : undefined}
              aria-selected={calendar.id === activeId}
              className={calendar.id === activeId ? "is-active" : ""}
              onClick={() => setActiveId(calendar.id)}
            >
              {calendar.shortTitle}
            </button>
          ))}
        </nav>

        <div className="calendar-library-content" role="tabpanel">
          <div className="calendar-library-title-row">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-ink-soft">
                {companionGroupLabel(active.group)}
              </p>
              <p className="mt-2 text-sm text-ink-soft">
                {copy.settings.calendarSupport}: {active.supportLabel}
              </p>
            </div>
            <button
              type="button"
              className="btn-fill rounded-full px-4 text-sm"
              onClick={() => {
                onSelect(active.id);
                onClose();
              }}
            >
              Use {active.shortTitle}
            </button>
          </div>

          <CalendarSection label={copy.settings.calendarLibraryOrigin}>
            <p>{active.origin}</p>
          </CalendarSection>
          <CalendarSection label={copy.settings.calendarLibraryCommunity}>
            <p>{active.community}</p>
          </CalendarSection>
          <CalendarSection label={copy.settings.calendarLibraryMechanics}>
            <p>{active.mechanics}</p>
            <p className="mt-2 text-ink-soft">{active.monthStructure}</p>
          </CalendarSection>
          <CalendarSection label={copy.settings.calendarLibraryMoon}>
            <p>{active.moonRelationship}</p>
          </CalendarSection>
          <CalendarSection label={copy.settings.calendarLibrary2026}>
            <p>{active.status2026}</p>
          </CalendarSection>
          <CalendarSection label={copy.settings.calendarLibraryFact}>
            <p>{active.funFact}</p>
          </CalendarSection>

          <details className="calendar-library-sources">
            <summary>{copy.settings.calendarLibrarySources}</summary>
            <ul>
              {active.sources.map((source) => (
                <li key={source.url}>
                  <a href={source.url} target="_blank" rel="noreferrer">
                    {source.title}
                  </a>
                </li>
              ))}
            </ul>
          </details>

          <details className="calendar-library-deep-time">
            <summary>{copy.settings.calendarLibraryDeepTime}</summary>
            <p>{copy.settings.calendarLibraryDeepTimeBody}</p>
            <a
              href="https://stratigraphy.org/chart"
              target="_blank"
              rel="noreferrer"
            >
              International Commission on Stratigraphy
            </a>
          </details>
        </div>
      </div>
    </div>
  );
}

function CalendarSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="calendar-library-section">
      <h3>{label}</h3>
      <div className="text-sm leading-6 text-ink-soft">{children}</div>
    </section>
  );
}
