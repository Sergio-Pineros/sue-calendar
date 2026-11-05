"use client";

import { useState } from "react";
import { addDays } from "@/lib/sue-calendar";
import { copy } from "@/lib/copy";
import { newLocalEvent } from "@/lib/storage";
import { createGoogleEvent, googleClientId } from "@/lib/google-calendar";
import { createAppleEvent, type CalDavCalendar } from "@/lib/apple-calendar";
import { loadAppleCredentials } from "@/lib/storage";
import { useSueStore } from "./StoreProvider";

export function EventComposer({
  iso,
  appleCalendars = [],
}: {
  iso: string;
  appleCalendars?: CalDavCalendar[];
}) {
  const { state, addEvent } = useSueStore();
  const [title, setTitle] = useState("");
  const [allDay, setAllDay] = useState(true);
  const [time, setTime] = useState("10:00");
  const [target, setTarget] = useState("local");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const googleCalendars = state.settings.selectedCalendarIds;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    setStatus("");
    const start = allDay ? iso : `${iso}T${time}:00`;
    const end = allDay ? addDays(iso, 1) : `${iso}T${nextHour(time)}:00`;
    try {
      if (target.startsWith("google:")) {
        const calendarId = target.slice(7);
        const created = await createGoogleEvent(calendarId, {
          title: title.trim(),
          start,
          end,
          allDay,
        });
        addEvent(created);
      } else if (target.startsWith("apple:")) {
        const creds = loadAppleCredentials();
        const calendar = appleCalendars.find((item) => item.url === target.slice(6));
        if (!creds || !calendar) {
          throw new Error("Connect Apple Calendar in Settings first, and opt in to remember the password.");
        }
        const created = await createAppleEvent(creds.appleId, creds.appPassword, calendar, {
          title: title.trim(),
          start,
          end,
          allDay,
        });
        addEvent(created);
      } else {
        addEvent(newLocalEvent({ title: title.trim(), start, end, allDay }));
      }
      setTitle("");
      setStatus(copy.event.created);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : copy.event.failed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="space-y-3" onSubmit={submit}>
      <h2 className="display text-2xl">{copy.day.addEvent}</h2>
      <p className="text-sm text-ink-soft">{copy.day.addEventHint}</p>
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder={copy.day.title}
        className="w-full rounded-full border border-line bg-card px-4 text-sm outline-none focus:border-ink"
      />
      <div className="flex flex-wrap gap-3 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={allDay}
            onChange={(event) => setAllDay(event.target.checked)}
            className="accent-ink"
          />
          {copy.day.allDay}
        </label>
        {!allDay && (
          <input
            type="time"
            value={time}
            onChange={(event) => setTime(event.target.value)}
            className="rounded-full border border-line bg-card px-3"
          />
        )}
        <select
          value={target}
          onChange={(event) => setTarget(event.target.value)}
          className="rounded-full border border-line bg-card px-3"
        >
          <option value="local">{copy.day.local}</option>
          {googleClientId() &&
            googleCalendars.map((id) => (
              <option key={id} value={`google:${id}`}>
                Google · {id}
              </option>
            ))}
          {appleCalendars.map((calendar) => (
            <option key={calendar.url} value={`apple:${calendar.url}`}>
              Apple · {calendar.name}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={busy}
        className="rounded-full bg-ink px-4 text-sm text-paper disabled:opacity-60"
      >
        {busy ? copy.day.creating : copy.day.create}
      </button>
      {status && <p className="text-sm text-brass">{status}</p>}
    </form>
  );
}

function nextHour(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const next = ((h || 0) + 1) % 24;
  return `${String(next).padStart(2, "0")}:${String(m || 0).padStart(2, "0")}`;
}
