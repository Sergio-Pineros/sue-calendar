"use client";

export function HudFrame({
  children,
  label,
  className = "",
}: {
  children: React.ReactNode;
  label?: string;
  className?: string;
}) {
  return (
    <section className={`hud-frame rounded-2xl p-5 ${className}`}>
      {label ? <span className="hud-label">{label}</span> : null}
      {children}
    </section>
  );
}

export function HudSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex min-h-11 w-full items-center justify-between gap-4 rounded-xl border border-line px-4 text-left"
    >
      <span className="text-sm">{label}</span>
      <span
        className={`relative h-6 w-11 rounded-full border ${
          checked ? "border-brass bg-brass/40" : "border-line bg-paper-deep"
        }`}
      >
        <span
          className="absolute top-0.5 size-5 rounded-full bg-ink transition-transform"
          style={{ transform: checked ? "translateX(22px)" : "translateX(2px)" }}
        />
      </span>
    </button>
  );
}
