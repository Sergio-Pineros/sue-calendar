import type { ExternalEvent } from "./types";
import { copy } from "./copy";

const SCOPE = "https://www.googleapis.com/auth/calendar";

type TokenClient = {
  requestAccessToken: (override?: { prompt?: string }) => void;
};

export type GoogleCalendarInfo = {
  id: string;
  summary: string;
  backgroundColor: string;
  primary: boolean;
};

export type GoogleEventDraft = {
  title: string;
  description?: string;
  start: string;
  end: string;
  allDay: boolean;
  location?: string;
};

let accessToken: string | null = null;

function loadGis(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(
      'script[src*="accounts.google.com/gsi/client"]',
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Could not load Google Identity"));
    document.head.appendChild(script);
  });
}

export function googleClientId(): string | undefined {
  const value = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();
  return value || undefined;
}

async function googleJson<T>(
  url: string,
  token: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    if (res.status === 401) accessToken = null;
    throw new Error(`Google Calendar responded ${res.status}`);
  }
  if (res.status === 204) return {} as T;
  return res.json() as Promise<T>;
}

export async function requestGoogleToken(force = false): Promise<string> {
  const clientId = googleClientId();
  if (!clientId) {
    throw new Error("Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID");
  }
  await loadGis();
  const google = window.google;
  if (!google?.accounts?.oauth2) {
    throw new Error("Google Identity is not available");
  }
  if (accessToken && !force) return accessToken;

  return new Promise((resolve, reject) => {
    const client: TokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPE,
      callback: (response: { access_token?: string; error?: string }) => {
        if (!response.access_token) {
          reject(new Error(response.error || "No Google token"));
          return;
        }
        accessToken = response.access_token;
        resolve(response.access_token);
      },
    });
    client.requestAccessToken(force ? { prompt: "consent" } : undefined);
  });
}

export async function listGoogleCalendars(
  token?: string,
): Promise<GoogleCalendarInfo[]> {
  const access = token ?? (await requestGoogleToken());
  const list = await googleJson<{
    items?: {
      id: string;
      summary?: string;
      backgroundColor?: string;
      primary?: boolean;
      selected?: boolean;
    }[];
  }>("https://www.googleapis.com/calendar/v3/users/me/calendarList", access);

  return (list.items ?? []).map((item) => ({
    id: item.id,
    summary: item.summary || item.id,
    backgroundColor: item.backgroundColor || "#C4A574",
    primary: Boolean(item.primary),
  }));
}

export async function fetchGoogleEvents(
  year: number,
  calendarIds: string[],
  token?: string,
): Promise<ExternalEvent[]> {
  const access = token ?? (await requestGoogleToken());
  const calendars = await listGoogleCalendars(access);
  const selected = calendars.filter((calendar) =>
    calendarIds.includes(calendar.id),
  );
  const timeMin = `${year}-01-01T00:00:00Z`;
  const timeMax = `${year}-12-31T23:59:59Z`;

  const batches = await Promise.all(
    selected.map((calendar) =>
      readCalendarEvents(access, calendar, timeMin, timeMax),
    ),
  );
  return batches.flat();
}

async function readCalendarEvents(
  token: string,
  calendar: GoogleCalendarInfo,
  timeMin: string,
  timeMax: string,
): Promise<ExternalEvent[]> {
  const events: ExternalEvent[] = [];
  let pageToken: string | undefined;

  do {
    const url = new URL(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.id)}/events`,
    );
    url.searchParams.set("timeMin", timeMin);
    url.searchParams.set("timeMax", timeMax);
    url.searchParams.set("singleEvents", "true");
    url.searchParams.set("orderBy", "startTime");
    url.searchParams.set("maxResults", "2500");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const data = await googleJson<{
      nextPageToken?: string;
      items?: {
        id?: string;
        status?: string;
        summary?: string;
        description?: string;
        location?: string;
        start?: { date?: string; dateTime?: string; timeZone?: string };
        end?: { date?: string; dateTime?: string };
      }[];
    }>(url.toString(), token);

    for (const item of data.items ?? []) {
      if (item.status === "cancelled" || !item.id) continue;
      const start = item.start?.date || item.start?.dateTime || "";
      const end = item.end?.date || item.end?.dateTime || start;
      if (!start) continue;
      events.push({
        id: `gcal-${calendar.id}-${item.id}`,
        source: "google",
        sourceEventId: item.id,
        calendarId: calendar.id,
        calendarName: calendar.summary,
        title: item.summary || copy.event.untitled,
        description: item.description || "",
        start,
        end,
        timezone: item.start?.timeZone || "UTC",
        allDay: Boolean(item.start?.date),
        location: item.location || "",
        color: calendar.backgroundColor,
      });
    }
    pageToken = data.nextPageToken;
  } while (pageToken);

  return events;
}

export async function createGoogleEvent(
  calendarId: string,
  draft: GoogleEventDraft,
  calendarName = "Google",
  color = "#C4A574",
): Promise<ExternalEvent> {
  const access = await requestGoogleToken();
  const body = draft.allDay
    ? {
        summary: draft.title,
        description: draft.description ?? "",
        location: draft.location ?? "",
        start: { date: draft.start.slice(0, 10) },
        end: { date: draft.end.slice(0, 10) },
      }
    : {
        summary: draft.title,
        description: draft.description ?? "",
        location: draft.location ?? "",
        start: { dateTime: draft.start },
        end: { dateTime: draft.end },
      };

  const created = await googleJson<{
    id?: string;
    start?: { date?: string; dateTime?: string; timeZone?: string };
    end?: { date?: string; dateTime?: string };
  }>(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    access,
    { method: "POST", body: JSON.stringify(body) },
  );

  const start = created.start?.date || created.start?.dateTime || draft.start;
  const end = created.end?.date || created.end?.dateTime || draft.end;
  return {
    id: `gcal-${calendarId}-${created.id ?? draft.title}`,
    source: "google",
    sourceEventId: created.id ?? "",
    calendarId,
    calendarName,
    title: draft.title,
    description: draft.description ?? "",
    start,
    end,
    timezone: created.start?.timeZone || "UTC",
    allDay: draft.allDay,
    location: draft.location ?? "",
    color,
  };
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: {
              access_token?: string;
              error?: string;
            }) => void;
          }) => TokenClient;
        };
      };
    };
  }
}
