import { caldavEndpoint } from "./caldav";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const original = process.env.NEXT_PUBLIC_CALDAV_URL;
delete process.env.NEXT_PUBLIC_CALDAV_URL;
assert(caldavEndpoint() === "/api/caldav", "web default is the Next proxy");

process.env.NEXT_PUBLIC_CALDAV_URL = "https://sue.example/api/caldav/";
assert(
  caldavEndpoint() === "https://sue.example/api/caldav",
  "native builds strip a trailing slash from the deployed proxy",
);

if (original === undefined) delete process.env.NEXT_PUBLIC_CALDAV_URL;
else process.env.NEXT_PUBLIC_CALDAV_URL = original;
