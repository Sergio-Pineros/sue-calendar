import type {
  CompanionCalendarId,
  CompanionCalendarMode,
} from "./types";
import { isLeapYear, parseISODate } from "./iso-date";

export type CompanionCalendarGroup =
  | "civil"
  | "religious"
  | "south-asian"
  | "east-asian"
  | "ancient"
  | "modern"
  | "reform";

export type CompanionSupport =
  | "native"
  | "calculated"
  | "approximate"
  | "era-only"
  | "not-a-calendar";

export type CompanionSource = {
  title: string;
  url: string;
};

export type CompanionCalendarInfo = {
  id: CompanionCalendarId;
  title: string;
  shortTitle: string;
  group: CompanionCalendarGroup;
  origin: string;
  community: string;
  mechanics: string;
  moonRelationship: string;
  status2026: string;
  funFact: string;
  support: CompanionSupport;
  supportLabel: string;
  followable: boolean;
  monthStructure: string;
  sources: readonly CompanionSource[];
};

export type CompanionDate = {
  calendar: CompanionCalendarId;
  label: string;
  detail: string;
  support: CompanionSupport;
  month: string | null;
  day: number | null;
  year: number | null;
  monthStructure: string;
};

const CLDR = "https://www.unicode.org/reports/tr35/";
const MET = "https://www.metmuseum.org/essays/telling-time-in-ancient-egypt";
const ETHIOPIAN_CHURCH = "https://www.ethiopianorthodox.org/english/calendar.html";
const UBC_COTSWORTH = "https://rbscarchives.library.ubc.ca/downloads/moses-cotsworth-fonds.pdf";
const MAYA_CORRELATION = "https://www.nature.com/articles/srep01597";

const GROUP_LABELS: Record<CompanionCalendarGroup, string> = {
  civil: "Civil and active",
  religious: "Religious and regional",
  "south-asian": "South Asian",
  "east-asian": "East Asian",
  ancient: "Ancient and historical",
  modern: "Modern eras and reconstructions",
  reform: "Reform and 13-month proposals",
};

