export function caldavEndpoint(): string {
  const remote = process.env.NEXT_PUBLIC_CALDAV_URL?.trim();
  if (remote) return remote.replace(/\/$/, "");
  return "/api/caldav";
}
