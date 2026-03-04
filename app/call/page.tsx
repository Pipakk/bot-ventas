"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore, useCallConfigStore } from "@/lib/store";
import { SCENARIOS, getScenarioById, type ScenarioId } from "@/lib/scenarios";
import { CallTrainer } from "@/components/CallTrainer";
import { VoiceSelector } from "@/components/VoiceSelector";
import { useEffect } from "react";
import { Avatar } from "@/components/Avatar";

const PROSPECT_TYPES = ["Business Owner", "CEO", "Technical Manager"];
const PERSONALITIES = ["Skeptical", "Impatient", "Polite but resistant", "Hostile"];
const DIFFICULTIES = ["normal", "hard"] as const;

export default function CallPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const config = useCallConfigStore();
  const [started, setStarted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) router.replace("/login");
  }, [token, router]);

  if (!token) return null;

  function handleStart() {
    const needsKey = config.aiProvider !== "ollama";
    if (needsKey && !config.aiApiKey?.trim()) {
      setError(
        config.aiProvider === "groq"
          ? "Introduce tu API key de Groq (gratis en console.groq.com)."
          : "Introduce tu API key de OpenAI."
      );
      return;
    }
    setError("");
    setStarted(true);
  }

  if (started) {
    return (
      <CallTrainer
        sessionConfig={{
          industry: config.industry,
          difficulty: config.difficulty,
          prospectType: config.prospectType,
          personality: config.personality,
          scenarioId: config.scenarioId,
          scenarioContext: config.scenarioId ? getScenarioById(config.scenarioId)?.aiContext ?? "" : "",
          aiApiKey: config.aiApiKey,
          aiProvider: config.aiProvider,
          voiceUri: config.selectedVoiceUri || undefined,
        }}
        token={token}
        onExit={() => setStarted(false)}
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <Link href="/dashboard" className="text-slate-400 hover:text-white">
          ← Dashboard
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] items-start">
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-white">Configuración de la llamada</h2>
            <span className="rounded-full bg-slate-800/80 px-3 py-1 text-[10px] uppercase tracking-[0.15em] text-slate-400">
              Simulación de avatar
            </span>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Escenario de práctica</label>
            <select
              value={config.scenarioId}
              onChange={(e) => {
                const id = e.target.value as ScenarioId;
                const scenario = getScenarioById(id);
                config.setConfig({
                  scenarioId: id,
                  ...(scenario && id !== "free"
                    ? {
                        industry: scenario.industry,
                        prospectType: scenario.prospectType,
                        personality: scenario.personality,
                      }
                    : {}),
                });
              }}
              className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-slate-100"
            >
              {SCENARIOS.map((s: import("@/lib/scenarios").Scenario) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            {(() => {
              const scenario = getScenarioById(config.scenarioId);
              if (!scenario) return null;
              return (
                <>
                  <p className="text-xs text-slate-400 mt-1">
                    {scenario.description}
                  </p>
                  {scenario.prepNotes && (
                    <div className="mt-2 rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-[11px] text-slate-200 space-y-1">
                      <span className="block text-[10px] uppercase tracking-[0.18em] text-slate-500">
                        Notas previas del prospecto
                      </span>
                      <p className="text-slate-300">
                        {scenario.prepNotes}
                      </p>
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Proveedor de IA</label>
            <select
              value={config.aiProvider}
              onChange={(e) => config.setConfig({ aiProvider: e.target.value as "openai" | "groq" | "ollama" })}
              className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-slate-100"
            >
              <option value="groq">Groq (gratis, con registro)</option>
              <option value="ollama">Ollama (gratis, local)</option>
              <option value="openai">OpenAI (de pago)</option>
            </select>
            {config.aiProvider === "groq" && (
              <p className="text-xs text-emerald-400/90 mt-1">
                Regístrate en{" "}
                <a
                  href="https://console.groq.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  console.groq.com
                </a>{" "}
                y crea una API key. Sin coste.
              </p>
            )}
            {config.aiProvider === "ollama" && (
              <p className="text-xs text-slate-400 mt-1">
                Instala{" "}
                <a
                  href="https://ollama.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Ollama
                </a>{" "}
                y ejecuta:{" "}
                <code className="bg-slate-800 px-1 rounded">ollama run llama3.2</code>
              </p>
            )}
          </div>
          {(config.aiProvider === "openai" || config.aiProvider === "groq") && (
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                API Key {config.aiProvider === "groq" ? "Groq" : "OpenAI"}
              </label>
              <input
                type="password"
                value={config.aiApiKey}
                onChange={(e) => config.setConfig({ aiApiKey: e.target.value })}
                placeholder={config.aiProvider === "groq" ? "gsk_..." : "sk-..."}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-slate-100 placeholder-slate-500"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Industria</label>
              <input
                type="text"
                value={config.industry}
                onChange={(e) => config.setConfig({ industry: e.target.value })}
                placeholder="ej. SaaS, retail, tecnología"
                className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-slate-100 placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">Dificultad</label>
              <select
                value={config.difficulty}
                onChange={(e) => config.setConfig({ difficulty: e.target.value as "normal" | "hard" })}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-slate-100"
              >
                {DIFFICULTIES.map((d: "normal" | "hard") => (
                  <option key={d} value={d}>
                    {d === "normal" ? "Normal" : "Difícil"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Tipo de prospecto</label>
              <select
                value={config.prospectType}
                onChange={(e) => config.setConfig({ prospectType: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-slate-100"
              >
                {PROSPECT_TYPES.map((t: string) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">Personalidad</label>
              <select
                value={config.personality}
                onChange={(e) => config.setConfig({ personality: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-slate-100"
              >
                {PERSONALITIES.map((p: string) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Voz del prospecto</label>
            <VoiceSelector
              value={config.selectedVoiceUri}
              onChange={(voiceUri) => config.setConfig({ selectedVoiceUri: voiceUri })}
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
          <button onClick={handleStart} className="btn-primary w-full mt-2">
            Iniciar llamada
          </button>
        </div>

        <div className="card p-4 flex flex-col items-center gap-4">
          <p className="text-xs uppercase tracking-[0.15em] text-slate-400">
            Vista previa del prospecto
          </p>
          <Avatar
            isSpeaking={false}
            mood={config.personality === "Hostile" ? "annoyed" : config.personality === "Skeptical" ? "skeptical" : "neutral"}
            className="mx-auto"
          />
          <div className="w-full rounded-xl bg-slate-900/80 border border-slate-800 px-3 py-2 text-xs text-slate-300 flex flex-col gap-1">
            {config.scenarioId !== "free" && (
              <span className="text-[10px] uppercase tracking-[0.12em] text-emerald-400/90">
                {getScenarioById(config.scenarioId)?.label}
              </span>
            )}
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-100">{config.prospectType}</span>
              <span className="text-[10px] uppercase tracking-[0.15em] text-slate-500">
                {config.difficulty === "hard" ? "Difícil" : "Normal"}
              </span>
            </div>
            <p className="text-slate-400">
              Personalidad {config.personality.toLowerCase()} en sector {config.industry || "general"}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
