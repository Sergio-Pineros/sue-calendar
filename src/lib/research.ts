export type ResearchEntry = {
  id: string;
  title: string;
  category: string;
  evidence: "Historical fact" | "Astronomical calculation" | "Modern interpretation" | "Product requirement";
  summary: string;
  rule: string;
  appUse: string;
  notes: string;
  sourceUrl: string;
};

export const RESEARCH: ResearchEntry[] = [
  {
    id: "ifc",
    title: "International Fixed Calendar",
    category: "Calendar system",
    evidence: "Historical fact",
    summary:
      "A modern fixed solar calendar associated with Moses B. Cotsworth (1902): 13 months of 28 days, plus Year Day and Leap Day.",
    rule: "13 periods × 28 days = 364 days, plus Year Day and, in leap years, Leap Day.",
    appUse: "The main structural inspiration for the SÚE year.",
    notes: "Use as inspiration, not as proof of a lost universal ancient calendar.",
    sourceUrl: "https://en.wikipedia.org/wiki/International_Fixed_Calendar",
  },
  {
    id: "synodic",
    title: "Synodic lunar month",
    category: "Cycle",
    evidence: "Astronomical calculation",
    summary: "The real cycle of lunar phases lasts about 29.53 days, not 28.",
    rule: "Mean synodic month ≈ 29.53 days.",
    appUse: "Moon phases are a layer on top of SÚE periods. They are not the same as those periods.",
    notes: "Do not claim that 13 × 28 is a lunar calendar.",
    sourceUrl: "https://aa.usno.navy.mil/faq/calendars",
  },
  {
    id: "lunisolar",
    title: "Lunisolar intercalary months",
    category: "Date rule",
    evidence: "Historical fact",
    summary:
      "Many traditional calendars sometimes add a 13th lunar month to stay aligned with the seasons.",
    rule: "Most years have 12 lunar months; some include 13.",
    appUse: "Explains the difference between an occasional historical 13-month year and 13 fixed periods every year.",
    notes: "Do not describe this as a permanent 13 × 28 system.",
    sourceUrl: "https://www.britannica.com/science/Metonic-cycle",
  },
  {
    id: "metonic",
    title: "Metonic cycle",
    category: "Calculation",
    evidence: "Astronomical calculation",
    summary: "Approximates 19 solar years to 235 lunar months.",
    rule: "19 solar years ≈ 235 lunar months; 7 extra months in 19 years.",
    appUse: "Educational reference for reconciling Moon and Sun.",
    notes: "Useful for Hebrew and related lunisolar calendars.",
    sourceUrl: "https://www.britannica.com/science/Metonic-cycle",
  },
  {
    id: "seasons",
    title: "Solar seasons",
    category: "Cycle",
    evidence: "Astronomical calculation",
    summary: "Solstices and equinoxes mark the solar year from Earth's axial tilt.",
    rule: "Seasonal markers come from Earth's orbit and axis.",
    appUse: "A planetary-awareness layer without pseudo-scientific claims.",
    notes: "Later this can become local (sunrise, sunset, day length).",
    sourceUrl: "https://science.nasa.gov/solar-system/skywatching/the-seasons-solstices-and-equinoxes/",
  },
  {
    id: "personal",
    title: "Personal cycles",
    category: "Cycle",
    evidence: "Modern interpretation",
    summary:
      "Anyone can define their own rhythms of energy, mood, training, rest, menstruation, or work focus.",
    rule: "Length, phases, start, and notes are defined by the person. They stay private.",
    appUse: "Reflective planning without assuming a universal 28-day biological cycle.",
    notes: "No medical claims.",
    sourceUrl: "https://www.nichd.nih.gov/health/topics/menstruation/conditioninfo/irregularities",
  },
  {
    id: "sprint",
    title: "13-period planning model",
    category: "Product",
    evidence: "Modern interpretation",
    summary: "Each 28-day period can be used as a four-week sprint.",
    rule: "One focus, four weekly reviews, one close per period.",
    appUse: "A bridge between calendar reform and usable planning.",
    notes: "A design decision, not an ancient or astronomical fact.",
    sourceUrl: "https://en.wikipedia.org/wiki/4%E2%80%934%E2%80%935_calendar",
  },
  {
    id: "moon-sprint",
    title: "Moon-based sprint rhythm",
    category: "Product",
    evidence: "Modern interpretation",
    summary:
      "Sprints can recommend push, light, and rest days from moon phase and the 28-day period. This is a framework, not a scientific forecast.",
    rule: "New moon → plan; waxing → build; full → peak/review/ship; waning → finish and rest. You can override any day.",
    appUse: "Optional planning overlay on the year wheel and day list.",
    notes:
      "Moon phase does not scientifically determine personal outcomes. Treat the plan as a rhythm you can edit.",
    sourceUrl: "https://aa.usno.navy.mil/faq/moon_phases",
  },
  {
    id: "yearday",
    title: "Year Day",
    category: "Date rule",
    evidence: "Modern interpretation",
    summary:
      "A day outside the week/month cycle that reconciles 364 days with the solar year.",
    rule: "Common year: 364 regular days + 1 Year Day.",
    appUse: "An annual review and reset moment in SÚE.",
    notes: "It breaks the continuous weekday sequence in the IFC model.",
    sourceUrl: "https://en.wikipedia.org/wiki/International_Fixed_Calendar",
  },
  {
    id: "naming",
    title: "Period naming presets",
    category: "Product",
    evidence: "Historical fact",
    summary:
      "Default names are Roman numerals. Other lists (IFC, Comte, Graves's Celtic Tree, folk moon names) are documented modern or traditional schemes — not a recovered pre-Roman 13-month year.",
    rule: "The early Roman calendar had 10 months, then 12. A permanent 13-month Roman year is a modern myth.",
    appUse: "Settings presets, each labeled with an honest one-line origin.",
    notes: "Tree and folk-moon presets carry the 'ancient 13 moons' feeling without claiming false history.",
    sourceUrl: "https://en.wikipedia.org/wiki/Roman_calendar",
  },
  {
    id: "google",
    title: "Google Calendar sync",
    category: "Product",
    evidence: "Product requirement",
    summary: "Read and write events from selected Google calendars inside the 13-period frame.",
    rule: "OAuth, chosen calendars, all-day and timed events, time zones, recurrence.",
    appUse: "Primary cloud import/export path when a Client ID is configured.",
    notes: "The external calendar stays the source of truth unless SÚE writes an event you asked for.",
    sourceUrl: "https://developers.google.com/calendar/api",
  },
  {
    id: "apple",
    title: "Apple / iCloud Calendar",
    category: "Product",
    evidence: "Product requirement",
    summary:
      "There is no public Apple Calendar OAuth API equivalent to Google. EventKit on native apps; CalDAV or ICS on the web.",
    rule: "CalDAV against caldav.icloud.com with an Apple ID + app-specific password; .ics as a universal fallback.",
    appUse: "A Next.js proxy forwards CalDAV. Credentials are never persisted on the server.",
    notes: "Document platform limits. Pure local mode works with zero accounts.",
    sourceUrl: "https://developer.apple.com/documentation/eventkit",
  },
  {
    id: "frequency",
    title: "Frequency tuner",
    category: "Product",
    evidence: "Modern interpretation",
    summary:
      "A built-in Web Audio tone you can tune, fade, and optionally play as a binaural beat. Presets include concert 432 / 440 Hz, the modern Solfeggio set, and Schumann 7.83 Hz as a beat (the Earth resonance itself is real and sub-audible).",
    rule: "Hertz values are physics. Assigned meanings (healing, DNA, mood) are tradition or marketing, not evidence. Moon and period suggestions are a planning overlay.",
    appUse: "Tune tab, Today card, and rest-day links. Favorites stay in localStorage.",
    notes:
      "SÚE does not map frequencies to diseases. A specific hertz value does not treat a named condition.",
    sourceUrl: "https://github.com/MichalAFerber/frequency-tone-generator",
  },
];

