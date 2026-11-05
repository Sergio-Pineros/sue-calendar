import { addDays } from "./iso-date";
import type { ExternalEvent } from "./types";

const ICLOUD_ROOT = "https://caldav.icloud.com/";

export type CalDavCalendar = {
  url: string;
  name: string;
  color: string;
};

export type CalDavDraft = {
  title: string;
  description?: string;
  start: string;
  end: string;
  allDay: boolean;
};

function authHeader(appleId: string, appPassword: string): string {
  return `Basic ${Buffer.from(`${appleId}:${appPassword}`).toString("base64")}`;
}

function hrefText(xml: string, tag: string): string | null {
  const match = new RegExp(`<(?:[A-Za-z0-9]+:)?${tag}[^>]*>([\\s\\S]*?)</(?:[A-Za-z0-9]+:)?${tag}>`, "i").exec(
    xml,
  );
  if (!match) return null;
  const href = /<(?:[A-Za-z0-9]+:)?href[^>]*>([\s\S]*?)<\/(?:[A-Za-z0-9]+:)?href>/i.exec(
    match[1],
  );
  return (href?.[1] ?? match[1]).replace(/<[^>]+>/g, "").trim() || null;
}

function allTagText(xml: string, tag: string): string[] {
  const out: string[] = [];
  const re = new RegExp(
    `<(?:[A-Za-z0-9]+:)?${tag}[^>]*>([\\s\\S]*?)</(?:[A-Za-z0-9]+:)?${tag}>`,
    "gi",
  );
  let match: RegExpExecArray | null;
  while ((match = re.exec(xml))) {
    out.push(match[1].replace(/<[^>]+>/g, "").trim());
  }
  return out.filter(Boolean);
}

