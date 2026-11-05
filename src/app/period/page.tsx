"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { gregorianToSue, todayISO } from "@/lib/sue-calendar";

export default function Page() {
  const router = useRouter();
  useEffect(() => {
    const today = gregorianToSue(todayISO());
    router.replace(`/period/${today.suePeriod ?? 1}`);
  }, [router]);
  return null;
}