const CALENDARS: readonly CompanionCalendarInfo[] = [
  {
    id: "gregorian",
    title: "Gregorian",
    shortTitle: "Gregorian",
    group: "civil",
    origin: "A European solar calendar reform promulgated in 1582 under Pope Gregory XIII, building on the Julian calendar.",
    community: "The civil calendar used internationally, with local religious and cultural calendars alongside it.",
    mechanics: "12 months, 365 days in a common year and 366 in a leap year. Its leap rule is divisible by four, except centuries not divisible by 400.",
    moonRelationship: "Solar. Months do not track the lunar phase, although many holidays and older calendars use lunar observations.",
    status2026: "2026 CE is a common Gregorian year.",
    funFact: "September through December keep names derived from the Latin numbers seven through ten, even though January and February now come first.",
    support: "native",
    supportLabel: "Native CLDR labels",
    followable: true,
    monthStructure: "12 solar months; 365 or 366 days.",
    sources: [
      { title: "Unicode CLDR calendar data", url: CLDR },
      { title: "Encyclopaedia Britannica: Gregorian calendar", url: "https://www.britannica.com/science/Gregorian-calendar" },
    ],
  },
  {
    id: "julian",
    title: "Julian",
    shortTitle: "Julian",
    group: "civil",
    origin: "Introduced under Julius Caesar in 46 BCE as a Roman solar-calendar reform.",
    community: "A historical calendar still used for some church feast calculations and by communities that retain the old style.",
    mechanics: "12 months with a leap day every fourth year. It drifts from the tropical year faster than the Gregorian rule.",
    moonRelationship: "Solar in its civil structure; some church calendars use lunar calculations for movable feasts.",
    status2026: "For dates from March through December 2026, the Julian date is 13 days behind the Gregorian date.",
    funFact: "The reform made the year 46 BCE exceptionally long while the Roman calendar was brought back into seasonal alignment.",
    support: "calculated",
    supportLabel: "Calculated Julian conversion",
    followable: true,
    monthStructure: "12 solar months; 365 or 366 days under the Julian leap rule.",
    sources: [
      { title: "Encyclopaedia Britannica: Julian calendar", url: "https://www.britannica.com/science/Julian-calendar" },
      { title: "Encyclopaedia Britannica: calendar reform", url: "https://www.britannica.com/science/calendar" },
    ],
  },
  {
    id: "ethiopian",
    title: "Ethiopian / Geʽez",
    shortTitle: "Ethiopian",
    group: "civil",
    origin: "A calendar with roots in the ancient Egyptian and Alexandrian traditions, maintained in Ethiopia and used in Ethiopian and Eritrean Christian life.",
    community: "Ethiopian and Eritrean civil and church communities.",
    mechanics: "12 months of 30 days plus Pagume, a short 13th month of five days, or six in a leap year.",
    moonRelationship: "Solar. The fixed month lengths do not follow lunations.",
    status2026: "Gregorian 2026 spans Ethiopian years 2018 and 2019; 10 November 2026 is Hedar 1, 2019 in the CLDR calculation.",
    funFact: "The Ethiopian church associates a four-year cycle with the four Evangelists; the sixth Pagume day belongs to the leap year.",
    support: "native",
    supportLabel: "Native CLDR labels",
    followable: true,
    monthStructure: "12 × 30 days + Pagume 5/6 days.",
    sources: [
      { title: "Ethiopian Orthodox Tewahedo Church: calendar", url: ETHIOPIAN_CHURCH },
      { title: "Embassy of Ethiopia: Ethiopian time", url: "https://ethiopianembassy.org/ethiopian-time/" },
    ],
  },
  {
    id: "juche",
    title: "Juche era",
    shortTitle: "Juche",
    group: "civil",
    origin: "A North Korean year-numbering era instituted in 1997, using Kim Il Sung’s birth year, 1912, as Juche 1.",
    community: "A former official North Korean dating convention.",
    mechanics: "It kept Gregorian month and day structure and changed the year label; years before Juche 1 were not assigned negative Juche numbers.",
    moonRelationship: "Solar/Gregorian structure; no lunar month system.",
    status2026: "Historical only in this library: North Korea phased the era out in October 2024 and official 2025–2026 calendars use Gregorian year numbers.",
    funFact: "Juche keeps the Gregorian month lengths and day sequence; the distinctive part is the year label, not a new month system.",
    support: "era-only",
    supportLabel: "Historical era label",
    followable: true,
    monthStructure: "Gregorian months and days with a separate year count.",
    sources: [
      { title: "Korean Studies Encyclopedia: Juche era", url: "https://encykorea.aks.ac.kr/Article/E0070119" },
      { title: "Yonhap: North Korea stops using Juche calendar", url: "https://en.yna.co.kr/view/AEN20241017006100315" },
    ],
  },
  {
    id: "minguo",
    title: "Minguo / Republic of China",
    shortTitle: "Minguo",
    group: "civil",
    origin: "The Republic of China era begins with the founding of the ROC in 1912.",
    community: "Official dating in Taiwan and ROC institutions.",
    mechanics: "The months, days, and Gregorian leap rule are unchanged; only the year is numbered from 1912 as year 1.",
    moonRelationship: "Solar/Gregorian structure. Traditional lunisolar dates may appear beside it in Taiwanese almanacs.",
    status2026: "2026 is Minguo 115.",
    funFact: "Because 1912 is Minguo year 1, the era number is one greater than the number of completed years since the founding year.",
    support: "native",
    supportLabel: "Native CLDR labels",
    followable: true,
    monthStructure: "Gregorian months and days; year = Gregorian year − 1911.",
    sources: [
      { title: "Taiwan Remittance and Visa Service: year comparison", url: "https://www.ris.gov.tw/documents/html/8/1/219.html" },
      { title: "Unicode CLDR calendar data", url: CLDR },
    ],
  },
  {
    id: "buddhist",
    title: "Thai Buddhist Era",
    shortTitle: "Buddhist",
    group: "civil",
    origin: "A Buddhist era used in Thailand and other Theravada Buddhist contexts, conventionally counted from the Buddha’s parinirvana.",
    community: "Thai civil administration and Buddhist cultural life.",
    mechanics: "In modern Thai civil use it follows Gregorian months and days, with the year numbered 543 ahead of CE.",
    moonRelationship: "The civil date is solar/Gregorian; Buddhist observances can use lunar dates separately.",
    status2026: "2026 is Buddhist Era 2569.",
    funFact: "The same era appears in inscriptions and calendars with regional differences in the historical year assigned to the Buddha’s passing.",
    support: "native",
    supportLabel: "Native CLDR labels",
    followable: true,
    monthStructure: "Gregorian months and days with a Buddhist Era year.",
    sources: [
      { title: "Unicode CLDR calendar data", url: CLDR },
      { title: "Encyclopaedia Britannica: Buddhist calendar", url: "https://www.britannica.com/topic/Buddhist-calendar" },
    ],
  },
  {
    id: "hebrew",
    title: "Hebrew / Jewish",
    shortTitle: "Hebrew",
    group: "religious",
    origin: "A Jewish lunisolar calendar that developed from earlier observed calendars into the calculated rabbinic calendar.",
    community: "Jewish communities and institutions worldwide.",
    mechanics: "A 19-year cycle contains seven leap years with a 13th month. Month lengths vary, and the year begins with Tishrei in the civil reckoning.",
    moonRelationship: "Lunisolar: months are lunar in concept, while intercalation keeps festivals in their seasons.",
    status2026: "10 November 2026 is 30 Heshvan 5787 in the standard CLDR calculated calendar; local religious practice can use additional observance rules.",
    funFact: "The seven intercalated years in the standard cycle are years 3, 6, 8, 11, 14, 17, and 19.",
    support: "native",
    supportLabel: "Native CLDR labels",
    followable: true,
    monthStructure: "12 or 13 lunar months; 19-year intercalation cycle.",
    sources: [
      { title: "Oxford: The Rabbinic Calendar", url: "https://doi.org/10.1093/0198270348.003.0004" },
      { title: "UCL: Reiterative calendars in Jewish manuscripts", url: "https://discovery.ucl.ac.uk/id/eprint/10084388/3/Vidro%20Vidro%20for%20project%20volume%5B6%5D.pdf" },
    ],
  },
  {
    id: "islamic",
    title: "Hijri / Islamic",
    shortTitle: "Hijri",
    group: "religious",
    origin: "The Islamic era counts from the Hijra, Muhammad’s migration from Mecca to Medina, with the civil epoch conventionally placed in 622 CE.",
    community: "Muslim communities worldwide; month beginnings may follow local crescent sighting or a chosen calculation.",
    mechanics: "12 lunar months of 29 or 30 days. This companion uses the deterministic CLDR civil/tabular variant so a date is reproducible.",
    moonRelationship: "Lunar. Religious month beginnings can depend on actual crescent visibility, so observance dates may differ from this calculated label.",
    status2026: "10 November 2026 is Jumada II 1, 1448 AH in the CLDR civil calculation; a sighting-based date may differ by a day.",
    funFact: "Because no intercalary month is added, the Islamic year moves through the solar seasons over a roughly 33-year cycle.",
    support: "native",
    supportLabel: "Native CLDR civil labels",
    followable: true,
    monthStructure: "12 lunar months; approximately 354 or 355 days.",
    sources: [
      { title: "Encyclopaedia Iranica: Islamic calendars", url: "https://www.iranicaonline.org/articles/calendars/calendars-ii-in-the-islamic-period/" },
      { title: "McGill: Notes on the Islamic calendar", url: "https://arcjournal.library.mcgill.ca/article/download/912/941" },
      { title: "Unicode CLDR calendar data", url: CLDR },
    ],
  },
  {
    id: "persian",
    title: "Solar Hijri / Persian",
    shortTitle: "Persian",
    group: "religious",
    origin: "The modern Iranian calendar grew from Persian calendrical traditions and uses the Hijri era with a solar year.",
    community: "The official civil calendar of Iran and Afghanistan, with national variants.",
    mechanics: "The year begins at Nowruz, determined from the vernal equinox and a Tehran reference rule. The first six months have 31 days, the next five 30, and Esfand has 29 or 30.",
    moonRelationship: "Solar. Lunar Hijri dates are used separately for religious observances.",
    status2026: "The Iranian Solar Hijri year 1405 begins on 21 March 2026 under the official equinox rule.",
    funFact: "Nowruz is placed at the astronomical turning of spring rather than on a permanently fixed Gregorian date.",
    support: "native",
    supportLabel: "Native CLDR labels",
    followable: true,
    monthStructure: "12 solar months; 365 or 366 days.",
    sources: [
      { title: "Iran national portal: Iranian calendar", url: "https://en.iran.ir/about/iranian-calendar" },
      { title: "University of Tehran calendar centre: 1405 calendar", url: "https://hesabchy.ir/downloads/Calendar-1405.pdf" },
      { title: "Unicode CLDR calendar data", url: CLDR },
    ],
  },
  {
    id: "coptic",
    title: "Coptic / Alexandrian",
    shortTitle: "Coptic",
    group: "religious",
    origin: "The Alexandrian solar calendar preserved by Egyptian Christians and used with the Era of the Martyrs.",
    community: "Coptic Orthodox communities and Egyptian Christian liturgical life.",
    mechanics: "12 months of 30 days plus five epagomenal days, or six in a leap year. The era begins in 284 CE with Diocletian’s accession.",
    moonRelationship: "Solar civil structure, with lunar calculations important for Easter and other movable feasts.",
    status2026: "10 November 2026 is Hator 1, 1743 AM in the CLDR Coptic calendar.",
    funFact: "The short final month preserves the ancient Egyptian pattern of adding days outside the regular twelve months.",
    support: "native",
    supportLabel: "Native CLDR labels",
    followable: true,
    monthStructure: "12 × 30 days + 5/6 epagomenal days.",
    sources: [
      { title: "Claremont Coptic Encyclopedia: calendar", url: "https://ccdl.claremont.edu/digital/collection/cce/id/404/" },
      { title: "Claremont Coptic Encyclopedia: Era of the Martyrs", url: "https://ccdl.claremont.edu/digital/collection/cce/id/796/" },
      { title: "Unicode CLDR calendar data", url: CLDR },
    ],
  },
  {
    id: "vikram-samvat",
    title: "Vikram Samvat",
    shortTitle: "Vikram",
    group: "south-asian",
    origin: "A family of traditional South Asian era and calendar systems associated with an epoch around 57 BCE.",
    community: "Used in Nepal and in regional Hindu, Jain, and Sikh contexts in India; month rules vary by region.",
    mechanics: "It is not one universal conversion: lunar amanta and purnimanta systems, and Nepal’s solar civil form, use different year and month boundaries.",
    moonRelationship: "Usually lunisolar in Indian religious usage; the intercalary month keeps lunar festivals near solar seasons.",
    status2026: "A date in November 2026 is approximately in Vikram Samvat 2083; the month/day requires a named regional system.",
    funFact: "The same era name can describe calendars whose New Year falls at different times because regional traditions use different month conventions.",
    support: "approximate",
    supportLabel: "Approximate era label",
    followable: false,
    monthStructure: "Regional 12-month lunisolar or solar systems; no single universal month map.",
    sources: [
      { title: "Encyclopaedia Britannica: Vikram Samvat", url: "https://www.britannica.com/topic/Vikrama-era" },
      { title: "India’s National Portal: national calendar distinction", url: "https://knowindia.gov.in/national-identity-elements/national-calendar.php" },
    ],
  },
  {
    id: "saka",
    title: "Saka / Indian National",
    shortTitle: "Saka",
    group: "south-asian",
    origin: "The Saka era, adapted into India’s National Calendar after the Calendar Reform Committee’s work in the 1950s.",
    community: "Official Indian publications alongside the Gregorian calendar, and wider South Asian historical usage.",
    mechanics: "Chaitra is the first month. A normal year has 365 days; Chaitra has 31 days in a Gregorian leap year and 30 otherwise, followed by fixed 31- and 30-day months.",
    moonRelationship: "Solar. Regional Hindu lunisolar calendars continue separately.",
    status2026: "10 November 2026 is Kartika 19, Saka 1948 in the CLDR Indian calendar.",
    funFact: "Chaitra is the Saka calendar’s first month; it has 30 days in a common year and 31 in a leap year.",
    support: "native",
    supportLabel: "Native CLDR labels",
    followable: true,
    monthStructure: "12 solar months; Chaitra begins on 22 March, or 21 March in a Gregorian leap year.",
    sources: [
      { title: "Government of India: National Calendar", url: "https://knowindia.gov.in/national-identity-elements/national-calendar.php" },
      { title: "Reserve Bank of India: Saka Samvat notice", url: "https://www.rbi.org.in/scripts/NotificationUser.aspx?Id=10237&Mode=0" },
      { title: "Unicode CLDR calendar data", url: CLDR },
    ],
  },
  {
    id: "kali-yuga",
    title: "Kali Yuga era",
    shortTitle: "Kali Yuga",
    group: "south-asian",
    origin: "A traditional Hindu era whose epoch is conventionally placed in 3102 BCE.",
    community: "A religious and cosmological era used in some Hindu calendrical and textual traditions.",
    mechanics: "This is an era count, not a complete civil calendar with one agreed month and day system.",
    moonRelationship: "The era itself is not lunar; regional calendars may supply lunar or solar dates alongside it.",
    status2026: "The conventional CE year 2026 is approximately Kali Yuga 5128, using the traditional epoch and no claim of a civil date conversion.",
    funFact: "The name refers to a world-age in Hindu cosmology, not to the month-by-month rules of a local almanac.",
    support: "era-only",
    supportLabel: "Era only",
    followable: true,
    monthStructure: "No single civil month structure; pair with a regional Hindu calendar.",
    sources: [
      { title: "Encyclopaedia Britannica: Kali Yuga", url: "https://www.britannica.com/topic/Kali-Yuga" },
      { title: "Encyclopaedia Britannica: Hindu chronology", url: "https://www.britannica.com/topic/Hinduism/Time-and-eternity" },
    ],
  },
  {
    id: "bengali",
    title: "Bangabda / Bangla",
    shortTitle: "Bengali",
    group: "south-asian",
    origin: "A Bengali solar calendar with older regional roots whose present civil form was shaped by reforms associated with Mughal revenue administration and later Bangla Academy revisions.",
    community: "Bangladesh’s civil calendar and Bengali cultural life; West Bengal and other regions use different panjika rules.",
    mechanics: "This implementation follows Bangladesh’s revised 2019 civil rule: Boishakh through Ashwin have 31 days, Falgun has 29 or 30, and the other months have 30. The year begins on 14 April.",
    moonRelationship: "Solar in the Bangladesh civil form. Traditional Bengali religious almanacs can use astronomical solar and lunar calculations.",
    status2026: "10 November 2026 is Kartik 25, Bangabda 1433 under the Bangladesh civil rule.",
    funFact: "Pohela Boishakh, the first day of Boishakh, is a major cultural New Year celebration and is not the same thing as a lunar Hijri New Year.",
    support: "calculated",
    supportLabel: "Calculated Bangladesh civil rule",
    followable: true,
    monthStructure: "12 solar months; 365 days, with Falgun gaining a day in the relevant Gregorian leap year.",
    sources: [
      { title: "Banglapedia: Bangabda", url: "https://en.banglapedia.org/index.php/Bangabda" },
      { title: "Bangla Academy revised 2019 rules", url: "https://calendrical.hexdocs.pm/Calendrical.Bangla.Revised2019.html" },
      { title: "Dhaka Tribune: Bangla calendar revision", url: "https://www.dhakatribune.com/bangladesh/191106/ashshin-in-31-days-in-revised-bangla-calendar" },
    ],
  },
  {
    id: "malayalam",
    title: "Malayalam / Kollam Era",
    shortTitle: "Malayalam",
    group: "south-asian",
    origin: "The Kollam Era (Kollavarsham) is a regional solar/sidereal calendar used in Kerala and nearby areas.",
    community: "Malayalam-speaking Kerala and the Malabar region.",
    mechanics: "The era is traditionally dated to 825 CE, but scholarship discusses a more precise 824 CE epoch and competing origin explanations. This display uses a simple regional month approximation.",
    moonRelationship: "Solar/sidereal. Lunar observances can appear alongside it but do not define the civil month.",
    status2026: "Around 10 November 2026, the approximate label is Thulam 25, Kollam Era 1202; sidereal ingress can move a boundary by a day.",
    funFact: "Kollam was a major medieval port, and the era’s name preserves that place connection even though its exact origin remains debated.",
    support: "approximate",
    supportLabel: "Approximate regional labels",
    followable: false,
    monthStructure: "12 solar/sidereal months with ingress-based boundaries; not a fixed Gregorian month table.",
    sources: [
      { title: "Government of Kerala: history of Kollam", url: "https://kollam.nic.in/en/history/" },
      { title: "On the epoch of the Kollam Era", url: "https://doi.org/10.3724/sp.j.1440-2807.2018.02.03" },
    ],
  },
  {
    id: "chinese",
    title: "Traditional Chinese",
    shortTitle: "Chinese",
    group: "east-asian",
    origin: "A traditional Chinese lunisolar calendar whose rules developed through successive imperial and astronomical traditions.",
    community: "Chinese communities and East Asian cultural calendars; regional almanacs can differ in conventions.",
    mechanics: "Lunar months are coordinated with the solar year through intercalation and solar terms. A 60-term stem-branch cycle names years, months, days, and hours.",
    moonRelationship: "Lunisolar. New moons set month boundaries and solar terms keep the calendar near the seasons.",
    status2026: "The Hong Kong Observatory identifies 2026 as the Bing-wu year of the Horse; the CLDR conversion supplies the civil lunar date.",
    funFact: "The ten Heavenly Stems and twelve Earthly Branches combine into a 60-term cycle, so the same pairing returns every sixty years.",
    support: "native",
    supportLabel: "Native CLDR labels",
    followable: true,
    monthStructure: "12 or 13 lunar months coordinated with 24 solar terms.",
    sources: [
      { title: "Hong Kong Observatory: 2026 conversion table", url: "https://www.hko.gov.hk/en/gts/time/calendar/pdf/files/2026e.pdf" },
      { title: "Hong Kong Observatory: stem-branch cycle", url: "https://www.hko.gov.hk/en/gts/time/stemsandbranches.htm" },
      { title: "Unicode CLDR calendar data", url: CLDR },
    ],
  },
  {
    id: "japanese",
    title: "Japanese era names",
    shortTitle: "Japanese",
    group: "east-asian",
    origin: "Japan uses the Gregorian calendar with an imperial era name and year number for official and cultural dating.",
    community: "Japanese civil and cultural life.",
    mechanics: "Months and days follow the Gregorian calendar; the year is numbered within the current imperial era.",
    moonRelationship: "Solar/Gregorian civil structure. Historical Japanese calendars and festivals also preserve lunisolar traditions.",
    status2026: "2026 is Reiwa 8.",
    funFact: "An era can begin during a Gregorian year, so one Gregorian year can contain two Japanese era labels at a transition.",
    support: "native",
    supportLabel: "Native CLDR labels",
    followable: true,
    monthStructure: "Gregorian months and days with an imperial era year.",
    sources: [
      { title: "Unicode CLDR calendar data", url: CLDR },
      { title: "National Diet Library: Japanese era names", url: "https://www.ndl.go.jp/kaleido/entry/1/1.html" },
    ],
  },
  {
    id: "maya-long-count",
    title: "Maya Long Count",
    shortTitle: "Maya",
    group: "ancient",
    origin: "An ancient Maya positional count recorded on monuments and in manuscripts, used alongside the Calendar Round and ritual cycles.",
    community: "Ancient Maya societies; contemporary Maya peoples continue distinct calendrical traditions.",
    mechanics: "The Long Count counts days in k’in, winal (20 days), tun (360 days), k’atun (7,200 days), and b’ak’tun (144,000 days).",
    moonRelationship: "Not a simple lunar calendar. Maya astronomy tracked lunar and solar cycles in related systems.",
    status2026: "This display uses the widely used GMT 584283 correlation: 10 November 2026 is 13.0.14.1.12. The correlation remains provisional.",
    funFact: "The Long Count uses a positional zero, allowing dates to be written as a structured count of elapsed days.",
    support: "calculated",
    supportLabel: "Calculated; correlation marked provisional",
    followable: true,
    monthStructure: "Nested day counts, not solar months: 20 k’in = 1 winal; 18 winal = 1 tun; then ×20.",
    sources: [
      { title: "Scientific Reports: Maya-European correlation", url: MAYA_CORRELATION },
      { title: "Mesoweb: Exploring the 584286 correlation", url: "https://www.mesoweb.com/pari/publications/journal/1302/Correlation.pdf" },
    ],
  },
  {
    id: "roman-auc",
    title: "Roman AUC",
    shortTitle: "Roman AUC",
    group: "ancient",
    origin: "Ab urbe condita means “from the founding of the city,” traditionally dated by Varro to 21 April 753 BCE.",
    community: "A historical Roman dating convention used by some later historians, not the ordinary Roman civil calendar.",
    mechanics: "This is an era label. Historical Romans usually dated by the names of consuls, and different ancient chronologies placed Rome’s foundation differently.",
    moonRelationship: "The Roman calendar had lunar and solar reforms, but AUC itself is only an era count.",
    status2026: "Using the conventional Varronian epoch, 2026 is approximately AUC 2779.",
    funFact: "The phrase AUC is more common in modern historical writing than it was in everyday Roman date-keeping.",
    support: "era-only",
    supportLabel: "Conventional era label",
    followable: true,
    monthStructure: "No separate AUC month structure; pair the era with a Roman or Gregorian date.",
    sources: [
      { title: "Dickinson College: Roman dating systems", url: "https://dcc.dickinson.edu/eutropius/intro/dating-systems" },
      { title: "University of Chicago: Roman consular dating", url: "https://penelope.uchicago.edu/encyclopaedia_romana/calendar/consuls.html" },
    ],
  },
  {
    id: "ancient-egyptian",
    title: "Ancient Egyptian civil",
    shortTitle: "Egyptian",
    group: "ancient",
    origin: "Ancient Egypt used a civil calendar of twelve 30-day months and five epagomenal days, alongside lunar and festival calendars.",
    community: "Ancient Egyptian administrative, agricultural, temple, and ritual communities.",
    mechanics: "The civil year had 365 fixed days and slowly moved through the seasons because it had no leap day. A single universally agreed ancient epoch is not available for modern date conversion.",
    moonRelationship: "The civil calendar was solar, while temple and festival practice also used lunar observations.",
    status2026: "No single historically responsible Egyptian civil date is claimed for 2026; a fixed conversion would hide unresolved epoch and drift questions.",
    funFact: "The year was divided into Akhet (Inundation), Peret (Emergence), and Shemu (Harvest), four months each.",
    support: "not-a-calendar",
    supportLabel: "Research note; no fixed conversion",
    followable: false,
    monthStructure: "12 × 30 days + 5 epagomenal days; historically drifting civil year.",
    sources: [
      { title: "Metropolitan Museum of Art: telling time in ancient Egypt", url: MET },
      { title: "Oxford: The Egyptian Calendar", url: "https://doi.org/10.1093/acprof:oso/9780199589449.003.0004" },
    ],
  },
  {
    id: "babylonian",
    title: "Babylonian",
    shortTitle: "Babylonian",
    group: "ancient",
    origin: "A Mesopotamian lunisolar calendar documented in cuneiform records and used by Babylonian and later Near Eastern states.",
    community: "Ancient Mesopotamian civic, agricultural, temple, and scholarly communities.",
    mechanics: "Months began with the first visible crescent and lasted 29 or 30 days. A 13th month was inserted when needed; the rules changed over time and were not one fixed algorithm.",
    moonRelationship: "Strongly lunar, with intercalation keeping agricultural and religious months near the seasons.",
    status2026: "No single Babylonian date is generated for 2026: the historical calendar varied by period, place, observation, and royal policy.",
    funFact: "The familiar 360-day schematic year was useful for administration and astronomy, but it was not the same as the observed cultic calendar.",
    support: "not-a-calendar",
    supportLabel: "Research note; no fixed conversion",
    followable: false,
    monthStructure: "Usually 12 lunar months, with an irregular intercalary 13th month.",
    sources: [
      { title: "Oxford: The Babylonian Calendar", url: "https://doi.org/10.1093/acprof:oso/9780199589449.003.0003" },
      { title: "Austriaca: Ancient Near Eastern calendar", url: "https://www.austriaca.at/0xc1aa5572%200x00237bbc.pdf" },
    ],
  },
  {
    id: "holocene",
    title: "Holocene / Human Era",
    shortTitle: "Holocene",
    group: "modern",
    origin: "Cesare Emiliani proposed adding 10,000 years to common-era year numbers as a calendar reform in 1993.",
    community: "A modern scientific and humanist proposal, not an adopted civil calendar.",
    mechanics: "It changes the era number while retaining Gregorian months and days. It is not the formal geological start date of the Holocene.",
    moonRelationship: "Solar/Gregorian structure; the era itself has no lunar rule.",
    status2026: "2026 CE is 12026 HE under Emiliani’s proposal.",
    funFact: "Adding ten thousand to the era number gives prehistoric and early agricultural dates room for positive year labels.",
    support: "era-only",
    supportLabel: "Modern era proposal",
    followable: true,
    monthStructure: "Gregorian months and days with 10,000 added to the year.",
    sources: [
      { title: "Nature: Cesare Emiliani, Calendar reform", url: "https://doi.org/10.1038/366716b0" },
      { title: "International Commission on Stratigraphy: Holocene boundary", url: "https://stratigraphy.org/ICSchart/ChronostratChart2024-12.jpg" },
    ],
  },
  {
    id: "thelemic",
    title: "Thelemic dating",
    shortTitle: "Thelemic",
    group: "modern",
    origin: "A modern religious dating practice associated with Thelema and the 1904 reception of Liber AL vel Legis.",
    community: "Thelemic communities and Ordo Templi Orientis traditions.",
    mechanics: "The year begins at the northern-hemisphere vernal equinox and is written in 22-year docosades. Complete dates often use the Sun and Moon’s tropical-zodiac positions rather than fixed month names.",
    moonRelationship: "Sun and Moon positions are central to the traditional notation, but this is not a lunar month calendar.",
    status2026: "After the 2026 vernal equinox, the common label is approximately Anno V:xii A.N.; this app does not calculate astrological positions.",
    funFact: "The 22-year docosade mirrors the 22 Trumps of the Tarot in Thelemic symbolism.",
    support: "approximate",
    supportLabel: "Approximate era and equinox label",
    followable: false,
    monthStructure: "No fixed month/day grid in the traditional notation; dates use solar and lunar positions.",
    sources: [
      { title: "Ordo Templi Orientis US Grand Lodge: calendar", url: "https://oto-usa.org/thelema/calendar/" },
      { title: "Thelemapedia: calendar", url: "https://thelemapedia.org/index.php/Calendar" },
    ],
  },
  {
    id: "asatru-runic",
    title: "Ásatrú / runic dating",
    shortTitle: "Ásatrú / Runic",
    group: "modern",
    origin: "Modern Ásatrú communities draw on Norse sources, seasonal observances, and diverse reconstructions; there is no single historical Ásatrú calendar.",
    community: "Modern Heathen and Ásatrú communities, which do not share one binding calendar.",
    mechanics: "Medieval runic calendars survive as computus instruments for Christian calendrical calculation. A modern “Runic Year” era of CE + 250 is a later convention, not an ancient epoch.",
    moonRelationship: "Some modern observances use lunar or seasonal timing, but practice varies by community.",
    status2026: "No canonical 2026 date is generated. This library marks the proposed CE + 250 era as a modern convention only.",
    funFact: "The surviving Swedish runic calendars are called primstaves and record recurring calendar information with runes.",
    support: "not-a-calendar",
    supportLabel: "No shared calendar; modern reconstructions",
    followable: false,
    monthStructure: "Varies by community; no historically verified universal month grid.",
    sources: [
      { title: "Brill: Ásatrú – An Academic Religion?", url: "https://brill.com/downloadpdf/display/book/9789004309517/B9789004309517-s010.pdf" },
      { title: "Asatru Folk Assembly: runic calendars", url: "https://asatrufolkassembly.substack.com/p/the-holidays-of-asatru" },
    ],
  },
  {
    id: "french-republican",
    title: "French Republican",
    shortTitle: "French Republican",
    group: "reform",
    origin: "A French Revolutionary solar calendar adopted in 1793 and retrospectively dated from the proclamation of the Republic on 22 September 1792.",
    community: "Revolutionary France; it was abandoned by Napoleon in 1806.",
    mechanics: "12 months of 30 days divided into three 10-day décades, followed by five or six complementary days. A modern display needs the Paris equinox rule for exact historical conversion.",
    moonRelationship: "Solar and decimal, not lunar.",
    status2026: "A proleptic display would place 10 November 2026 around 20 Brumaire, Year 235, but this is explicitly an approximation outside its historical period.",
    funFact: "The month names came from seasonal phenomena such as mist, frost, rain, harvest, and flowers.",
    support: "approximate",
    supportLabel: "Approximate proleptic conversion",
    followable: false,
    monthStructure: "12 × 30 days + 5/6 complementary days; 10-day décades.",
    sources: [
      { title: "French National Assembly: Republican calendar decree", url: "https://www.assemblee-nationale.fr/dyn/histoire-et-patrimoine/revolution-francaise/convention-nationale-et-calendrier-republicain" },
      { title: "Cambridge: note on the French Republican calendar", url: "https://www.cambridge.org/core/books/abs/new-cambridge-modern-history/note-on-the-french-republican-calendar/99064365AD68DC306793F4BA9AD9997E" },
    ],
  },
  {
    id: "international-fixed",
    title: "International Fixed / Cotsworth",
    shortTitle: "International Fixed",
    group: "reform",
    origin: "Moses B. Cotsworth proposed this calendar reform in the early twentieth century and promoted it through calendar-reform leagues.",
    community: "A historical reform movement; it was never adopted as an international civil calendar.",
    mechanics: "13 months of 28 days, plus a Year Day and a Leap Day outside the regular week. The proposed extra month, Sol, sits between June and July.",
    moonRelationship: "A fixed solar reform. Its 28-day months are a regular planning grid, not actual lunar months.",
    status2026: "Not a civil calendar in 2026; SÚE uses its 13 × 28 planning idea while keeping lunar claims separate.",
    funFact: "Cotsworth called the extra month Sol and placed it between June and July, keeping the month names tied to the seasons.",
    support: "calculated",
    supportLabel: "Reform proposal; not civil",
    followable: true,
    monthStructure: "13 × 28 days + Year Day; Leap Day after month 6 in leap years.",
    sources: [
      { title: "University of British Columbia: Moses Cotsworth fonds", url: UBC_COTSWORTH },
      { title: "Library and Archives Canada: Cotsworth proposals", url: "https://recherche-collection-search.bac-lac.gc.ca/eng/home/record?app=fonandcol&idnumber=2095199" },
    ],
  },
  {
    id: "positivist",
    title: "Positivist",
    shortTitle: "Positivist",
    group: "reform",
    origin: "Auguste Comte proposed the Positivist Calendar in 1849 as part of a secular commemorative religion.",
    community: "The historical Positivist movement and its later small communities.",
    mechanics: "13 months of 28 days, with one or two complementary festival days outside the week. Months and days carry names connected to historical people and movements.",
    moonRelationship: "Solar reform; the 28-day month is not a measured lunation.",
    status2026: "A historical proposal, not an active civil calendar. It would map 2026 to its own commemorative year only by the proposal’s era convention.",
    funFact: "The extra annual day was a Festival of All the Dead, while the leap-year festival honored Holy Women.",
    support: "calculated",
    supportLabel: "Reform proposal; not civil",
    followable: true,
    monthStructure: "13 × 28 days + 1/2 complementary festival days.",
    sources: [
      { title: "Auguste Comte’s 1849 primary text", url: "https://archive.org/details/calendrierposit00comtgoog" },
      { title: "Positivist calendar transcription", url: "http://positivists.org/calendar.html" },
      { title: "Persée: Les calendriers positivistes", url: "https://www.persee.fr/doc/abpo_0399-0826_1976_num_83_2_2819" },
    ],
  },
  {
    id: "ophiuchus",
    title: "Ophiuchus / “Cosmic Harmony”",
    shortTitle: "Ophiuchus",
    group: "reform",
    origin: "Ophiuchus is an astronomical constellation and has been proposed by some modern astrologers as a 13th zodiac sign.",
    community: "A minority of modern astrological systems; “Calendar of Cosmic Harmony” is not an established historical calendar name.",
    mechanics: "There is no single calendar algorithm. Traditional tropical astrology divides the ecliptic into twelve equal signs; constellation-boundary systems produce different, unequal date ranges.",
    moonRelationship: "Zodiac/solar-position framing, not a lunar calendar.",
    status2026: "No 2026 calendar conversion is generated. The “Calendar of Cosmic Harmony” label is treated as an unsupported modern proposal, not an ancient tradition.",
    funFact: "Ptolemy included Ophiuchus among the constellations, even though the traditional twelve-sign zodiac did not make it a thirteenth sign.",
    support: "not-a-calendar",
    supportLabel: "Not a calendar; modern proposal",
    followable: false,
    monthStructure: "No agreed month structure; constellation boundaries and zodiac signs are different systems.",
    sources: [
      { title: "Astronomy.com: the 13th sign?", url: "https://www.astronomy.com/observing/the-13th-sign/" },
      { title: "IAU constellation boundaries", url: "https://www.iau.org/public/themes/constellations/" },
    ],
  },
  {
    id: "celtic-tree",
    title: "Celtic Tree calendar",
    shortTitle: "Celtic Tree",
    group: "reform",
    origin: "The familiar 13-tree month calendar was developed by Robert Graves in The White Goddess (1948), drawing speculatively on Ogham and earlier writings.",
    community: "A modern neo-pagan and literary reconstruction, not a verified ancient Celtic calendar.",
    mechanics: "Popular versions assign 13 lunar-looking periods to trees, but the month boundaries and tree correspondences are modern constructions.",
    moonRelationship: "Modern versions frame the periods as lunar; no ancient Irish evidence establishes this 13-month calendar.",
    status2026: "No historical 2026 conversion is generated. The tree-month system is marked as a modern, contested reconstruction.",
    funFact: "Ogham is a real medieval Irish writing system, but the surviving letter names do not support the claim that all 25 letters were ancient tree months.",
    support: "not-a-calendar",
    supportLabel: "Modern reconstruction; contested",
    followable: false,
    monthStructure: "Popular versions use 13 periods; the historical evidence does not establish their month lengths.",
    sources: [
      { title: "EAZ: The Celtic Tree Calendar – development and reception", url: "https://www.eaz-journal.org/index.php/eaz/article/view/354" },
      { title: "EAZ article PDF", url: "https://www.jna.uni-kiel.de/index.php/eaz/article/download/354/437/2027" },
      { title: "Mary Jones: Celtic Tree Calendar critique", url: "https://www.maryjones.us/jce/celtictreecalendar.html" },
    ],
  },
];