function resolveUrl(base: string, href: string): string {
  if (/^https?:\/\//i.test(href)) return href;
  return new URL(href, base).toString();
}

async function dav(
  url: string,
  appleId: string,
  appPassword: string,
  method: string,
  body: string,
  extra: Record<string, string> = {},
): Promise<{ status: number; text: string; url: string }> {
  const res = await fetch(url, {
    method,
    redirect: "follow",
    headers: {
      Authorization: authHeader(appleId, appPassword),
      Depth: extra.Depth ?? "0",
      "Content-Type": extra["Content-Type"] ?? "application/xml; charset=utf-8",
      ...extra,
    },
    body,
  });
  const text = await res.text();
  return { status: res.status, text, url: res.url || url };
}

export async function discoverCalendars(
  appleId: string,
  appPassword: string,
): Promise<CalDavCalendar[]> {
  const principalBody = `<?xml version="1.0" encoding="UTF-8"?>
<d:propfind xmlns:d="DAV:">
  <d:prop><d:current-user-principal/></d:prop>
</d:propfind>`;
  const root = await dav(ICLOUD_ROOT, appleId, appPassword, "PROPFIND", principalBody);
  if (root.status === 401 || root.status === 403) {
    throw new Error("Apple ID or app-specific password was rejected.");
  }
  if (root.status >= 400) {
    throw new Error(`iCloud CalDAV principal lookup failed (${root.status}).`);
  }
  const principalHref = hrefText(root.text, "current-user-principal");
  if (!principalHref) {
    throw new Error("iCloud did not return a CalDAV principal.");
  }
  const principalUrl = resolveUrl(root.url, principalHref);

  const homeBody = `<?xml version="1.0" encoding="UTF-8"?>
<d:propfind xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:prop><c:calendar-home-set/></d:prop>
</d:propfind>`;
  const home = await dav(principalUrl, appleId, appPassword, "PROPFIND", homeBody);
  const homeHref = hrefText(home.text, "calendar-home-set");
  if (!homeHref) {
    throw new Error("iCloud did not return a calendar home.");
  }
  const homeUrl = resolveUrl(home.url, homeHref);

  const listBody = `<?xml version="1.0" encoding="UTF-8"?>
<d:propfind xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav" xmlns:cs="http://calendarserver.org/ns/" xmlns:x="http://apple.com/ns/ical/">
  <d:prop>
    <d:displayname/>
    <d:resourcetype/>
    <x:calendar-color/>
    <cs:getctag/>
  </d:prop>
</d:propfind>`;
  const list = await dav(homeUrl, appleId, appPassword, "PROPFIND", listBody, {
    Depth: "1",
  });

  const responses = list.text.split(/<(?:[A-Za-z0-9]+:)?response[\s>]/i).slice(1);
  const calendars: CalDavCalendar[] = [];
  for (const block of responses) {
    const isCalendar = /<(?:[A-Za-z0-9]+:)?calendar(?:\s|\/|>)/i.test(block);
    if (!isCalendar) continue;
    const href = /<(?:[A-Za-z0-9]+:)?href[^>]*>([\s\S]*?)<\/(?:[A-Za-z0-9]+:)?href>/i.exec(
      block,
    )?.[1];
    if (!href) continue;
    const name =
      allTagText(block, "displayname")[0] || decodeURIComponent(href).split("/").filter(Boolean).pop() || "Calendar";
    const color = allTagText(block, "calendar-color")[0] || "#C4A574";
    calendars.push({
      url: resolveUrl(homeUrl, href.trim()),
      name,
      color,
    });
  }
  return calendars;
}

function icsDateFromLine(line: string): { iso: string; allDay: boolean } {
  const value = line.slice(line.indexOf(":") + 1).trim();
  if (/^\d{8}$/.test(value)) {
    return {
      iso: `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`,
      allDay: true,
    };
  }
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/.exec(value);
  if (m) {
    return {
      iso: `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}`,
      allDay: false,
    };
  }
  return { iso: value.slice(0, 10), allDay: true };
}

function parseCalendarData(ics: string, calendar: CalDavCalendar): ExternalEvent[] {
  const blocks = ics.split("BEGIN:VEVENT").slice(1);
  return blocks.map((block, index) => {
    const body = block.split("END:VEVENT")[0] ?? block;
    const lines = body.replace(/\r\n[ \t]/g, "").split(/\r?\n/);
    const get = (name: string) => {
      const line = lines.find((item) => item.startsWith(name));
      return line ? line.slice(line.indexOf(":") + 1).trim() : "";
    };
    const startLine = lines.find((line) => line.startsWith("DTSTART")) ?? "";
    const endLine = lines.find((line) => line.startsWith("DTEND")) ?? "";
    const start = startLine
      ? icsDateFromLine(startLine)
      : { iso: "", allDay: true };
    const end = endLine ? icsDateFromLine(endLine) : start;
    const uid = get("UID") || `apple-${index}`;
    return {
      id: `apple-${calendar.url}-${uid}`,
      source: "apple" as const,
      sourceEventId: uid,
      calendarId: calendar.url,
      calendarName: calendar.name,
      title: get("SUMMARY") || "Untitled",
      description: get("DESCRIPTION").replace(/\\n/g, "\n"),
      start: start.iso,
      end: end.iso || start.iso,
      timezone: "UTC",
      allDay: start.allDay,
      location: get("LOCATION"),
      color: calendar.color,
    };
  }).filter((event) => event.start);
}

export async function fetchCalDavEvents(
  appleId: string,
  appPassword: string,
  calendars: CalDavCalendar[],
  year: number,
): Promise<ExternalEvent[]> {
  const start = `${year}0101T000000Z`;
  const end = `${year}1231T235959Z`;
  const query = `<?xml version="1.0" encoding="UTF-8"?>
<c:calendar-query xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:prop>
    <d:getetag/>
    <c:calendar-data/>
  </d:prop>
  <c:filter>
    <c:comp-filter name="VCALENDAR">
      <c:comp-filter name="VEVENT">
        <c:time-range start="${start}" end="${end}"/>
      </c:comp-filter>
    </c:comp-filter>
  </c:filter>
</c:calendar-query>`;

  const batches = await Promise.all(
    calendars.map(async (calendar) => {
      const res = await dav(calendar.url, appleId, appPassword, "REPORT", query, {
        Depth: "1",
      });
      if (res.status >= 400) return [] as ExternalEvent[];
      const chunks = res.text.split(/<(?:[A-Za-z0-9]+:)?calendar-data[^>]*>/i).slice(1);
      const events: ExternalEvent[] = [];
      for (const chunk of chunks) {
        const ics = chunk.split(/<\/(?:[A-Za-z0-9]+:)?calendar-data>/i)[0] ?? "";
        events.push(...parseCalendarData(ics, calendar));
      }
      return events;
    }),
  );
  return batches.flat();
}

export async function createCalDavEvent(
  appleId: string,
  appPassword: string,
  calendar: CalDavCalendar,
  draft: CalDavDraft,
): Promise<ExternalEvent> {
  const uid = crypto.randomUUID();
  const stamp = (iso: string, allDay: boolean) =>
    allDay ? iso.replace(/-/g, "").slice(0, 8) : iso.replace(/[-:]/g, "").slice(0, 15);
  const start = stamp(draft.start, draft.allDay);
  const end = stamp(draft.end || (draft.allDay ? addDays(draft.start.slice(0, 10), 1) : draft.start), draft.allDay);
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SUE//EN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z")}`,
    draft.allDay ? `DTSTART;VALUE=DATE:${start}` : `DTSTART:${start}`,
    draft.allDay ? `DTEND;VALUE=DATE:${end}` : `DTEND:${end}`,
    `SUMMARY:${draft.title.replace(/\n/g, " ")}`,
    draft.description ? `DESCRIPTION:${draft.description.replace(/\n/g, "\\n")}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");

  const url = `${calendar.url.replace(/\/?$/, "/")}${uid}.ics`;
  const res = await dav(url, appleId, appPassword, "PUT", ics, {
    "Content-Type": "text/calendar; charset=utf-8",
    "If-None-Match": "*",
  });
  if (res.status >= 400) {
    throw new Error(`iCloud rejected the new event (${res.status}).`);
  }
  return {
    id: `apple-${calendar.url}-${uid}`,
    source: "apple",
    sourceEventId: uid,
    calendarId: calendar.url,
    calendarName: calendar.name,
    title: draft.title,
    description: draft.description ?? "",
    start: draft.start,
    end: draft.end,
    timezone: "local",
    allDay: draft.allDay,
    location: "",
    color: calendar.color,
  };
}
