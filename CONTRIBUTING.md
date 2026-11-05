# Contributing to SÚE

SÚE is local-first and honest about its sources. Please keep that tone.

## Develop

```bash
npm install
npm run dev
```

Checks before a pull request:

```bash
npm run test:calendar
npm run lint
npm run build
```

## Add a naming preset

1. Add the 13 names and a one-line origin to `src/lib/naming.ts` (`PERIOD_PRESETS`).
2. Extend the `NamingSystem` union in `src/lib/types.ts`.
3. Add a test in `src/lib/naming.test.ts`.
4. Do not invent ancient history. If the list is modern, poetic, or folk, say so.

## Add a theme

Themes are CSS variables plus a row in `src/lib/themes.ts`.

1. Add a `[data-theme="your-id"]` block in `src/app/globals.css` (copy Ancient Wood and retoken).
2. Add `--period-1` … `--period-13` and the HUD/wood tokens.
3. Register the theme in `THEMES` with a short origin line.
4. Extend the `ThemeId` union in `src/lib/types.ts`.

Keep the year wheel carved (wood/stone/engraving). The rest of the UI can lean HUD / solarpunk.

## Calendar engine

Date math lives in `src/lib/` (`sue-calendar.ts`, `moon.ts`, `seasons.ts`, `sprints.ts`, `weekdays.ts`). If you change a rule, extend `npm run test:calendar`.

## Copy / i18n

User-facing English lives in `src/lib/copy.ts`. Add strings there instead of hard-coding them in components, so a later locale file can swap the module.

## Calendar sync

- Google: `src/lib/google-calendar.ts` (browser OAuth, read + write).
- Apple: `src/lib/apple-calendar.ts` + `src/app/api/caldav/route.ts`. Never persist Apple passwords on the server.
- `.ics`: `src/lib/ics.ts` remains the zero-account fallback.

## Research honesty

The Research page labels **fact / calculation / interpretation**. If you add a claim, pick a label and a source. Do not say lunar phases scientifically determine personal outcomes.
