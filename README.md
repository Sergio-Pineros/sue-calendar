# SÚE

Open-source, local-first **year planning** on a 13 × 28 calendar.

Thirteen periods of 28 days = 364, plus **Year Day** and (in leap years) **Leap Day** — International Fixed Calendar style — with the moon as a layer, not as the period itself.

SÚE is built for Sergio Piñeros. It is English-first, customizable, and honest about what is history, what is astronomy, and what is a planning framework.

## Screenshots

Saved from this repo’s v1 pass (mobile + desktop):

- Year wheel (Ancient Amethyst default), scroll-scrubbed with period colour blend
- Onboarding period-colour step
- Sprint picker (tiles, no dropdowns)
- Sprint sheet with a dedicated day ring
- Settings
- Themes: Ancient Amethyst, Ancient Wood, Solarpunk Mecha, Night Ritual, Moss Circuit

See the pull request artifacts for the latest captures.

## What it is

- A **rotating year wheel** — large, half below the fold. Scroll scrubs the year; the page blends into that period’s colour; a marker rides a ring of period names. Release settles on the nearest day. Tap a period or day to open it. Tap the hub for today.
- **Period colours** you choose in onboarding (Amethyst, Seasons, Moon, Spectrum, or per-period swatches), editable in Settings, stored locally
- **Period names** you can switch: Roman numerals (default), numbers, International Fixed Calendar, Comte’s Positivist calendar, Graves’s Celtic Tree (1948), folk full-moon names, or your own 13
- **Weekdays** you can rename, renumber (Sergio’s default is Sunday = −1 … Saturday = 5), and start on any day
- **Moon-based sprints** — tap a large rhythm tile (no dropdowns). A full-screen sheet opens a dedicated day ring colored push / light / rest; tap a day to override. Swipe down to close. Rhythm, not science.
- **Google Calendar** read + write (when you set a client ID)
- **Apple / iCloud Calendar** via CalDAV (Apple ID + app-specific password)
- **`.ics` import/export** as the universal fallback
- Works with **zero accounts** (pure local mode)

## What it is not

SÚE does not claim a lost universal 13-month calendar, or that 13 × 28 is a true lunar month (a synodic month is about 29.53 days). The Research page labels each note as fact, calculation, or interpretation.

The early Roman calendar had 10 months, then 12. There is no “13 months from before the Romans changed it” preset.

## Stack

Next.js 16 · React 19 · Tailwind 4 · GSAP ScrollTrigger. All personal data stays in `localStorage` on this device.

## Run locally

```bash
npm install
cp .env.example .env.local   # optional
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run test:calendar
npm run lint
npm run build
```

## Google Calendar (read + write)

1. In [Google Cloud Console](https://console.cloud.google.com/) create a project.
2. Enable the **Google Calendar API**.
3. Create an **OAuth 2.0 Client ID** (Web application).
4. Authorized JavaScript origins: `http://localhost:3000` (and your deployed origin).
5. Put the client ID in `.env.local`:

```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

6. Restart `npm run dev`. In Settings, connect Google, pick calendars, pull events. You can also **create** events from a day view.

Without a client ID, Google is hidden and local / `.ics` / Apple still work.

## Apple / iCloud Calendar (CalDAV)

iCloud has no public OAuth API. SÚE uses CalDAV at `caldav.icloud.com` through a thin Next.js route (`/api/caldav`).

1. Turn on two-factor authentication for the Apple ID.
2. Create an [app-specific password](https://appleid.apple.com/) (Sign-In and Security → App-Specific Passwords).
3. In Settings → Apple / iCloud Calendar, enter the Apple ID and that password.
4. List calendars, pull events, optionally create events from a day view.

Credentials are sent **per request**. They are **never stored on the server**. Check “Remember on this device” only if you want them in this browser’s `localStorage`.

`.ics` export from Apple Calendar remains the zero-proxy fallback.

## Themes

Tokens live in `src/app/globals.css`. Register a theme in `src/lib/themes.ts`.

| ID | Mood |
| --- | --- |
| `ancient-amethyst` | Default. Engraved violet stone — original SÚE purple. |
| `ancient-wood` | Carved slab, warm grain, brass engraving. |
| `solarpunk-mecha` | Light greenhouse HUD: moss, brass, hairlines. |
| `night-ritual` | Darker starfield, quiet night observatory. |
| `moss-circuit` | Forest phosphor, living circuit traces. |

## Period colours

Each of the 13 periods has its own colour. Choose a preset in onboarding or Settings (`src/lib/period-colors.ts`):

| ID | Mood |
| --- | --- |
| `amethyst` | Default. The original purple ramp. |
| `seasons` | Winter indigo → spring moss → summer brass → autumn russet. |
| `moon` | New-moon dark to full-moon silver and back. |
| `spectrum` | A hue walk that still sits on the dark HUD. |

Tap a period and pick a swatch to override one stone. Overrides stay on this device.

## Naming presets

See `src/lib/naming.ts`. Each preset has an origin line shown in Settings.

| ID | Origin |
| --- | --- |
| `roman` | Default. I–XIII. |
| `numbered` | 1–13. |
| `ifc` | Moses B. Cotsworth, 1902. |
| `comte` | Auguste Comte, Positivist Calendar, 1849. |
| `celtic` | Robert Graves, *The White Goddess*, 1948. |
| `folk` | Traditional almanac full-moon names + Blue Moon. |
| `custom` | Your 13 names, local only. |

## License

MIT. See [LICENSE](./LICENSE) and [CONTRIBUTING.md](./CONTRIBUTING.md).
