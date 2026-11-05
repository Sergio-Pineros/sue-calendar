import type {
  ExternalEvent,
  Goal,
  Habit,
  LayerKey,
  NamingSystem,
  PersonalCycle,
  Reflection,
  RestBlock,
  SueSettings,
  SueState,
} from "./types";
import { addDays, sueToGregorian, todayISO } from "./sue-calendar";

const STORAGE_KEY = "sue:v1";

export const DEFAULT_LAYERS: Record<LayerKey, boolean> = {
  events: true,
  goals: true,
  habits: true,
  rest: true,
  moon: true,
  seasons: true,
  personal: false,
};

export function defaultSettings(): SueSettings {
  return {
    naming: "sue",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    layers: { ...DEFAULT_LAYERS },
    onboarded: false,
    viewYear: new Date().getFullYear(),
    selectedCalendarIds: [],
    lastSyncedAt: null,
  };
}

function uid(): string {
  return crypto.randomUUID();
}

export function demoEvents(year: number): ExternalEvent[] {
  const samples: [number, number, string, string, boolean][] = [
    [2, 4, "Revisión de proyecto", "work", false],
    [3, 11, "Caminata", "personal", true],
    [5, 2, "Entrega", "work", false],
    [7, 8, "Descanso programado", "rest", true],
    [9, 15, "Llamada con cliente", "work", false],
    [11, 6, "Cena familiar", "family", false],
    [13, 20, "Cierre de año", "personal", true],
  ];
  const mappedSamples = samples.map(([period, day, title, cal, allDay], i) => {
    const start = sueToGregorian(year, period, day);
    return eventFromDemo(year, i, start, title, cal, allDay);
  });

  const today = todayISO();
  const todayYear = Number(today.slice(0, 4));
  if (todayYear !== year) return mappedSamples;

  const aroundToday: ExternalEvent[] = [
    eventFromDemo(year, 90, today, "Foco de la mañana", "work", false),
    eventFromDemo(year, 91, addDays(today, 2), "Caminata", "personal", true),
  ];
  return [...mappedSamples, ...aroundToday];
}

function eventFromDemo(
  year: number,
  index: number,
  start: string,
  title: string,
  cal: string,
  allDay: boolean,
): ExternalEvent {
  return {
    id: `demo-${year}-${index}`,
    source: "demo",
    sourceEventId: `demo-${index}`,
    calendarId: cal,
    calendarName:
      cal === "work"
        ? "Trabajo"
        : cal === "family"
          ? "Familia"
          : cal === "rest"
            ? "Descanso"
            : "Personal",
    title,
    description:
      "Evento de ejemplo para ver el overlay. Sustitúyelo importando un .ics o Google.",
    start: allDay ? start : `${start}T10:00:00`,
    end: allDay ? addDays(start, 1) : `${start}T11:00:00`,
    timezone: "local",
    allDay,
    location: "",
    color:
      cal === "work" ? "#9B7CD0" : cal === "rest" ? "#A78BBE" : "#D4B8F0",
  };
}

export function emptyState(): SueState {
  const year = new Date().getFullYear();
  return {
    settings: defaultSettings(),
    goals: [],
    habits: [],
    events: demoEvents(year),
    restBlocks: [],
    personalCycles: [],
    reflections: [],
  };
}

export function loadState(): SueState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as SueState;
    return {
      ...emptyState(),
      ...parsed,
      settings: { ...defaultSettings(), ...parsed.settings },
    };
  } catch {
    return emptyState();
  }
}

export function saveState(state: SueState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function parseBackup(raw: string): SueState {
  const parsed = JSON.parse(raw) as Partial<SueState>;
  if (!parsed || typeof parsed !== "object") {
    throw new Error("El archivo no es un respaldo de SÚE");
  }
  return {
    ...emptyState(),
    ...parsed,
    settings: { ...defaultSettings(), ...parsed.settings },
    goals: parsed.goals ?? [],
    habits: parsed.habits ?? [],
    events: parsed.events ?? [],
    restBlocks: parsed.restBlocks ?? [],
    personalCycles: parsed.personalCycles ?? [],
    reflections: parsed.reflections ?? [],
  };
}

export function newGoal(partial: Partial<Goal> & { title: string; sueYear: number; suePeriod: number }): Goal {
  const start = sueToGregorian(partial.sueYear, partial.suePeriod, 1);
  const end = sueToGregorian(partial.sueYear, partial.suePeriod, 28);
  return {
    id: uid(),
    areaOfLife: "vida",
    gregorianStart: start,
    gregorianEnd: end,
    status: "active",
    linkedHabitIds: [],
    ...partial,
  };
}

export function newHabit(title: string): Habit {
  return {
    id: uid(),
    title,
    cadence: "daily",
    startDate: todayISO(),
    preferredCycle: "period",
    checkIns: {},
    restOnSpecialDays: true,
  };
}

export function newRest(date: string, note = ""): RestBlock {
  return { id: uid(), date, note };
}

export function newCycle(name: string): PersonalCycle {
  return {
    id: uid(),
    name,
    startDate: todayISO(),
    length: 28,
    phases: [
      { name: "inicio", days: 7 },
      { name: "medio", days: 14 },
      { name: "cierre", days: 7 },
    ],
    notes: "",
    visibility: "private",
  };
}

export function newReflection(
  scope: Reflection["scope"],
  sueYear: number,
  suePeriod: number | null,
  sueWeek: number | null,
): Reflection {
  return {
    id: uid(),
    scope,
    sueYear,
    suePeriod,
    sueWeek,
    answers: { repeated: "", moved: "", rest: "", carry: "", data: "" },
    createdAt: new Date().toISOString(),
  };
}

export function eventDateKey(event: ExternalEvent): string {
  return event.start.slice(0, 10);
}

export { eventsOnDate } from "./planning";

export function namingLabel(naming: NamingSystem): string {
  if (naming === "ifc") return "Nombres IFC";
  if (naming === "numbered") return "Periodos numerados";
  return "Nombres SÚE";
}