export const COMPANION_CALENDARS = CALENDARS;
export const COMPANION_GROUP_LABELS = GROUP_LABELS;
export const COMPANION_CALENDAR_IDS = CALENDARS.map((calendar) => calendar.id);

export function isCompanionCalendarId(
  value: unknown,
): value is CompanionCalendarId {
  return typeof value === "string" && COMPANION_CALENDAR_IDS.includes(value as CompanionCalendarId);
}

export function isCompanionCalendarMode(
  value: unknown,
): value is CompanionCalendarMode {
  return value === "companion" || value === "follow";
}

export function companionCalendarInfo(
  id: CompanionCalendarId,
): CompanionCalendarInfo {
  return CALENDARS.find((calendar) => calendar.id === id) ?? CALENDARS[0];
}

export function companionGroupLabel(group: CompanionCalendarGroup): string {
  return GROUP_LABELS[group];
}

function dateParts(iso: string): {
  year: number;
  month: number;
  day: number;
} {
  return parseISODate(iso);
}

function monthDayLabel(month: number, day: number): string {
  const names = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return `${names[month - 1]} ${day}`;
}

function formatIntlCalendarDate(
  iso: string,
  calendar: string,
): { label: string; month: string | null; day: number | null; year: number | null } {
  const { year, month, day } = dateParts(iso);
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  const formatter = new Intl.DateTimeFormat(`en-US-u-ca-${calendar}`, {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
    day: "numeric",
    era: "short",
  });
  const parts = formatter.formatToParts(date);
  return {
    label: formatter.format(date),
    month: parts.find((part) => part.type === "month")?.value ?? null,
    day: Number(parts.find((part) => part.type === "day")?.value ?? "") || null,
    year: Number(parts.find((part) => part.type === "year")?.value ?? "") || null,
  };
}

