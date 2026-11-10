"use client";

import { useState } from "react";
import { useSueStore } from "./StoreProvider";
import { useLocalDateISO } from "@/hooks/useLocalDateISO";
import { useNowMinute } from "@/hooks/useNowMinute";
import { copy } from "@/lib/copy";
import { weekdayIndex } from "@/lib/iso-date";
import {
  CHRONOTYPE_LABEL,
  CHRONOTYPE_PRESETS,
  ENERGY_STATES,
  MINUTES_IN_DAY,
  STATE_LABEL,
  TIER_LABEL,
  classifyTask,
  defaultEnergyProfile,
  emptyDayPlan,
  energyAtMinutes,
  fitTasksToSlices,
  formatClock,
  formatMinutes,
  formatRange,
  inferEnergy,
  joinWithNext,
  minutesFromTitle,
  nextMinutes,
  nextTier,
  reattachTasks,
  recommend,
  sliceAt,
  slicesByEnergy,
  splitEvenly,
  splitSlice,
} from "@/lib/energy";
import type {
  Chronotype,
  DayPlan,
  DaySlice,
  DayTask,
  EnergyProfile,
  EnergyState,
  EnergyTier,
} from "@/lib/types";

const STATE_MARK: Record<EnergyState, EnergyTier> = {
  sharp: "deep",
  steady: "steady",
  fried: "low",
};

export function TierMark({ tier }: { tier: EnergyTier }) {
  return <span className={`tier-mark tier-${tier}`} aria-hidden="true" />;
}

function EnergyMark({ state }: { state: EnergyState }) {
  return <TierMark tier={STATE_MARK[state]} />;
}

