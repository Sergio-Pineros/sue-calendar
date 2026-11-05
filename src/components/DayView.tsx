"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  addDays,
  formatGregorianLong,
  formatSueLabel,
  gregorianToSue,
} from "@/lib/sue-calendar";
import { MOON_LABELS_ES } from "@/lib/moon";
import { SEASON_LABELS_ES } from "@/lib/seasons";
import { eventsOnDate, newHabit, newRest } from "@/lib/storage";
import { cyclePosition } from "@/lib/cycles";
import { useSueStore } from "./StoreProvider";
import { MoonGlyph } from "./MoonGlyph";
import { SourceBadge } from "./SourceBadge";

export function DayView({ iso }: { iso: string }) {
  const { state, toggleHabit, addHabit, addRest, removeRest, removeHabit } = useSueStore();
  const [habitTitle, setHabitTitle] = useState("");
  const mapped = useMemo(
    () => gregorianToSue(iso, state.settings.naming),
    [iso, state.settings.naming],
  );
  const events = state.settings.layers.events
    ? eventsOnDate(state.events, iso)
    : [];
  const rest = state.restBlocks.find((r) => r.date === iso);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft">
            Día
          </p>
          <h1 className="display text-4xl capitalize">
            {formatGregorianLong(iso)}
          </h1>
          <p className="mt-2 text-ink-soft">{formatSueLabel(mapped)}</p>
        </div>
        <div className="flex gap-2 font-mono text-sm">
          <Link
            href={`/day/${addDays(iso, -1)}`}
            className="rounded-full border border-line px-3 py-1"
          >
            ←
          </Link>
          <Link
            href={`/day/${addDays(iso, 1)}`}
            className="rounded-full border border-line px-3 py-1"
          >
            →
          </Link>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <InfoCard label="Gregoriano" badge="fact">
          {iso} · {mapped.weekday}
        </InfoCard>
        <InfoCard label="SÚE" badge="interpretation">
          {mapped.isSpecialDay
            ? mapped.suePeriodName
            : `${mapped.suePeriodName} · d${mapped.sueDayInPeriod} · s${mapped.sueWeekInPeriod}`}
        </InfoCard>
        <InfoCard label="Cielo" badge="calculation">
          <span className="inline-flex items-center gap-2">
            {state.settings.layers.moon && (
              <>
                <MoonGlyph name={mapped.moon.name} />
                {MOON_LABELS_ES[mapped.moon.name]}
              </>
            )}
            {state.settings.layers.seasons && (
              <span className="text-ink-soft">
                · {SEASON_LABELS_ES[mapped.season]}
              </span>
            )}
          </span>
        </InfoCard>
      </div>

      {mapped.isYearDay && (
        <p className="rounded-2xl border border-year-day/40 bg-year-day/10 px-4 py-3 text-sm">
          Year Day queda fuera de los 13 periodos. Úsalo como revisión anual, no como un día más de la semana.
        </p>
      )}
      {mapped.isLeapDay && (
        <p className="rounded-2xl border border-brass/40 bg-brass/10 px-4 py-3 text-sm">
          Leap Day se inserta después del periodo 6 y antes de Umbral / Sol. No forma parte de ningún periodo de 28 días.
        </p>
      )}

      {state.settings.layers.events && (
        <section>
          <h2 className="display text-2xl">Eventos sincronizados</h2>
          <p className="mb-3 mt-1 text-sm text-ink-soft">
            Siguen viviendo en Google o Apple. SÚE solo los muestra.
          </p>
          {events.length === 0 ? (
            <p className="text-sm text-ink-soft">
              No hay eventos este día. Importa un .ics o conecta Google en Ajustes.
            </p>
          ) : (
            <ul className="space-y-2">
              {events.map((event) => (
                <li
                  key={event.id}
                  className="rounded-2xl border border-line bg-card px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{event.title}</p>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">
                      {event.source} · {event.calendarName}
                    </span>
                  </div>
                  <p className="text-sm text-ink-soft">
                    {event.allDay ? "Todo el día" : event.start.slice(11, 16)}
                    {event.location ? ` · ${event.location}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {state.settings.layers.habits && (
        <section>
          <h2 className="display text-2xl">Hábitos</h2>
          <ul className="mt-3 space-y-2">
            {state.habits.map((habit) => (
              <li key={habit.id} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={Boolean(habit.checkIns[iso])}
                  onChange={() => toggleHabit(habit.id, iso)}
                  className="size-4 accent-ink"
                />
                <span className="flex-1">{habit.title}</span>
                <button
                  type="button"
                  className="text-xs text-ink-soft"
                  onClick={() => removeHabit(habit.id)}
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!habitTitle.trim()) return;
              addHabit(newHabit(habitTitle.trim()));
              setHabitTitle("");
            }}
          >
            <input
              value={habitTitle}
              onChange={(e) => setHabitTitle(e.target.value)}
              placeholder="Añadir hábito"
              className="flex-1 rounded-full border border-line bg-card px-4 py-2 text-sm outline-none focus:border-ink"
            />
            <button className="rounded-full bg-ink px-4 py-2 text-sm text-paper">
              Añadir
            </button>
          </form>
        </section>
      )}

      {state.settings.layers.rest && (
        <section>
          <h2 className="display text-2xl">Descanso</h2>
          {rest ? (
            <button
              type="button"
              onClick={() => removeRest(rest.id)}
              className="mt-2 rounded-full border border-rest px-4 py-2 text-sm text-rest"
            >
              Quitar bloque de descanso
            </button>
          ) : (
            <button
              type="button"
              onClick={() => addRest(newRest(iso, "Descanso"))}
              className="mt-2 rounded-full border border-line px-4 py-2 text-sm"
            >
              Marcar este día como descanso
            </button>
          )}
        </section>
      )}

      {state.settings.layers.personal && state.personalCycles.length > 0 && (
        <section>
          <h2 className="display text-2xl">Ciclo propio</h2>
          <SourceBadge type="personal" />
          <ul className="mt-2 space-y-1 text-sm">
            {state.personalCycles.map((cycle) => {
              const pos = cyclePosition(cycle, iso);
              return (
                <li key={cycle.id}>
                  {cycle.name}: día {pos.dayInCycle}/{cycle.length} · {pos.phase}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {mapped.suePeriod && (
        <Link
          href={`/period/${mapped.suePeriod}`}
          className="inline-block text-brass underline-offset-4 hover:underline"
        >
          Volver al periodo {mapped.suePeriodName}
        </Link>
      )}
    </div>
  );
}

function InfoCard({
  label,
  badge,
  children,
}: {
  label: string;
  badge: "fact" | "calculation" | "interpretation";
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-line bg-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-soft">
          {label}
        </p>
        <SourceBadge type={badge} />
      </div>
      <div className="text-sm">{children}</div>
    </div>
  );
}
