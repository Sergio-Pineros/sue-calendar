"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSueStore } from "@/components/StoreProvider";
import { LayerToggles } from "@/components/LayerToggles";
import type { NamingSystem } from "@/lib/types";

const STEPS = ["Nombres", "Calendario", "Capas", "Listo"];

export function OnboardingFlow() {
  const router = useRouter();
  const { state, setNaming, completeOnboarding } = useSueStore();
  const [step, setStep] = useState(0);

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-16">
      <p className="display text-center text-5xl tracking-[0.4em]">SÚE</p>
      <p className="mt-4 text-center text-ink-soft">
        Un overlay de 13 periodos de 28 días sobre el calendario que ya usas.
        No es un calendario lunar. No es un calendario universal antiguo.
      </p>
      <div className="mx-auto mt-8 flex gap-2">
        {STEPS.map((label, i) => (
          <span
            key={label}
            className={`h-1.5 w-12 rounded-full ${i <= step ? "bg-ink" : "bg-line"}`}
          />
        ))}
      </div>

      <div className="mt-10 rounded-3xl border border-line bg-card/80 p-6">
        {step === 0 && (
          <div className="space-y-4">
            <h1 className="display text-3xl">Cómo nombrar los periodos</h1>
            <Choice
              active={state.settings.naming === "sue"}
              title="Nombres SÚE"
              body="Alba, Nieve, Brote… un vocabulario propio, estacional."
              onClick={() => setNaming("sue")}
            />
            <Choice
              active={state.settings.naming === "ifc"}
              title="Nombres IFC"
              body="January–June, Sol, July–December. Historia de reforma moderna."
              onClick={() => setNaming("ifc")}
            />
            <Choice
              active={state.settings.naming === "numbered"}
              title="Periodos 1–13"
              body="Sin nombres. Solo el ritmo de cuatro semanas."
              onClick={() => setNaming("numbered")}
            />
          </div>
        )}
        {step === 1 && (
          <div className="space-y-3">
            <h1 className="display text-3xl">Tu calendario se queda</h1>
            <p className="text-ink-soft">
              SÚE no reemplaza Google ni Apple. En Ajustes puedes conectar
              Google o importar un .ics. También puedes empezar con eventos de
              ejemplo y conectarte después.
            </p>
            <p className="text-sm text-ink-soft">
              La home es Hoy y esta semana. La rueda del año queda como mapa.
            </p>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <h1 className="display text-3xl">Capas que quieres ver</h1>
            <p className="text-sm text-ink-soft">
              Puedes apagarlas cuando quieras. Las fases lunares son cálculo,
              no equivalen a un periodo SÚE.
            </p>
            <LayerToggles />
          </div>
        )}
        {step === 3 && (
          <div className="space-y-3">
            <h1 className="display text-3xl">El año, en trece ritmos</h1>
            <p className="text-ink-soft">
              13 × 28 = 364 días regulares. Year Day cierra el año solar. Leap
              Day aparece solo en años bisiestos, entre el periodo 6 y Sol.
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-between">
        <button
          type="button"
          className="text-sm text-ink-soft"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          Atrás
        </button>
        <button
          type="button"
          className="rounded-full bg-ink px-5 py-2 text-sm text-paper"
          onClick={() => {
            if (step < 3) {
              setStep((s) => s + 1);
              return;
            }
            completeOnboarding();
            router.push("/");
          }}
        >
          {step === 3 ? "Entrar a hoy" : "Continuar"}
        </button>
      </div>
    </div>
  );
}

function Choice({
  active,
  title,
  body,
  onClick,
}: {
  active: boolean;
  title: string;
  body: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border p-4 text-left ${
        active ? "border-ink bg-ink text-paper" : "border-line"
      }`}
    >
      <p className="font-medium">{title}</p>
      <p className={`mt-1 text-sm ${active ? "text-paper/70" : "text-ink-soft"}`}>
        {body}
      </p>
    </button>
  );
}

export type { NamingSystem };