function gregorianJulianDay(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

function julianDateFromJdn(jdn: number): {
  year: number;
  month: number;
  day: number;
} {
  const b = jdn + 1524;
  const c = Math.floor((b - 122.1) / 365.25);
  const d = Math.floor(365.25 * c);
  const e = Math.floor((b - d) / 30.6001);
  const day = b - d - Math.floor(30.6001 * e);
  const month = e < 14 ? e - 1 : e - 13;
  const year = month > 2 ? c - 4716 : c - 4715;
  return { year, month, day };
}

export function julianDateForGregorian(iso: string): {
  year: number;
  month: number;
  day: number;
} {
  const { year, month, day } = dateParts(iso);
  return julianDateFromJdn(gregorianJulianDay(year, month, day));
}

const MAYA_EPOCH_JDN = 584283;

export function mayaLongCountForDate(iso: string): string {
  const { year, month, day } = dateParts(iso);
  const days = gregorianJulianDay(year, month, day) - MAYA_EPOCH_JDN;
  if (days < 0) return "before 0.0.0.0.0";
  let remaining = days;
  const values: number[] = [];
  for (const unit of [144000, 7200, 360, 20, 1]) {
    values.push(Math.floor(remaining / unit));
    remaining %= unit;
  }
  return values.join(".");
}

const BENGALI_MONTHS = [
  "Boishakh",
  "Joishtho",
  "Asharh",
  "Srabon",
  "Bhadro",
  "Ashwin",
  "Kartik",
  "Ogrohayon",
  "Poush",
  "Magh",
  "Falgun",
  "Choitro",
];

function dateDiffInDays(start: string, end: string): number {
  const startParts = dateParts(start);
  const endParts = dateParts(end);
  return (
    gregorianJulianDay(endParts.year, endParts.month, endParts.day) -
    gregorianJulianDay(startParts.year, startParts.month, startParts.day)
  );
}

export function bangladeshBengaliDateForGregorian(iso: string): {
  year: number;
  month: string;
  day: number;
} {
  const { year, month, day } = dateParts(iso);
  const banglaYearStartYear = month > 4 || (month === 4 && day >= 14) ? year : year - 1;
  const start = `${banglaYearStartYear}-04-14`;
  const dayOfYear = dateDiffInDays(start, iso);
  const monthLengths = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, isLeapYear(year) ? 30 : 29, 30];
  let remaining = dayOfYear;
  for (let index = 0; index < monthLengths.length; index += 1) {
    if (remaining < monthLengths[index]) {
      return {
        year: banglaYearStartYear - 593,
        month: BENGALI_MONTHS[index],
        day: remaining + 1,
      };
    }
    remaining -= monthLengths[index];
  }
  throw new Error(`Bengali date out of range: ${iso}`);
}