export function DayFocus({ iso }: { iso: string }) {
  const { state, updateDayPlan, updateSettings } = useSueStore();
  const today = useLocalDateISO();
  const now = useNowMinute();
  const [draft, setDraft] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [rhythmOpen, setRhythmOpen] = useState(false);

  const plan = state.dayPlans?.[iso] ?? emptyDayPlan();
  const profile = state.settings.energyProfile ?? defaultEnergyProfile();
  const isToday = iso === today && now !== null;
  const weekday = weekdayIndex(iso);
  const nowMinutes = now ? now.getHours() * 60 + now.getMinutes() : 0;
  const sliceEnergy = (slice: DaySlice): EnergyState =>
    energyAtMinutes((slice.start + slice.end) / 2, weekday, profile).state;
  const energy =
    isToday && now
      ? inferEnergy({ now, iso, checkIn: plan.checkIn, profile, events: state.events })
      : null;
  const rec = energy
    ? recommend({
        tasks: plan.tasks,
        energy: energy.state,
        slices: plan.slices,
        sliceEnergy,
        nowMinutes,
        profile,
      })
    : null;
  const stated = energy?.source === "check-in" ? energy.state : null;
  const nowSlice = isToday ? sliceAt(plan.slices, nowMinutes) : null;
  const daySpan = plan.slices.length
    ? { start: plan.slices[0].start, end: plan.slices[plan.slices.length - 1].end }
    : null;

  const update = (fn: (current: DayPlan) => DayPlan) => updateDayPlan(iso, fn);
  const updateTask = (id: string, patch: Partial<DayTask>) =>
    update((current) => ({
      ...current,
      tasks: current.tasks.map((task) => (task.id === id ? { ...task, ...patch } : task)),
    }));
  const setSlices = (next: DaySlice[]) =>
    update((current) => ({
      ...current,
      slices: next,
      tasks: reattachTasks(current.tasks, current.slices, next),
    }));

  function addTask(event: React.FormEvent) {
    event.preventDefault();
    const title = draft.trim();
    if (!title) return;
    update((current) => ({
      ...current,
      tasks: [
        ...current.tasks,
        {
          id: crypto.randomUUID(),
          title,
          tier: classifyTask(title),
          tierConfirmed: false,
          minutes: minutesFromTitle(title),
          dueToday: false,
          sliceId: null,
          done: false,
        },
      ],
    }));
    setDraft("");
  }

  function checkIn(next: EnergyState) {
    update((current) => ({
      ...current,
      checkIn: stated === next ? null : { state: next, at: new Date().toISOString() },
    }));
  }

  function cycleSlice(task: DayTask) {
    const ids = [null, ...plan.slices.map((slice) => slice.id)];
    const index = ids.indexOf(task.sliceId);
    updateTask(task.id, { sliceId: ids[(index + 1) % ids.length] });
  }

  function fit() {
    update((current) => ({
      ...current,
      tasks: fitTasksToSlices({
        tasks: current.tasks,
        slices: current.slices,
        sliceEnergy,
        fromMinutes: isToday ? nowMinutes : null,
      }),
    }));
  }

  return (
    <div className="focus">
      <header>
        <h2 className="display text-3xl">{isToday ? copy.focus.title : copy.focus.planTitle}</h2>
        {!isToday && <p className="focus-reason">{copy.focus.planHint}</p>}
      </header>

      {isToday && energy && rec && (
        <section className="focus-now" aria-live="polite">
          <div>
            <p className="focus-kicker">{copy.focus.checkIn}</p>
            <div className="focus-choices" role="group" aria-label={copy.focus.checkIn}>
              {ENERGY_STATES.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={stated === item}
                  className={`focus-choice ${stated === item ? "is-on" : ""} ${
                    !stated && energy.state === item ? "is-read" : ""
                  }`}
                  onClick={() => checkIn(item)}
                >
                  <EnergyMark state={item} />
                  {STATE_LABEL[item]}
                </button>
              ))}
            </div>
            <p className="focus-reason">{energy.reason}</p>
          </div>

          {rec.coldStart && (
            <div className="focus-block">
              <p className="display text-2xl">{copy.focus.coldTitle}</p>
              <p className="focus-reason">{copy.focus.coldHint}</p>
            </div>
          )}

          {rec.allDone && <p className="display text-2xl">{copy.focus.allDone}</p>}

          {rec.doNow && (
            <div className="focus-block focus-do-now">
              <p className="focus-kicker is-brass">{copy.focus.doNow}</p>
              <p className="display focus-title">{rec.doNow.task.title}</p>
              <p className="focus-meta">
                <TierMark tier={rec.doNow.task.tier} />
                {TIER_LABEL[rec.doNow.task.tier]}
                {rec.doNow.task.minutes !== null ? ` · ${formatMinutes(rec.doNow.task.minutes)}` : ""}
                {rec.doNow.task.dueToday ? ` · ${copy.focus.dueToday}` : ""}
              </p>
              <p className="focus-reason">{rec.doNow.why}</p>
              {rec.doNow.starter && (
                <p className="focus-starter">
                  <span>{copy.focus.starter}</span> {rec.doNow.starter}
                </p>
              )}
              <button
                type="button"
                className="focus-text-action"
                onClick={() => rec.doNow && updateTask(rec.doNow.task.id, { done: true })}
              >
                {copy.focus.done}
              </button>
            </div>
          )}

          {rec.quickWin && (
            <div className="focus-block">
              <p className="focus-kicker">{copy.focus.quickWin}</p>
              <div className="focus-line">
                <p>
                  <TierMark tier="low" />
                  {rec.quickWin.title}
                  {rec.quickWin.minutes !== null ? ` · ${formatMinutes(rec.quickWin.minutes)}` : ""}
                </p>
                <button
                  type="button"
                  className="focus-text-action"
                  onClick={() => rec.quickWin && updateTask(rec.quickWin.id, { done: true })}
                >
                  {copy.focus.done}
                </button>
              </div>
            </div>
          )}

          {rec.later.length > 0 && (
            <div className="focus-block">
              <p className="focus-kicker">{copy.focus.later}</p>
              <div className="space-y-3">
                {rec.later.map((group) => (
                  <div key={group.tier}>
                    <p className="focus-meta">
                      <TierMark tier={group.tier} />
                      {TIER_LABEL[group.tier]} — {group.when}
                    </p>
                    <ul className="focus-later-list">
                      {group.tasks.map((task) => (
                        <li key={task.id}>{task.title}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      <section className="focus-section">
        <div className="focus-row-head">
          <h3 className="focus-kicker">{copy.focus.slices}</h3>
          {plan.slices.length > 0 && (
            <button type="button" className="focus-text-action is-quiet" onClick={() => setSlices([])}>
              {copy.focus.clearSlices}
            </button>
          )}
        </div>
        {plan.slices.length === 0 ? (
          <div>
            <p className="focus-reason">{copy.focus.slicesHint}</p>
            <div className="focus-choices">
              <button type="button" className="focus-choice" onClick={() => setSlices(slicesByEnergy(profile))}>
                {copy.focus.byRhythm}
              </button>
              {[3, 4, 6].map((count) => (
                <button
                  key={count}
                  type="button"
                  className="focus-choice"
                  aria-label={`${count} slices`}
                  onClick={() => setSlices(splitEvenly(profile.dayStart, profile.dayEnd, count))}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="slice-bar" aria-hidden="true">
              {plan.slices.map((slice) => (
                <span
                  key={slice.id}
                  className={`slice-bar-piece energy-${sliceEnergy(slice)} ${
                    nowSlice?.id === slice.id ? "is-now" : ""
                  }`}
                  style={{ flexGrow: slice.end - slice.start }}
                />
              ))}
              {isToday && daySpan && nowMinutes >= daySpan.start && nowMinutes < daySpan.end && (
                <i
                  className="slice-bar-now"
                  style={{
                    left: `${((nowMinutes - daySpan.start) / (daySpan.end - daySpan.start)) * 100}%`,
                  }}
                />
              )}
            </div>
            <ol className="slice-list">
              {plan.slices.map((slice, index) => {
                const tasks = plan.tasks.filter((task) => task.sliceId === slice.id);
                const open = selected === slice.id;
                const sliceState = sliceEnergy(slice);
                const isNow = nowSlice?.id === slice.id;
                const isPast = isToday && slice.end <= nowMinutes;
                return (
                  <li
                    key={slice.id}
                    className={`slice-row ${isNow ? "is-now" : ""} ${isPast ? "is-past" : ""}`}
                  >
                    <button
                      type="button"
                      className="slice-head"
                      aria-expanded={open}
                      onClick={() => setSelected(open ? null : slice.id)}
                    >
                      <span className="slice-time">{formatRange(slice.start, slice.end)}</span>
                      <span className="slice-energy">
                        <EnergyMark state={sliceState} />
                        {STATE_LABEL[sliceState]}
                        {isNow ? ` · ${copy.focus.nowSlice}` : ""}
                      </span>
                    </button>
                    {tasks.length > 0 ? (
                      <ul className="slice-tasks">
                        {tasks.map((task) => (
                          <li key={task.id} className={task.done ? "is-done" : ""}>
                            <TierMark tier={task.tier} />
                            {task.title}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="slice-empty">{copy.focus.empty}</p>
                    )}
                    {open && (
                      <div className="focus-choices">
                        <button
                          type="button"
                          className="focus-choice"
                          disabled={slice.end - slice.start < 30}
                          onClick={() => setSlices(splitSlice(plan.slices, slice.id))}
                        >
                          {copy.focus.split}
                        </button>
                        <button
                          type="button"
                          className="focus-choice"
                          disabled={index === plan.slices.length - 1}
                          onClick={() => setSlices(joinWithNext(plan.slices, slice.id))}
                        >
                          {copy.focus.joinNext}
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
            {plan.tasks.some((task) => !task.done) && (
              <button type="button" className="focus-text-action" onClick={fit}>
                {copy.focus.fit}
              </button>
            )}
          </>
        )}
      </section>

      <section className="focus-section">
        <h3 className="focus-kicker">{copy.focus.plate}</h3>
        {plan.tasks.length > 0 && (
          <ul className="plate-list">
            {plan.tasks.map((task) => {
              const slice = plan.slices.find((item) => item.id === task.sliceId);
              return (
                <li key={task.id} className={`plate-row ${task.done ? "is-done" : ""}`}>
                  <label className="plate-check">
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={() => updateTask(task.id, { done: !task.done })}
                      className="size-4 accent-ink"
                    />
                    <span className="plate-title">{task.title}</span>
                  </label>
                  <div className="plate-chips">
                    <button
                      type="button"
                      className="plate-chip"
                      aria-label={`${TIER_LABEL[task.tier]}. Change energy tier`}
                      onClick={() => updateTask(task.id, { tier: nextTier(task.tier), tierConfirmed: true })}
                    >
                      <TierMark tier={task.tier} />
                      {TIER_LABEL[task.tier]}
                      {!task.tierConfirmed && <em> · {copy.focus.suggested}</em>}
                    </button>
                    <button
                      type="button"
                      className="plate-chip"
                      onClick={() => updateTask(task.id, { minutes: nextMinutes(task.minutes) })}
                    >
                      {formatMinutes(task.minutes)}
                    </button>
                    <button
                      type="button"
                      aria-pressed={task.dueToday}
                      className={`plate-chip ${task.dueToday ? "is-on" : ""}`}
                      onClick={() => updateTask(task.id, { dueToday: !task.dueToday })}
                    >
                      {isToday ? copy.focus.dueToday : copy.focus.dueThisDay}
                    </button>
                    {plan.slices.length > 0 && (
                      <button type="button" className="plate-chip" onClick={() => cycleSlice(task)}>
                        {slice ? formatClock(slice.start) : copy.focus.noSlice}
                      </button>
                    )}
                    <button
                      type="button"
                      className="plate-chip is-quiet"
                      onClick={() =>
                        update((current) => ({
                          ...current,
                          tasks: current.tasks.filter((item) => item.id !== task.id),
                        }))
                      }
                    >
                      {copy.focus.remove}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <form className="mt-3 flex gap-2" onSubmit={addTask}>
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={copy.focus.addPlaceholder}
            aria-label={copy.focus.addPlaceholder}
            className="ghost-input min-w-0 flex-1"
          />
          <button className="ghost-action">{copy.focus.add}</button>
        </form>
      </section>

      <section className="focus-section">
        <button
          type="button"
          className="focus-disclosure"
          aria-expanded={rhythmOpen}
          onClick={() => setRhythmOpen((value) => !value)}
        >
          <span className="focus-kicker">{copy.focus.rhythm}</span>
          <span className="focus-reason">{profile.saved ? copy.focus.rhythmSaved : copy.focus.rhythmUnsaved}</span>
        </button>
        {rhythmOpen && (
          <RhythmEditor
            profile={profile}
            onChange={(next) => updateSettings({ energyProfile: { ...next, saved: true } })}
            onForget={() => updateSettings({ energyProfile: { ...profile, saved: false } })}
          />
        )}
        <p className="focus-scope">{copy.focus.scope}</p>
      </section>
    </div>
  );
}

function clampMinute(value: number): number {
  return Math.min(MINUTES_IN_DAY, Math.max(0, value));
}

function Stepper({ value, onChange, label }: { value: number; onChange: (next: number) => void; label: string }) {
  return (
    <span className="rhythm-stepper">
      <button
        type="button"
        aria-label={`${label}: ${copy.focus.earlier}`}
        onClick={() => onChange(clampMinute(value - 30))}
      >
        −
      </button>
      <span className="rhythm-time">{formatClock(value)}</span>
      <button
        type="button"
        aria-label={`${label}: ${copy.focus.later30}`}
        onClick={() => onChange(clampMinute(value + 30))}
      >
        +
      </button>
    </span>
  );
}

function WindowRow({
  label,
  start,
  end,
  onChange,
}: {
  label: string;
  start: number;
  end: number;
  onChange: (start: number, end: number) => void;
}) {
  return (
    <div className="rhythm-row">
      <span className="rhythm-label">{label}</span>
      <div className="rhythm-steppers">
        <Stepper
          label={`${label} start`}
          value={start}
          onChange={(next) => onChange(Math.min(next, MINUTES_IN_DAY - 30), Math.max(end, next + 30))}
        />
        <Stepper
          label={`${label} end`}
          value={end}
          onChange={(next) => onChange(Math.min(start, next - 30), Math.max(next, 30))}
        />
      </div>
    </div>
  );
}

function RhythmEditor({
  profile,
  onChange,
  onForget,
}: {
  profile: EnergyProfile;
  onChange: (next: EnergyProfile) => void;
  onForget: () => void;
}) {
  return (
    <div className="rhythm">
      <p className="focus-kicker">{copy.focus.chronotype}</p>
      <div className="focus-choices">
        {(Object.keys(CHRONOTYPE_PRESETS) as Chronotype[]).map((type) => (
          <button
            key={type}
            type="button"
            aria-pressed={profile.saved && profile.chronotype === type}
            className={`focus-choice ${profile.saved && profile.chronotype === type ? "is-on" : ""}`}
            onClick={() => onChange({ ...profile, ...CHRONOTYPE_PRESETS[type], chronotype: type })}
          >
            {CHRONOTYPE_LABEL[type]}
          </button>
        ))}
      </div>
      <WindowRow
        label={copy.focus.dayWindow}
        start={profile.dayStart}
        end={profile.dayEnd}
        onChange={(dayStart, dayEnd) => onChange({ ...profile, dayStart, dayEnd })}
      />
      <WindowRow
        label={copy.focus.peak}
        start={profile.peakStart}
        end={profile.peakEnd}
        onChange={(peakStart, peakEnd) => onChange({ ...profile, peakStart, peakEnd })}
      />
      <WindowRow
        label={copy.focus.dip}
        start={profile.dipStart}
        end={profile.dipEnd}
        onChange={(dipStart, dipEnd) => onChange({ ...profile, dipStart, dipEnd })}
      />
      {profile.secondWindStart !== null && profile.secondWindEnd !== null ? (
        <>
          <WindowRow
            label={copy.focus.secondWind}
            start={profile.secondWindStart}
            end={profile.secondWindEnd}
            onChange={(secondWindStart, secondWindEnd) =>
              onChange({ ...profile, secondWindStart, secondWindEnd })
            }
          />
          <button
            type="button"
            className="focus-text-action is-quiet"
            onClick={() => onChange({ ...profile, secondWindStart: null, secondWindEnd: null })}
          >
            {copy.focus.removeSecondWind}
          </button>
        </>
      ) : (
        <button
          type="button"
          className="focus-text-action"
          onClick={() =>
            onChange({ ...profile, secondWindStart: 16 * 60 + 30, secondWindEnd: 18 * 60 + 30 })
          }
        >
          {copy.focus.addSecondWind}
        </button>
      )}
      {profile.saved && (
        <button type="button" className="focus-text-action is-quiet" onClick={onForget}>
          {copy.focus.rhythmForget}
        </button>
      )}
    </div>
  );
}
