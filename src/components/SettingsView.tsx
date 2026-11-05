"use client";

import { useState } from "react";
import { useSueStore } from "@/components/StoreProvider";
import { parseIcs } from "@/lib/ics";
import {
  fetchGoogleEvents,
  googleClientId,
  listGoogleCalendars,
  requestGoogleToken,
  type GoogleCalendarInfo,
} from "@/lib/google-calendar";
import { newCycle, parseBackup } from "@/lib/storage";
import { todayISO } from "@/lib/sue-calendar";
import type { NamingSystem } from "@/lib/types";

export function SettingsView() {
  const {
    state,
    setNaming,
    replaceImportedEvents,
    mergeGoogleEvents,
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
  const [syncing, setSyncing] = useState(false);
  const hasGoogle = Boolean(googleClientId());
  const lastSync = state.settings.lastSyncedAt
    ? new Date(state.settings.lastSyncedAt).toLocaleString("es")
    : null;

  async function connectGoogle() {
    setSyncing(true);
    setStatus("Pidiendo permiso a Google…");
    try {
      await requestGoogleToken();
      const list = await listGoogleCalendars();
      setCalendars(list);
      setSelected((current) =>
        current.length > 0
          ? current.filter((id) => list.some((item) => item.id === id))
          : list.filter((item) => item.primary).map((item) => item.id),
      );
      setStatus("Elige los calendarios que quieres ver en SÚE.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Error de Google");
    } finally {
      setSyncing(false);
    }
  }

  async function importGoogle() {
    if (selected.length === 0) {
      setStatus("Selecciona al menos un calendario.");
      return;
    }
    setSyncing(true);
    setStatus("Leyendo eventos…");
    try {
      const events = await fetchGoogleEvents(state.settings.viewYear, selected);
      mergeGoogleEvents(events, selected);
      setStatus(`${events.length} eventos de Google en ${state.settings.viewYear}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Error de Google");
    } finally {
      setSyncing(false);
    }
  }

  function exportBackup() {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sue-${todayISO()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setStatus("Respaldo descargado. Guárdalo fuera de este navegador.");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft">
          Ajustes
        </p>
        <h1 className="display text-4xl">Calendarios y preferencias</h1>
      </header>

      <section className="space-y-3">
        <h2 className="display text-2xl">Nombres de periodo</h2>
        {(["sue", "ifc", "numbered"] as NamingSystem[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setNaming(key)}
            className={`mr-2 rounded-full border px-4 py-1.5 text-sm ${
              state.settings.naming === key
                ? "border-ink bg-ink text-paper"
                : "border-line"
            }`}
          >
            {key === "sue" ? "SÚE" : key === "ifc" ? "IFC" : "1–13"}
          </button>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="display text-2xl">Google Calendar</h2>
        <p className="text-sm text-ink-soft">
          Solo lectura. Google sigue siendo la fuente de verdad. En Google Cloud
          crea un cliente OAuth, autoriza <code>http://localhost:3000</code> y
          pon el Client ID en <code>.env.local</code>.
        </p>
        {hasGoogle ? (
          <>
            <button
              type="button"
              disabled={syncing}
              className="rounded-full bg-ink px-4 py-2 text-sm text-paper disabled:opacity-60"
              onClick={connectGoogle}
            >
              {calendars.length ? "Volver a conectar" : "Conectar Google Calendar"}
            </button>
            {calendars.length > 0 && (
              <ul className="space-y-2">
                {calendars.map((calendar) => (
                  <li key={calendar.id}>
                    <label className="flex items-center gap-3 rounded-2xl border border-line px-4 py-2 text-sm">
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
                      {calendar.primary ? " · principal" : ""}
                    </label>
                  </li>
                ))}
              </ul>
            )}
            {(calendars.length > 0 || state.settings.selectedCalendarIds.length > 0) && (
              <button
                type="button"
                disabled={syncing}
                className="rounded-full border border-line px-4 py-2 text-sm disabled:opacity-60"
                onClick={importGoogle}
              >
                Traer eventos del {state.settings.viewYear}
              </button>
            )}
          </>
        ) : (
          <p className="rounded-2xl border border-line bg-card p-4 text-sm text-ink-soft">
            Añade <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> en{" "}
            <code>.env.local</code> y reinicia el servidor. Mientras tanto,
            importa un .ics.
          </p>
        )}
        {lastSync && (
          <p className="text-xs text-ink-soft">Última sync: {lastSync}</p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="display text-2xl">Apple Calendar / cualquier .ics</h2>
        <p className="text-sm text-ink-soft">
          En Mac: Calendario → Archivo → Exportar. Las reglas semanales y diarias
          se expanden dentro del año visible.
        </p>
        <label className="inline-flex cursor-pointer rounded-full border border-line px-4 py-2 text-sm">
          Importar archivo .ics
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
              setStatus(`${events.length} eventos importados desde ${file.name}`);
            }}
          />
        </label>
      </section>

      <section className="space-y-3">
        <h2 className="display text-2xl">Respaldo en este aparato</h2>
        <p className="text-sm text-ink-soft">
          SÚE guarda en este navegador. Exporta un JSON para no perder metas,
          hábitos y revisiones si cambias de dispositivo.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-full border border-line px-4 py-2 text-sm"
            onClick={exportBackup}
          >
            Descargar respaldo
          </button>
          <label className="inline-flex cursor-pointer rounded-full border border-line px-4 py-2 text-sm">
            Restaurar JSON
            <input
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                try {
                  replaceState(parseBackup(await file.text()));
                  setStatus("Respaldo restaurado.");
                } catch (error) {
                  setStatus(
                    error instanceof Error ? error.message : "JSON inválido",
                  );
                }
              }}
            />
          </label>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="display text-2xl">Ciclo personal</h2>
        <p className="text-sm text-ink-soft">
          Privado, definido por ti. No se asume un ciclo biológico universal
          de 28 días.
        </p>
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
            placeholder="Nombre del ciclo"
            className="flex-1 rounded-full border border-line bg-card px-4 py-2 text-sm outline-none focus:border-ink"
          />
          <button className="rounded-full bg-ink px-4 py-2 text-sm text-paper">
            Crear
          </button>
        </form>
        <ul className="space-y-2 text-sm">
          {state.personalCycles.map((cycle) => (
            <li
              key={cycle.id}
              className="flex items-center justify-between rounded-2xl border border-line px-4 py-2"
            >
              <span>
                {cycle.name} · {cycle.length} días
              </span>
              <button
                type="button"
                className="text-ink-soft"
                onClick={() => removeCycle(cycle.id)}
              >
                Quitar
              </button>
            </li>
          ))}
        </ul>
      </section>

      {status && <p className="text-sm text-brass">{status}</p>}
      <p className="text-xs text-ink-soft">
        Zona horaria detectada: {state.settings.timezone}. Los eventos de día
        completo se tratan como fechas civiles, no como instantes UTC.
      </p>
    </div>
  );
}