const MALAYALAM_MONTHS = [
  "Chingam",
  "Kanni",
  "Thulam",
  "Vrischikam",
  "Dhanu",
  "Makaram",
  "Kumbham",
  "Meenam",
  "Medam",
  "Edavam",
  "Mithunam",
  "Karkidakam",
];

function malayalamDateForGregorian(iso: string): {
  year: number;
  month: string;
  day: number;
} {
  const { year, month, day } = dateParts(iso);
  const startYear = month > 8 || (month === 8 && day >= 17) ? year : year - 1;
  const starts = [
    `${startYear}-08-17`,
    `${startYear}-09-17`,
    `${startYear}-10-17`,
    `${startYear}-11-16`,
    `${startYear}-12-16`,
    `${startYear + 1}-01-15`,
    `${startYear + 1}-02-13`,
    `${startYear + 1}-03-15`,
    `${startYear + 1}-04-14`,
    `${startYear + 1}-05-15`,
    `${startYear + 1}-06-15`,
    `${startYear + 1}-07-16`,
    `${startYear + 1}-08-17`,
  ];
  const index = Math.max(
    0,
    starts.findIndex((start, i) => i < starts.length - 1 && iso >= start && iso < starts[i + 1]),
  );
  return {
    year: startYear - 824,
    month: MALAYALAM_MONTHS[index],
    day: dateDiffInDays(starts[index], iso) + 1,
  };
}

