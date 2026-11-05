export const ENTERED_KEY = "sue:entered";

export type LandingContext = {
  standalone: boolean;
  native: boolean;
  entered: boolean;
  onboarded: boolean;
};

export function shouldSkipLanding(ctx: LandingContext): boolean {
  return ctx.standalone || ctx.native || ctx.entered || ctx.onboarded;
}

export function markEntered(): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(ENTERED_KEY, "1");
  } catch {
    /* private mode */
  }
}

export function hasEntered(): boolean {
  if (typeof localStorage === "undefined") return false;
  try {
    return localStorage.getItem(ENTERED_KEY) === "1";
  } catch {
    return false;
  }
}

export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  const safari = window.navigator as Navigator & { standalone?: boolean };
  return safari.standalone === true;
}

export function isIosSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(ua);
  const webkit = /WebKit/.test(ua);
  const crios = /CriOS|FxiOS|EdgiOS/.test(ua);
  return ios && webkit && !crios;
}
