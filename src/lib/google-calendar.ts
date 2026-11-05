import type { ExternalEvent } from "./types";

const SCOPE = "https://www.googleapis.com/auth/calendar.readonly";

type TokenClient = {
  requestAccessToken: (override?: { prompt?: string }) => void;
};

export type GoogleCalendarInfo = {
  id: string;
  summary: string;
  backgroundColor: string;
  primary: boolean;
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
      reject(new Error("No se pudo cargar Google Identity"));
    document.head.appendChild(script);
  });
}

export function googleClientId(): string | undefined {
  const value = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();
  return value || undefined;
}

async function googleJson<T>(url: string, token: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    if (res.status === 401) accessToken = null;
    throw new Error(`Google Calendar respondió ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function requestGoogleToken(): Promise<string> {
  const clientId = googleClientId();
  if (!clientId) {
    throw new Error("Falta NEXT_PUBLIC_GOOGLE_CLIENT_ID");
  }
  await loadGis();
  const google = window.google;
  if (!google?.accounts?.oauth2) {
    throw new Error("Google Identity no está disponible");
  }
  if (accessToken) return accessToken;

  return new Promise((resolve, reject) => {
    const client: TokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPE,
      callback: (response: { access_token?: string; error?: string }) => {
        if (!response.access_token) {
          reject(new Error(response.error || "Sin token de Google"));
          return;
        }
        accessToken = response.access_token;
        resolve(response.access_token);
      },
    });
    client.requestAccessToken();
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
    backgroundColor: item.backgroundColor || "#D4B8F0",
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
        title: item.summary || "Sin título",
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
