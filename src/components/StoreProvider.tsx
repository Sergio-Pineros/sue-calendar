"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import type {
  ExternalEvent,
  Goal,
  Habit,
  LayerKey,
  NamingSystem,
  PersonalCycle,
  Reflection,
  RestBlock,
  SueState,
} from "@/lib/types";
import { emptyState, loadState, newGoal, saveState } from "@/lib/storage";
import { nextPeriodRef } from "@/lib/sue-calendar";

type StoreContextValue = {
  ready: boolean;
  state: SueState;
  setNaming: (naming: NamingSystem) => void;
  setLayer: (key: LayerKey, value: boolean) => void;
  setViewYear: (year: number) => void;
  completeOnboarding: () => void;
  setPeriodFocus: (year: number, period: number, title: string) => void;
  addGoal: (goal: Goal) => void;
  updateGoal: (goal: Goal) => void;
  removeGoal: (id: string) => void;
  carryFocus: (year: number, period: number, title: string) => void;
  addHabit: (habit: Habit) => void;
  toggleHabit: (id: string, iso: string) => void;
  removeHabit: (id: string) => void;
  addRest: (rest: RestBlock) => void;
  removeRest: (id: string) => void;
  addCycle: (cycle: PersonalCycle) => void;
  removeCycle: (id: string) => void;
  upsertReflection: (reflection: Reflection) => void;
  replaceImportedEvents: (events: ExternalEvent[]) => void;
  mergeGoogleEvents: (events: ExternalEvent[], calendarIds: string[]) => void;
  replaceState: (next: SueState) => void;
};

const StoreContext = createContext<StoreContextValue | null>(null);
const SERVER_STATE = emptyState();
const STORE_EVENT = "sue-store";

let memory: SueState | null = null;

function snapshot(): SueState {
  if (!memory) memory = loadState();
  return memory;
}

function emit() {
  window.dispatchEvent(new Event(STORE_EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(STORE_EVENT, onChange);
  return () => window.removeEventListener(STORE_EVENT, onChange);
}

function patch(updater: (prev: SueState) => SueState) {
  memory = updater(snapshot());
  saveState(memory);
  emit();
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const state = useSyncExternalStore(subscribe, snapshot, () => SERVER_STATE);

  const setNaming = useCallback(
    (naming: NamingSystem) =>
      patch((s) => ({ ...s, settings: { ...s.settings, naming } })),
    [],
  );
  const setLayer = useCallback(
    (key: LayerKey, value: boolean) =>
      patch((s) => ({
        ...s,
        settings: {
          ...s.settings,
          layers: { ...s.settings.layers, [key]: value },
        },
      })),
    [],
  );
  const setViewYear = useCallback(
    (year: number) =>
      patch((s) => ({ ...s, settings: { ...s.settings, viewYear: year } })),
    [],
  );
  const completeOnboarding = useCallback(
    () => patch((s) => ({ ...s, settings: { ...s.settings, onboarded: true } })),
    [],
  );

  const value = useMemo<StoreContextValue>(
    () => ({
      ready: true,
      state,
      setNaming,
      setLayer,
      setViewYear,
      completeOnboarding,
      setPeriodFocus: (year, period, title) =>
        patch((s) => {
          const existing = s.goals.find(
            (goal) =>
              goal.sueYear === year &&
              goal.suePeriod === period &&
              goal.status !== "complete",
          );
          if (existing) {
            return {
              ...s,
              goals: s.goals.map((goal) =>
                goal.id === existing.id ? { ...goal, title } : goal,
              ),
            };
          }
          return {
            ...s,
            goals: [...s.goals, newGoal({ title, sueYear: year, suePeriod: period })],
          };
        }),
      addGoal: (goal) => patch((s) => ({ ...s, goals: [...s.goals, goal] })),
      updateGoal: (goal) =>
        patch((s) => ({
          ...s,
          goals: s.goals.map((item) => (item.id === goal.id ? goal : item)),
        })),
      removeGoal: (id) =>
        patch((s) => ({ ...s, goals: s.goals.filter((goal) => goal.id !== id) })),
      carryFocus: (year, period, title) =>
        patch((s) => {
          const next = nextPeriodRef(year, period);
          const current = s.goals.find(
            (goal) =>
              goal.sueYear === year &&
              goal.suePeriod === period &&
              goal.status !== "complete",
          );
          let goals = current
            ? s.goals.map((goal) =>
                goal.id === current.id ? { ...goal, status: "carried" as const } : goal,
              )
            : s.goals;
          const already = goals.some(
            (goal) =>
              goal.sueYear === next.year &&
              goal.suePeriod === next.period &&
              goal.title === title,
          );
          if (!already) {
            goals = [
              ...goals,
              newGoal({
                title,
                sueYear: next.year,
                suePeriod: next.period,
                status: "carried",
              }),
            ];
          }
          return { ...s, goals };
        }),
      addHabit: (habit) => patch((s) => ({ ...s, habits: [...s.habits, habit] })),
      toggleHabit: (id, iso) =>
        patch((s) => ({
          ...s,
          habits: s.habits.map((habit) =>
            habit.id === id
              ? {
                  ...habit,
                  checkIns: { ...habit.checkIns, [iso]: !habit.checkIns[iso] },
                }
              : habit,
          ),
        })),
      removeHabit: (id) =>
        patch((s) => ({
          ...s,
          habits: s.habits.filter((habit) => habit.id !== id),
        })),
      addRest: (rest) =>
        patch((s) => ({ ...s, restBlocks: [...s.restBlocks, rest] })),
      removeRest: (id) =>
        patch((s) => ({
          ...s,
          restBlocks: s.restBlocks.filter((block) => block.id !== id),
        })),
      addCycle: (cycle) =>
        patch((s) => ({
          ...s,
          personalCycles: [...s.personalCycles, cycle],
        })),
      removeCycle: (id) =>
        patch((s) => ({
          ...s,
          personalCycles: s.personalCycles.filter((cycle) => cycle.id !== id),
        })),
      upsertReflection: (reflection) =>
        patch((s) => {
          const exists = s.reflections.some((item) => item.id === reflection.id);
          return {
            ...s,
            reflections: exists
              ? s.reflections.map((item) =>
                  item.id === reflection.id ? reflection : item,
                )
              : [...s.reflections, reflection],
          };
        }),
      replaceImportedEvents: (events) =>
        patch((s) => ({
          ...s,
          events: [
            ...s.events.filter((event) => event.source === "google"),
            ...events,
          ],
          settings: {
            ...s.settings,
            lastSyncedAt: new Date().toISOString(),
          },
        })),
      mergeGoogleEvents: (events, calendarIds) =>
        patch((s) => ({
          ...s,
          events: [
            ...s.events.filter((event) => event.source !== "demo" && event.source !== "google"),
            ...events,
          ],
          settings: {
            ...s.settings,
            selectedCalendarIds: calendarIds,
            lastSyncedAt: new Date().toISOString(),
          },
        })),
      replaceState: (next) =>
        patch(() => ({
          ...emptyState(),
          ...next,
          settings: { ...emptyState().settings, ...next.settings },
        })),
    }),
    [completeOnboarding, setLayer, setNaming, setViewYear, state],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useSueStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useSueStore must be used within StoreProvider");
  return ctx;
}
