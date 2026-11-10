"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useSueStore } from "@/components/StoreProvider";
import { exportIcs, parseIcs } from "@/lib/ics";
import {
  fetchGoogleEvents,
  googleClientId,
  listGoogleCalendars,
  requestGoogleToken,
  type GoogleCalendarInfo,
} from "@/lib/google-calendar";
import {
  fetchAppleEvents,
  listAppleCalendars,
  type CalDavCalendar,
} from "@/lib/apple-calendar";
import {
  loadAppleCredentials,
  newCycle,
  parseBackup,
  saveAppleCredentials,
} from "@/lib/storage";
import { todayISO } from "@/lib/sue-calendar";
import { PERIOD_PRESETS } from "@/lib/naming";
import { THEMES } from "@/lib/themes";
import { PeriodColorStudio } from "./PeriodColorStudio";
import { CompanionCalendarSettings } from "./CalendarLibrary";
import {
  WEEKDAYS,
  WEEKDAY_NAME_PRESETS,
  WEEKDAY_NUMBER_PRESETS,
} from "@/lib/weekdays";
import { copy } from "@/lib/copy";
import type { NamingSystem } from "@/lib/types";

export function SettingsView() {
  const router = useRouter();
  const {
    state,
    setNaming,
    setCustomPeriodNames,
    setTheme,
    updateSettings,
    replaceImportedEvents,
    mergeGoogleEvents,
    mergeAppleEvents,
    addCycle,
    removeCycle,
    replaceState,
  } = useSueStore();
  const [status, setStatus] = useState("");
  const [cycleName, setCycleName] = useState("");
  const [calendars, setCalendars] = useState<GoogleCalendarInfo[]>([]);
  const [selected, setSelected] = useState<string[]>(
    state.settings.selectedCalendarIds,
  );
  const savedApple = useSyncExternalStore(
    () => () => {},
    () => loadAppleCredentials(),
    () => null,
  );
  const [appleId, setAppleId] = useState(savedApple?.appleId ?? "");
  const [applePassword, setApplePassword] = useState(savedApple?.appPassword ?? "");
  const [rememberApple, setRememberApple] = useState(Boolean(savedApple));
  const [appleCalendars, setAppleCalendars] = useState<CalDavCalendar[]>([]);
  const [appleSelected, setAppleSelected] = useState<string[]>(
    state.settings.appleCalendarIds,
  );
  const [syncing, setSyncing] = useState(false);
  const hasGoogle = Boolean(googleClientId());
  const lastSync = state.settings.lastSyncedAt
    ? new Date(state.settings.lastSyncedAt).toLocaleString("en")
    : null;

  async function connectGoogle() {
    setSyncing(true);
    setStatus("Asking Google for access…");
    try {
      await requestGoogleToken(true);
      const list = await listGoogleCalendars();
      setCalendars(list);
      setSelected((current) =>
        current.length > 0
          ? current.filter((id) => list.some((item) => item.id === id))
          : list.filter((item) => item.primary).map((item) => item.id),
      );
      setStatus(copy.settings.pickCalendars);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Google error");
    } finally {
      setSyncing(false);
    }
  }

  async function importGoogle() {
    if (selected.length === 0) {
      setStatus(copy.settings.selectOne);
      return;
    }
    setSyncing(true);
    setStatus("Reading events…");
    try {
      const events = await fetchGoogleEvents(state.settings.viewYear, selected);
      mergeGoogleEvents(events, selected);
      setStatus(`${events.length} Google events in ${state.settings.viewYear}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Google error");
    } finally {
      setSyncing(false);
    }
  }

  async function connectApple() {
    setSyncing(true);
    try {
      const list = await listAppleCalendars(appleId, applePassword);
      setAppleCalendars(list);
      setAppleSelected((current) =>
        current.length > 0
          ? current.filter((url) => list.some((item) => item.url === url))
          : list.map((item) => item.url),
      );
      if (rememberApple) {
        saveAppleCredentials({ appleId, appPassword: applePassword });
      } else {
        saveAppleCredentials(null);
      }
      setStatus(`Found ${list.length} iCloud calendars.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Apple CalDAV error");
    } finally {
      setSyncing(false);
    }
  }

  async function importApple() {
    const chosen = appleCalendars.filter((item) => appleSelected.includes(item.url));
    if (chosen.length === 0) {
      setStatus(copy.settings.selectOne);
      return;
    }
    setSyncing(true);
    try {
      const events = await fetchAppleEvents(
        appleId,
        applePassword,
        chosen,
        state.settings.viewYear,
      );
      mergeAppleEvents(events, appleSelected);
      setStatus(`${events.length} Apple events in ${state.settings.viewYear}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Apple CalDAV error");
    } finally {
      setSyncing(false);
    }
  }

  function exportBackup() {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json",
    });
    download(blob, `sue-${todayISO()}.json`);
    setStatus(copy.backupDownloaded);
  }

  function exportCalendar() {
    const blob = new Blob([exportIcs(state.events, "SÚE")], {
      type: "text/calendar",
    });
    download(blob, `sue-${todayISO()}.ics`);
    setStatus("Exported .ics");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-14">
      <header>
        <h1 className="display text-4xl">{copy.settings.kicker}</h1>
        <button
          type="button"
          className="ghost-action mt-6"
          onClick={() => router.push("/onboarding")}
        >
          {copy.settings.setup}
        </button>
        <p className="mt-2 text-sm text-ink-soft">{copy.settings.setupHint}</p>
      </header>

      <CompanionCalendarSettings />

      <section className="space-y-3">
        <h2 className="display text-2xl">{copy.settings.theme}</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              type="button"
              onClick={() => setTheme(theme.id)}
              className={`py-3 text-left ${
                state.settings.theme === theme.id ? "text-ink" : "text-ink-soft"
              }`}
            >
              <p className="font-medium">{theme.label}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="display text-2xl">{copy.settings.periodColors}</h2>
        <PeriodColorStudio />
      </section>

      <section className="space-y-3">
        <h2 className="display text-2xl">{copy.settings.periods}</h2>
        {PERIOD_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => setNaming(preset.id as NamingSystem)}
            className={`ghost-action mr-2 mb-2 ${
              state.settings.naming === preset.id ? "text-ink" : "text-ink-soft"
            }`}
          >
            {preset.label}
          </button>
        ))}
        {state.settings.naming === "custom" && (
          <div className="grid gap-2 sm:grid-cols-2">
            {state.settings.customPeriodNames.map((name, index) => (
              <label key={index} className="text-sm">
                {index + 1}
                <input
                  value={name}
                  onChange={(event) => {
                    const next = [...state.settings.customPeriodNames];
                    next[index] = event.target.value;
                    setCustomPeriodNames(next);
                  }}
                  className="ghost-input mt-1 w-full"
                />
              </label>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="display text-2xl">{copy.settings.week}</h2>
        <label className="block text-sm">
          {copy.settings.weekStart}
          <select
            value={state.settings.weekStart}
            onChange={(event) =>
              updateSettings({ weekStart: Number(event.target.value) })
            }
            className="ghost-input mt-2 w-full"
          >
            {WEEKDAYS.map((day, index) => (
              <option key={day} value={index}>
                {day}
              </option>
            ))}
          </select>
        </label>
        <p className="text-sm">{copy.settings.weekdayNames}</p>
        {WEEKDAY_NAME_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => updateSettings({ weekdayNamePreset: preset.id })}
            className={`ghost-action mr-2 ${
              state.settings.weekdayNamePreset === preset.id ? "text-ink" : "text-ink-soft"
            }`}
          >
            {preset.label}
          </button>
        ))}
        {state.settings.weekdayNamePreset === "custom" && (
          <div className="grid gap-2 sm:grid-cols-2">
            {WEEKDAYS.map((day, index) => (
              <label key={day} className="text-sm">
                {day}
                <input
                  value={state.settings.weekdayNames[index]}
                  onChange={(event) => {
                    const weekdayNames = [...state.settings.weekdayNames];
                    weekdayNames[index] = event.target.value;
                    updateSettings({ weekdayNames });
                  }}
                  className="ghost-input mt-1 w-full"
                />
              </label>
            ))}
          </div>
        )}
        <p className="text-sm">{copy.settings.weekdayNumbers}</p>
        {WEEKDAY_NUMBER_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => updateSettings({ weekdayNumberPreset: preset.id })}
            className={`ghost-action mr-2 ${
              state.settings.weekdayNumberPreset === preset.id ? "text-ink" : "text-ink-soft"
            }`}
          >
            {preset.label}
          </button>
        ))}
        {state.settings.weekdayNumberPreset === "custom" && (
          <div className="grid grid-cols-7 gap-2">
            {WEEKDAYS.map((day, index) => (
              <label key={day} className="text-xs">
                {day.slice(0, 2)}
                <input
                  type="number"
                  value={state.settings.weekdayNumbers[index]}
                  onChange={(event) => {
                    const weekdayNumbers = [...state.settings.weekdayNumbers];
                    weekdayNumbers[index] = Number(event.target.value);
                    updateSettings({ weekdayNumbers });
                  }}
                  className="ghost-input mt-1 w-full"
                />
              </label>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="display text-2xl">{copy.settings.google}</h2>
        {hasGoogle ? (
          <>
            <button
              type="button"
              disabled={syncing}
              className="btn-fill rounded-full px-4 text-sm disabled:opacity-60"
              onClick={connectGoogle}
            >
              {calendars.length ? copy.settings.googleReconnect : copy.settings.googleConnect}
            </button>
            {calendars.length > 0 && (
              <ul className="space-y-2">
                {calendars.map((calendar) => (
                  <li key={calendar.id}>
                    <label className="flex min-h-11 items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={selected.includes(calendar.id)}
                        onChange={() =>
                          setSelected((current) =>
                            current.includes(calendar.id)
                              ? current.filter((id) => id !== calendar.id)
                              : [...current, calendar.id],
                          )
                        }
                        className="accent-ink"
                      />
                      <span
                        className="size-2.5 rounded-full"
                        style={{ background: calendar.backgroundColor }}
                      />
                      {calendar.summary}
                      {calendar.primary ? ` · ${copy.settings.googlePrimary}` : ""}
                    </label>
                  </li>
                ))}
              </ul>
            )}
            {(calendars.length > 0 || state.settings.selectedCalendarIds.length > 0) && (
              <button
                type="button"
                disabled={syncing}
                className="ghost-action disabled:opacity-60"
                onClick={importGoogle}
              >
                {copy.settings.googleImport(state.settings.viewYear)}
              </button>
            )}
          </>
        ) : (
          <p className="text-sm text-ink-soft">{copy.settings.googleMissing}</p>
        )}
        {lastSync && (
          <p className="text-xs text-ink-soft">{copy.settings.lastSync(lastSync)}</p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="display text-2xl">{copy.settings.apple}</h2>
        <input
          value={appleId}
          onChange={(event) => setAppleId(event.target.value)}
          placeholder={copy.settings.appleId}
          className="ghost-input w-full"
        />
        <input
          type="password"
          value={applePassword}
          onChange={(event) => setApplePassword(event.target.value)}
          placeholder={copy.settings.applePassword}
          className="ghost-input w-full"
        />
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={rememberApple}
            onChange={(event) => setRememberApple(event.target.checked)}
            className="accent-ink"
          />
          {copy.settings.appleRemember}
        </label>
        <button
          type="button"
          disabled={syncing || !appleId || !applePassword}
          className="btn-fill rounded-full px-4 text-sm disabled:opacity-60"
          onClick={connectApple}
        >
          {copy.settings.appleConnect}
        </button>
        {appleCalendars.length > 0 && (
          <ul className="space-y-2">
            {appleCalendars.map((calendar) => (
              <li key={calendar.url}>
                <label className="flex min-h-11 items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={appleSelected.includes(calendar.url)}
                    onChange={() =>
                      setAppleSelected((current) =>
                        current.includes(calendar.url)
                          ? current.filter((url) => url !== calendar.url)
                          : [...current, calendar.url],
                      )
                    }
                    className="accent-ink"
                  />
                  {calendar.name}
                </label>
              </li>
            ))}
          </ul>
        )}
        {appleCalendars.length > 0 && (
          <button
            type="button"
            disabled={syncing}
            className="ghost-action"
            onClick={importApple}
          >
            {copy.settings.appleImport}
          </button>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="display text-2xl">{copy.settings.ics}</h2>
        <div className="flex flex-wrap gap-2">
          <label className="ghost-action inline-flex cursor-pointer">
            {copy.settings.icsImport}
            <input
              type="file"
              accept=".ics,text/calendar"
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const text = await file.text();
                const events = parseIcs(
                  text,
                  file.name.replace(/\.ics$/i, ""),
                  state.settings.viewYear,
                );
                replaceImportedEvents(events);
                setStatus(`${events.length} events imported from ${file.name}`);
              }}
            />
          </label>
          <button
            type="button"
            className="ghost-action"
            onClick={exportCalendar}
          >
            {copy.settings.icsExport}
          </button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="display text-2xl">{copy.settings.backup}</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="ghost-action"
            onClick={exportBackup}
          >
            {copy.settings.downloadBackup}
          </button>
          <label className="ghost-action inline-flex cursor-pointer">
            {copy.settings.restoreBackup}
            <input
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                try {
                  replaceState(parseBackup(await file.text()));
                  setStatus(copy.settings.restored);
                } catch (error) {
                  setStatus(
                    error instanceof Error ? error.message : copy.settings.invalidJson,
                  );
                }
              }}
            />
          </label>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="display text-2xl">{copy.settings.cycle}</h2>
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!cycleName.trim()) return;
            addCycle(newCycle(cycleName.trim()));
            setCycleName("");
          }}
        >
          <input
            value={cycleName}
            onChange={(event) => setCycleName(event.target.value)}
            placeholder={copy.settings.cycleName}
            className="ghost-input flex-1"
          />
          <button className="btn-fill rounded-full px-4 text-sm">
            {copy.settings.create}
          </button>
        </form>
        <ul className="space-y-2 text-sm">
          {state.personalCycles.map((cycle) => (
            <li
              key={cycle.id}
              className="flex items-center justify-between py-2"
            >
              <span>
                {cycle.name} · {cycle.length} days
              </span>
              <button
                type="button"
                className="text-ink-soft"
                onClick={() => removeCycle(cycle.id)}
              >
                {copy.settings.remove}
              </button>
            </li>
          ))}
        </ul>
      </section>

      {status && <p className="text-sm text-brass">{status}</p>}
      <p className="text-xs text-ink-soft">
        {copy.settings.timezone(state.settings.timezone)}
      </p>
    </div>
  );
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}
