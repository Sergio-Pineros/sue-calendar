export type NamingSystem =
  | "roman"
  | "numbered"
  | "ifc"
  | "comte"
  | "celtic"
  | "folk"
  | "custom";

export type WeekdayNamePreset = "long" | "short" | "custom";

export type WeekdayNumberPreset = "none" | "one" | "sergio" | "custom";

export type ThemeId =
  | "pearl-light"
  | "system"
  | "ancient-amethyst"
  | "ancient-wood"
  | "solarpunk-mecha"
  | "night-ritual"
  | "moss-circuit";

export type PeriodColorPreset = "amethyst" | "seasons" | "moon" | "spectrum";

export type CompanionCalendarId =
  | "gregorian"
  | "julian"
  | "ethiopian"
  | "juche"
  | "minguo"
  | "buddhist"
  | "hebrew"
  | "islamic"
  | "persian"
  | "coptic"
  | "vikram-samvat"
  | "saka"
  | "kali-yuga"
  | "bengali"
  | "malayalam"
  | "chinese"
  | "japanese"
  | "maya-long-count"
  | "roman-auc"
  | "ancient-egyptian"
  | "babylonian"
  | "holocene"
  | "thelemic"
  | "asatru-runic"
  | "french-republican"
  | "international-fixed"
  | "positivist"
  | "ophiuchus"
  | "celtic-tree";

export type CompanionCalendarMode = "companion" | "follow";

export type EvidenceType =
  | "fact"
  | "calculation"
  | "interpretation"
  | "personal";

export type Weekday =
  | "Sunday"
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday";

export type SeasonName = "winter" | "spring" | "summer" | "autumn";

export type MoonPhaseName =
  | "new"
  | "waxing-crescent"
  | "first-quarter"
  | "waxing-gibbous"
  | "full"
  | "waning-gibbous"
  | "last-quarter"
  | "waning-crescent";

export type CalendarDate = {
  gregorianDate: string;
  gregorianYear: number;
  gregorianMonth: number;
  gregorianDay: number;
  weekday: Weekday;
  weekdayIndex: number;
  dayOfYear: number;
  sueYear: number;
  suePeriod: number | null;
  suePeriodName: string;
  sueWeekInPeriod: number | null;
  sueDayInPeriod: number | null;
  isYearDay: boolean;
  isLeapDay: boolean;
  isSpecialDay: boolean;
  season: SeasonName;
  seasonMarker: "solstice" | "equinox" | null;
  moon: {
    name: MoonPhaseName;
    age: number;
    illumination: number;
  };
};

export type LayerKey =
  | "events"
  | "goals"
  | "habits"
  | "rest"
  | "moon"
  | "seasons"
  | "personal"
  | "sabbats"
  | "sprints";

export type GoalStatus = "planned" | "active" | "carried" | "complete";

export type Goal = {
  id: string;
  title: string;
  areaOfLife: string;
  sueYear: number;
  suePeriod: number;
  gregorianStart: string;
  gregorianEnd: string;
  status: GoalStatus;
  linkedHabitIds: string[];
};

export type HabitCadence = "daily" | "weekdays" | "weekly";

export type Habit = {
  id: string;
  title: string;
  cadence: HabitCadence;
  startDate: string;
  preferredCycle: "day" | "week" | "period";
  checkIns: Record<string, boolean>;
  restOnSpecialDays: boolean;
};

export type PersonalCycle = {
  id: string;
  name: string;
  startDate: string;
  length: number;
  phases: { name: string; days: number }[];
  notes: string;
  visibility: "private";
};

export type EventSource = "google" | "ics" | "demo" | "apple" | "local";

export type ExternalEvent = {
  id: string;
  source: EventSource;
  sourceEventId: string;
  calendarId: string;
  calendarName: string;
  title: string;
  description: string;
  start: string;
  end: string;
  timezone: string;
  allDay: boolean;
  location: string;
  color: string;
};

export type RestBlock = {
  id: string;
  date: string;
  note: string;
};

export type Reflection = {
  id: string;
  scope: "week" | "period" | "year";
  sueYear: number;
  suePeriod: number | null;
  sueWeek: number | null;
  answers: {
    repeated: string;
    moved: string;
    rest: string;
    carry: string;
    data: string;
  };
  createdAt: string;
};

export type ConnectedCalendar = {
  id: string;
  name: string;
  color: string;
  source: "google" | "ics" | "apple";
};

export type SprintStyle =
  | "lunar-full"
  | "lunar-waxing"
  | "lunar-waning"
  | "period"
  | "seasonal"
  | "custom";

export type SprintIntensity = "push" | "light" | "rest";

export type SprintDay = {
  date: string;
  recommended: SprintIntensity;
  override?: SprintIntensity;
  note: string;
};

export type Sprint = {
  id: string;
  title: string;
  style: SprintStyle;
  startDate: string;
  endDate: string;
  deadline: string | null;
  days: SprintDay[];
  createdAt: string;
};

export type EnergyTier = "deep" | "steady" | "low";

export type EnergyState = "sharp" | "steady" | "fried";

export type Chronotype = "lark" | "third-bird" | "owl";

/** Times are minutes after local midnight. */
export type EnergyProfile = {
  saved: boolean;
  chronotype: Chronotype | null;
  dayStart: number;
  dayEnd: number;
  peakStart: number;
  peakEnd: number;
  dipStart: number;
  dipEnd: number;
  secondWindStart: number | null;
  secondWindEnd: number | null;
};

export type DaySlice = {
  id: string;
  start: number;
  end: number;
};

export type DayTask = {
  id: string;
  title: string;
  tier: EnergyTier;
  tierConfirmed: boolean;
  minutes: number | null;
  dueToday: boolean;
  sliceId: string | null;
  done: boolean;
};

export type EnergyCheckIn = {
  state: EnergyState;
  at: string;
};

export type DayPlan = {
  slices: DaySlice[];
  tasks: DayTask[];
  checkIn: EnergyCheckIn | null;
};

export type SueSettings = {
  naming: NamingSystem;
  customPeriodNames: string[];
  weekStart: number;
  weekdayNamePreset: WeekdayNamePreset;
  weekdayNames: string[];
  weekdayShortNames: string[];
  weekdayNumberPreset: WeekdayNumberPreset;
  weekdayNumbers: number[];
  theme: ThemeId;
  periodColorPreset: PeriodColorPreset;
  periodColorOverrides: (string | null)[];
  timezone: string;
  layers: Record<LayerKey, boolean>;
  onboarded: boolean;
  viewYear: number;
  selectedCalendarIds: string[];
  appleCalendarIds: string[];
  lastSyncedAt: string | null;
  frequencyFavorites: number[];
  companionCalendar: CompanionCalendarId;
  companionMode: CompanionCalendarMode;
  energyProfile: EnergyProfile;
};

export type SueState = {
  settings: SueSettings;
  goals: Goal[];
  habits: Habit[];
  events: ExternalEvent[];
  restBlocks: RestBlock[];
  personalCycles: PersonalCycle[];
  reflections: Reflection[];
  sprints: Sprint[];
  dayPlans: Record<string, DayPlan>;
};

export type NamingContext = {
  preset: NamingSystem;
  customNames?: string[];
};
