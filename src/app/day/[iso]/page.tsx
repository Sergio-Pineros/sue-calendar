import { DayView } from "@/components/DayView";
import { todayISO } from "@/lib/sue-calendar";

export default async function Page({
  params,
}: {
  params: Promise<{ iso: string }>;
}) {
  const { iso } = await params;
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : todayISO();
  return <DayView iso={valid} />;
}