function romanNumeral(value: number): string {
  if (value === 0) return "0";
  const numerals: [number, string][] = [
    [10, "x"],
    [9, "ix"],
    [5, "v"],
    [4, "iv"],
    [1, "i"],
  ];
  let remaining = value;
  let result = "";
  for (const [unit, glyph] of numerals) {
    while (remaining >= unit) {
      result += glyph;
      remaining -= unit;
    }
  }
  return result;
}

const FRENCH_MONTHS = [
  "Vendémiaire",
  "Brumaire",
  "Frimaire",
  "Nivôse",
  "Pluviôse",
  "Ventôse",
  "Germinal",
  "Floréal",
  "Prairial",
  "Messidor",
  "Thermidor",
  "Fructidor",
];

function frenchRepublicanDateForGregorian(iso: string): {
  year: number;
  label: string;
} {
  const { year, month, day } = dateParts(iso);
  const startYear = month > 9 || (month === 9 && day >= 22) ? year : year - 1;
  const start = `${startYear}-09-22`;
  const index = dateDiffInDays(start, iso);
  if (index >= 360) {
    return {
      year: startYear - 1791,
      label: `${index - 359} complementary day, Year ${startYear - 1791}`,
    };
  }
  const monthIndex = Math.floor(index / 30);
  return {
    year: startYear - 1791,
    label: `${(index % 30) + 1} ${FRENCH_MONTHS[monthIndex]}, Year ${startYear - 1791}`,
  };
}

