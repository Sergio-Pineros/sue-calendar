import { PeriodPage } from "@/components/PeriodPage";

export default async function Page({
  params,
}: {
  params: Promise<{ n: string }>;
}) {
  const { n } = await params;
  const period = Math.min(13, Math.max(1, Number(n) || 1));
  return <PeriodPage period={period} />;
}