export const CLAIMS_TO_AVOID = [
  "Humanity originally used a single universal 13-month calendar.",
  "13 × 28 is the true lunar calendar.",
  "Everyone naturally follows a 28-day biological cycle.",
  "Gregorian time is false.",
  "Calendar reform proves a hidden ancient knowledge.",
  "Lunar phases scientifically determine personal outcomes.",
  "The early Romans used a permanent 13-month year before a later change.",
  "A specific hertz value heals a named condition.",
  "432 Hz or Solfeggio tones are scientifically proven to repair the body.",
];

export const CLAIMS_OK = [
  "A 13 × 28 frame creates a visually constant planning rhythm.",
  "Four-week periods make goals and reviews easier to compare.",
  "Moon phases and seasons can be reflection prompts, not proofs.",
  "Some historical calendars include occasional 13-month years.",
  "Modern fixed-calendar proposals tried to solve real administrative problems.",
  "Watching your own patterns over time can be useful.",
  "Sprint recommendations are a rhythm you can override, not a forecast.",
  "You can listen to a tone while planning; that is preference, not medicine.",
];

export const EVIDENCE_BADGE = {
  "Historical fact": "fact",
  "Astronomical calculation": "calculation",
  "Modern interpretation": "interpretation",
  "Product requirement": "personal",
} as const;
