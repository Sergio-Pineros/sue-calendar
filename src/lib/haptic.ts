export function haptic(kind: "light" | "rigid" = "light"): void {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") {
    return;
  }
  try {
    navigator.vibrate(kind === "rigid" ? 16 : 8);
  } catch {
    /* some browsers expose vibrate but reject it */
  }
}
