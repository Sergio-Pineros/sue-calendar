import { redirect } from "next/navigation";
import { gregorianToSue, todayISO } from "@/lib/sue-calendar";

export const dynamic = "force-dynamic";

export default function Page() {
  const today = gregorianToSue(todayISO());
  redirect(`/period/${today.suePeriod ?? 1}`);
}
