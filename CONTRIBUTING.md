# Contributing

Keep SÚE local-first and honest about its sources.

## Setup

```bash
npm install
npm run dev
```

Before a PR:

```bash
npm run test:calendar
npm run lint
npm run build
```

CI runs the same three commands.

## Where to change things

| Area | Files |
| --- | --- |
| Date math | `src/lib/sue-calendar.ts` + `*.test.ts` |
| Names | `src/lib/naming.ts`, `NamingSystem` in `types.ts` |
| Themes | `src/app/globals.css` + `src/lib/themes.ts` |
| Copy | `src/lib/copy.ts` (English, i18n-ready) |
| Google | `src/lib/google-calendar.ts` |
| Apple | `src/lib/apple-calendar.ts` + `src/app/api/caldav/route.ts` |

Never persist Apple passwords on the server.

## Naming presets

Add 13 names and a one-line **origin** in `PERIOD_PRESETS`. If the list is modern, poetic, or folk, say so. Do not invent ancient history.

## Research honesty

The Research page labels **fact / calculation / interpretation**. Do not say lunar phases scientifically determine personal outcomes. Do not claim a hertz value heals a named condition.

## Native

`npm run cap:sync` builds a static export (`CAPACITOR=1`) into `out/` and copies it into `ios/` and `android/`. Do not commit Capacitor copied `public` assets or Gradle/Pods build dirs — they are gitignored.
