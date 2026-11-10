# Companion calendar research

SÚE is the primary calendar in the app. The companion calendar is a quiet
translation of the same local civil date; it does not imply that every
calendar is lunar or that every historical system can be converted precisely.
The data and support labels live in
[`src/lib/companion-calendars.ts`](../src/lib/companion-calendars.ts), with
sources attached to each entry so the library can stay scannable.

## Source families

- Unicode CLDR, [UTS #35](https://www.unicode.org/reports/tr35/), for
  maintained calendar identifiers and locale data used by `Intl`.
- Official or institutional references for the Ethiopian Orthodox calendar,
  the [Indian national calendar](https://knowindia.gov.in/national-identity-elements/national-calendar.php),
  [Iran’s calendar](https://en.iran.ir/about/iranian-calendar),
  and the [Republic of China year comparison](https://www.ris.gov.tw/documents/html/8/1/219.html).
- Scholarly and museum references for ancient calendars, including the
  [Metropolitan Museum of Art on Egyptian time](https://www.metmuseum.org/essays/telling-time-in-ancient-egypt),
  Oxford’s [The Rabbinic Calendar](https://doi.org/10.1093/0198270348.003.0004),
  and the Oxford/academic material linked from the Babylonian entry.
- Primary, community, or specialist references for systems that are living,
  reconstructed, or proposal-based, such as the
  [OTO Thelema calendar](https://oto-usa.org/thelema/calendar/),
  [Comte’s Positivist calendar](https://archive.org/details/calendrierposit00comtgoog),
  and Cotsworth’s [International Fixed Calendar papers](https://rbscarchives.library.ubc.ca/downloads/moses-cotsworth-fonds.pdf).
- Maya correlation research, especially the common GMT 584283 correlation,
  is represented as provisional rather than as an undisputed historical fact:
  [Nature correlation study](https://www.nature.com/articles/srep01597).

## Corrections and limits

- **Ásatrú / Runic** is not one universally standardized calendar. The
  companion entry is historical/community context only, not a fabricated
  conversion.
- **Ophiuchus / “Calendar of Cosmic Harmony”** is not an established
  historical civil calendar. Ophiuchus is a constellation, and the proposed
  13-sign zodiac calendar is marked as a proposal rather than assigned dates.
- **Ancient Egyptian** and **Babylonian** dates require historical
  convention, location, and (for Babylonian months) observational or
  scholarly reconstruction. The app does not invent a single exact modern
  date.
- **Bengali** uses Bangladesh’s revised civil rule (New Year on 14 April),
  not the different regional panjika traditions of West Bengal.
- **Malayalam** is shown as an approximate Kollam-era regional civil label;
  local solar transition rules and historical era conventions vary.
- **Vikram Samvat** and **Kali Yuga** are presented as era labels where a
  single month/day conversion would be misleading.
- **Maya Long Count** uses GMT 584283, a common scholarly correlation, while
  acknowledging that correlation debates exist.
- **Juche** is historical-only in this library: North Korea phased out the
  era label in 2024, so a current “2026 Juche” display would be misleading.
- **Deep time** (Earth age, universe age, or geologic epochs) is not a civil
  calendar and is kept as a note rather than a date converter.

“Native” means the platform’s maintained CLDR calendar data is used.
“Calculated” means a deterministic algorithm is implemented here.
“Approximate”, “era-only”, and “not a calendar” are intentionally visible
limits, not missing polish.
