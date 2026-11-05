import {
  createCalDavEvent,
  discoverCalendars,
  fetchCalDavEvents,
  type CalDavCalendar,
  type CalDavDraft,
} from "@/lib/caldav-server";

export const runtime = "nodejs";

type Body = {
  action?: "list" | "events" | "create";
  appleId?: string;
  appPassword?: string;
  year?: number;
  calendars?: CalDavCalendar[];
  calendar?: CalDavCalendar;
  draft?: CalDavDraft;
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const appleId = body.appleId?.trim();
  const appPassword = body.appPassword?.trim();
  if (!appleId || !appPassword) {
    return Response.json(
      { error: "Apple ID and an app-specific password are required." },
      { status: 400 },
    );
  }

  try {
    if (body.action === "list") {
      const calendars = await discoverCalendars(appleId, appPassword);
      return Response.json({ calendars });
    }
    if (body.action === "events") {
      const year = body.year ?? new Date().getFullYear();
      const calendars = body.calendars ?? [];
      const events = await fetchCalDavEvents(
        appleId,
        appPassword,
        calendars,
        year,
      );
      return Response.json({ events });
    }
    if (body.action === "create") {
      if (!body.calendar || !body.draft?.title) {
        return Response.json(
          { error: "A calendar and an event title are required." },
          { status: 400 },
        );
      }
      const event = await createCalDavEvent(
        appleId,
        appPassword,
        body.calendar,
        body.draft,
      );
      return Response.json({ event });
    }
    return Response.json({ error: "Unknown CalDAV action." }, { status: 400 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Apple CalDAV request failed.";
    return Response.json({ error: message }, { status: 502 });
  }
}
