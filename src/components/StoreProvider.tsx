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
  Sprint,
  SueSettings,
  SueState,
  ThemeId,
} from "@/lib/types";
import { applySkippedOnboarding, emptyState, loadState, newGoal, saveState } from "@/lib/storage";
import { markEntered } from "@/lib/entry";
import { nextPeriodRef } from "@/lib/sue-calendar";

type StoreContextValue = {
  ready: boolean;
  state: SueState;
  updateSettings: (patch: Partial<SueSettings>) => void;
  setNaming: (naming: NamingSystem) => void;
  setCustomPeriodNames: (names: string[]) => void;
  setTheme: (theme: ThemeId) => void;
  setLayer: (key: LayerKey, value: boolean) => void;
  setViewYear: (year: number) => void;
  completeOnboarding: () => void;
  skipOnboarding: () => void;
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
  addSprint: (sprint: Sprint) => void;
  updateSprint: (sprint: Sprint) => void;
  removeSprint: (id: string) => void;
  addEvent: (event: ExternalEvent) => void;
  replaceImportedEvents: (events: ExternalEvent[]) => void;
  mergeGoogleEvents: (events: ExternalEvent[], calendarIds: string[]) => void;
  mergeAppleEvents: (events: ExternalEvent[], calendarIds: string[]) => void;
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

  const updateSettings = useCallback(
    (next: Partial<SueSettings>) =>
      patch((s) => ({ ...s, settings: { ...s.settings, ...next } })),
    [],
  );
  const setNaming = useCallback(
    (naming: NamingSystem) => updateSettings({ naming }),
    [updateSettings],
  );
  const setCustomPeriodNames = useCallback(
    (customPeriodNames: string[]) => updateSettings({ customPeriodNames }),
    [updateSettings],
  );
  const setTheme = useCallback(
    (theme: ThemeId) => updateSettings({ theme }),
    [updateSettings],
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
    (year: number) => updateSettings({ viewYear: year }),
    [updateSettings],
  );
  const completeOnboarding = useCallback(() => {
    markEntered();
    updateSettings({ onboarded: true });
  }, [updateSettings]);
  const skipOnboarding = useCallback(() => {
    markEntered();
    patch((s) => ({ ...s, settings: applySkippedOnboarding(s.settings) }));
  }, []);

  const value = useMemo<StoreContextValue>(
    () => ({
      ready: true,
      state,
      updateSettings,
      setNaming,
      setCustomPeriodNames,
      setTheme,
      setLayer,
      setViewYear,
      completeOnboarding,
      skipOnboarding,
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
      addSprint: (sprint) =>
        patch((s) => ({ ...s, sprints: [...s.sprints, sprint] })),
      updateSprint: (sprint) =>
        patch((s) => ({
          ...s,
          sprints: s.sprints.map((item) => (item.id === sprint.id ? sprint : item)),
        })),
      removeSprint: (id) =>
        patch((s) => ({
          ...s,
          sprints: s.sprints.filter((item) => item.id !== id),
        })),
      addEvent: (event) =>
        patch((s) => ({
          ...s,
          events: [...s.events.filter((item) => item.id !== event.id), event],
        })),
      replaceImportedEvents: (events) =>
        patch((s) => ({
          ...s,
          events: [
            ...s.events.filter(
              (event) => event.source === "google" || event.source === "apple" || event.source === "local",
            ),
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
      mergeAppleEvents: (events, calendarIds) =>
        patch((s) => ({
          ...s,
          events: [
            ...s.events.filter((event) => event.source !== "demo" && event.source !== "apple"),
            ...events,
          ],
          settings: {
            ...s.settings,
            appleCalendarIds: calendarIds,
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
    [completeOnboarding, setCustomPeriodNames, setLayer, setNaming, setTheme, setViewYear, skipOnboarding, state, updateSettings],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useSueStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useSueStore must be used within StoreProvider");
  return ctx;
}
