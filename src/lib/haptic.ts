export function haptic(kind: "light" | "rigid" = "light"): void {
  void play(kind);
}

async function play(kind: "light" | "rigid"): Promise<void> {
  try {
    const core = await import("@capacitor/core");
    if (core.Capacitor.isNativePlatform()) {
      const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
      await Haptics.impact({
        style: kind === "rigid" ? ImpactStyle.Medium : ImpactStyle.Light,
      });
      return;
    }
  } catch {
    /* fall through to the web Vibration API */
  }
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") {
    return;
  }
  try {
    navigator.vibrate(kind === "rigid" ? 16 : 8);
  } catch {
    /* some browsers expose vibrate but reject it */
  }
}
