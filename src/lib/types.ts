export type NamingSystem = "numbered" | "ifc" | "sue";

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
  | "personal";

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

export type ExternalEvent = {
  id: string;
  source: "google" | "ics" | "demo";
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
  source: "google" | "ics";
};

export type SueSettings = {
  naming: NamingSystem;
  timezone: string;
  layers: Record<LayerKey, boolean>;
  onboarded: boolean;
  viewYear: number;
  selectedCalendarIds: string[];
  lastSyncedAt: string | null;
};

export type SueState = {
  settings: SueSettings;
  goals: Goal[];
  habits: Habit[];
  events: ExternalEvent[];
  restBlocks: RestBlock[];
  personalCycles: PersonalCycle[];
  reflections: Reflection[];
};