function dateWithEra(
  iso: string,
  calendar: CompanionCalendarId,
  label: string,
  year: number,
  detail: string,
  support: CompanionSupport,
  monthStructure: string,
): CompanionDate {
  const { day } = dateParts(iso);
  return {
    calendar,
    label,
    detail,
    support,
    month: null,
    day,
    year,
    monthStructure,
  };
}

export function formatCompanionDate(
  iso: string,
  calendar: CompanionCalendarId,
  timeZone = "local",
): CompanionDate {
  void timeZone;
  const info = companionCalendarInfo(calendar);
  const parts = dateParts(iso);
  const monthDay = monthDayLabel(parts.month, parts.day);

  const intlCalendars: Partial<Record<CompanionCalendarId, string>> = {
    gregorian: "gregory",
    ethiopian: "ethiopic",
    minguo: "roc",
    buddhist: "buddhist",
    hebrew: "hebrew",
    islamic: "islamic-civil",
    persian: "persian",
    coptic: "coptic",
    saka: "indian",
    chinese: "chinese",
    japanese: "japanese",
  };
  const intlCalendar = intlCalendars[calendar];
  if (intlCalendar) {
    const result = formatIntlCalendarDate(iso, intlCalendar);
    return {
      calendar,
      label: result.label,
      detail: info.supportLabel,
      support: info.support,
      month: result.month,
      day: result.day,
      year: result.year,
      monthStructure: info.monthStructure,
    };
  }

  if (calendar === "julian") {
    const julian = julianDateForGregorian(iso);
    return {
      calendar,
      label: `${monthDayLabel(julian.month, julian.day)} ${julian.year} (Julian)`,
      detail: info.supportLabel,
      support: info.support,
      month: monthDayLabel(julian.month, 1).replace(/ 1$/, ""),
      day: julian.day,
      year: julian.year,
      monthStructure: info.monthStructure,
    };
  }

  if (calendar === "juche") {
    return {
      calendar,
      label: `${monthDay} ${parts.year - 1911} Juche`,
      detail: info.supportLabel,
      support: info.support,
      month: null,
      day: parts.day,
      year: parts.year - 1911,
      monthStructure: info.monthStructure,
    };
  }

  if (calendar === "vikram-samvat") {
    const year = parts.year + 57;
    return {
      calendar,
      label: `≈ ${monthDay} ${year} VS`,
      detail: "Regional year and month rules differ; month/day is not calculated.",
      support: info.support,
      month: null,
      day: null,
      year,
      monthStructure: info.monthStructure,
    };
  }

  if (calendar === "kali-yuga") {
    const year = parts.year + 3102;
    return {
      calendar,
      label: `${monthDay} · Kali Yuga ${year}`,
      detail: info.supportLabel,
      support: info.support,
      month: null,
      day: parts.day,
      year,
      monthStructure: info.monthStructure,
    };
  }

  if (calendar === "bengali") {
    const bengali = bangladeshBengaliDateForGregorian(iso);
    return {
      calendar,
      label: `${bengali.month} ${bengali.day}, ${bengali.year} Bangabda`,
      detail: info.supportLabel,
      support: info.support,
      month: bengali.month,
      day: bengali.day,
      year: bengali.year,
      monthStructure: info.monthStructure,
    };
  }

  if (calendar === "malayalam") {
    const malayalam = malayalamDateForGregorian(iso);
    return {
      calendar,
      label: `≈ ${malayalam.month} ${malayalam.day}, ${malayalam.year} ME`,
      detail: info.supportLabel,
      support: info.support,
      month: malayalam.month,
      day: malayalam.day,
      year: malayalam.year,
      monthStructure: info.monthStructure,
    };
  }

  if (calendar === "maya-long-count") {
    return {
      calendar,
      label: mayaLongCountForDate(iso),
      detail: "GMT 584283 correlation; historically useful but provisional.",
      support: info.support,
      month: null,
      day: null,
      year: null,
      monthStructure: info.monthStructure,
    };
  }

  if (calendar === "roman-auc") {
    const year = parts.year + 753;
    return dateWithEra(
      iso,
      calendar,
      `${year} AUC · ${monthDay}`,
      year,
      info.supportLabel,
      info.support,
      info.monthStructure,
    );
  }

  if (calendar === "holocene") {
    const year = parts.year + 10000;
    return dateWithEra(
      iso,
      calendar,
      `${year} HE · ${monthDay}`,
      year,
      info.supportLabel,
      info.support,
      info.monthStructure,
    );
  }

  if (calendar === "thelemic") {
    const afterEquinox = parts.month > 3 || (parts.month === 3 && parts.day >= 20);
    const commonYear = afterEquinox ? parts.year : parts.year - 1;
    const elapsed = Math.max(0, commonYear - 1904);
    const docosade = Math.floor(elapsed / 22);
    const within = elapsed % 22;
    return {
      calendar,
      label: `Anno ${romanNumeral(docosade)}:${romanNumeral(within)} A.N.`,
      detail: "Thelemic year begins near the northern-hemisphere vernal equinox; Sun/Moon positions are not calculated here.",
      support: info.support,
      month: null,
      day: null,
      year: commonYear - 1904,
      monthStructure: info.monthStructure,
    };
  }

  if (calendar === "french-republican") {
    const french = frenchRepublicanDateForGregorian(iso);
    return {
      calendar,
      label: french.label,
      detail: info.supportLabel,
      support: info.support,
      month: null,
      day: null,
      year: french.year,
      monthStructure: info.monthStructure,
    };
  }

  if (calendar === "international-fixed") {
    const dayOfYear = gregorianJulianDay(parts.year, parts.month, parts.day) - gregorianJulianDay(parts.year, 1, 1);
    const special = dayOfYear === 364 || (isLeapYear(parts.year) && dayOfYear === 168);
    if (special) {
      return {
        calendar,
        label: dayOfYear === 364 ? "Year Day" : "Leap Day",
        detail: info.supportLabel,
        support: info.support,
        month: null,
        day: null,
        year: parts.year,
        monthStructure: info.monthStructure,
      };
    }
    const adjusted = isLeapYear(parts.year) && dayOfYear > 168 ? dayOfYear - 1 : dayOfYear;
    const month = Math.floor(adjusted / 28) + 1;
    const day = (adjusted % 28) + 1;
    return {
      calendar,
      label: `Month ${month}, day ${day} · ${parts.year}`,
      detail: info.supportLabel,
      support: info.support,
      month: `Month ${month}`,
      day,
      year: parts.year,
      monthStructure: info.monthStructure,
    };
  }

  if (calendar === "positivist") {
    const dayOfYear = gregorianJulianDay(parts.year, parts.month, parts.day) - gregorianJulianDay(parts.year, 1, 1);
    const adjusted = isLeapYear(parts.year) && dayOfYear > 364 ? dayOfYear - 1 : dayOfYear;
    if (dayOfYear === 364 || (isLeapYear(parts.year) && dayOfYear === 365)) {
      return {
        calendar,
        label: "Festival day · Positivist year",
        detail: info.supportLabel,
        support: info.support,
        month: null,
        day: null,
        year: parts.year,
        monthStructure: info.monthStructure,
      };
    }
    return {
      calendar,
      label: `Month ${Math.floor(adjusted / 28) + 1}, day ${(adjusted % 28) + 1} · ${parts.year}`,
      detail: info.supportLabel,
      support: info.support,
      month: `Month ${Math.floor(adjusted / 28) + 1}`,
      day: (adjusted % 28) + 1,
      year: parts.year,
      monthStructure: info.monthStructure,
    };
  }

  return {
    calendar,
    label: info.title,
    detail: info.status2026,
    support: info.support,
    month: null,
    day: null,
    year: null,
    monthStructure: info.monthStructure,
  };
}
