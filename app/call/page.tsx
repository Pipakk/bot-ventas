"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCallConfigStore, type CustomScenarioSummary } from "@/lib/store";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { SCENARIOS, getScenarioById, type ScenarioId } from "@/lib/scenarios";
import { CallTrainer } from "@/components/CallTrainer";
import { VoiceSelector } from "@/components/VoiceSelector";
import { Avatar } from "@/components/Avatar";
import CreateScenarioModal from "@/components/CreateScenarioModal";

const PROSPECT_TYPES = ["Business Owner", "CEO", "Technical Manager"];
const PERSONALITIES = ["Skeptical", "Impatient", "Polite but resistant", "Hostile"];
const DIFFICULTIES = ["normal", "hard"] as const;

function NoCallsModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="card max-w-md w-full p-6 space-y-4 border-slate-700">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/15">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Sin llamadas disponibles</h2>
            <p className="text-sm text-slate-400 mt-1">
              Has alcanzado el límite de llamadas de tu plan actual. Mejora tu plan para seguir practicando.
            </p>
          </div>
        </div>
        <div className="rounded-lg bg-slate-800/60 p-3 space-y-1 text-sm text-slate-300">
          <p>• <span className="text-primary-300 font-medium">Plan Crecimiento</span> — 10 llamadas/día + escenarios custom · 40€/mes</p>
          <p>• <span className="text-primary-300 font-medium">Plan Pro ilimitado</span> — sin límites + escenarios ilimitados · 60€/mes</p>
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={() => router.push("/billing")} className="btn-primary flex-1">
            Ver planes
          </button>
          <button onClick={onClose} className="btn-secondary flex-1">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function PlanUpsellBanner({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 px-4 py-3 flex items-center gap-3">
      <span className="text-2xl">✨</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-blue-300">Crea tus propios escenarios</p>
        <p className="text-xs text-slate-400 mt-0.5">Disponible en planes Crecimiento y Pro</p>
      </div>
      <button onClick={onUpgrade} className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors">
        Mejorar plan
      </button>
    </div>
  );
}

export default function CallPage() {
  const router = useRouter();
  const { token, ready } = useRequireAuth();
  const config = useCallConfigStore();
  const [started, setStarted] = useState(false);
  const [error, setError] = useState("");
  const [showNoCallsModal, setShowNoCallsModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Escenarios custom del usuario
  const [customScenarios, setCustomScenarios] = useState<CustomScenarioSummary[]>([]);
  const [loadingCustom, setLoadingCustom] = useState(false);
  const [userPlan, setUserPlan] = useState<"free" | "growth" | "unlimited">("free");

  // Detectar plan del usuario vía usage endpoint
  useEffect(() => {
    if (!token) return;
    fetch("/api/call/start", {
      method: "OPTIONS", // dry-run para obtener el plan
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(() => {})
      .catch(() => {});

    // Obtenemos plan desde el endpoint de usage
    fetch("/api/billing/plan", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.plan) setUserPlan(d.plan);
      })
      .catch(() => {});
  }, [token]);

  const canCreateScenarios = userPlan === "growth" || userPlan === "unlimited";

  const loadCustomScenarios = useCallback(async () => {
    if (!token || !canCreateScenarios) return;
    setLoadingCustom(true);
    try {
      const res = await fetch("/api/scenarios", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.scenarios) setCustomScenarios(data.scenarios);
    } catch {
      // silencioso
    } finally {
      setLoadingCustom(false);
    }
  }, [token, canCreateScenarios]);

  useEffect(() => {
    loadCustomScenarios();
  }, [loadCustomScenarios]);

  if (!ready) return null;

  async function selectCustomScenario(s: CustomScenarioSummary) {
    // Cargar el prompt completo
    try {
      const res = await fetch(`/api/scenarios/${s.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const prompt: string = data.scenario?.generatedPrompt ?? "";
      config.setConfig({
        customScenarioId: s.id,
        customScenarioPrompt: prompt,
        scenarioId: "free",
        industry: s.industry,
        personality: s.personality as typeof config.personality,
        difficulty: (s.difficulty as "normal" | "hard") ?? "normal",
      });
    } catch {
      config.setConfig({
        customScenarioId: s.id,
        customScenarioPrompt: s.prepNotes ?? "",
        scenarioId: "free",
      });
    }
  }

  function clearCustomScenario() {
    config.setConfig({ customScenarioId: null, customScenarioPrompt: "" });
  }

  async function deleteCustomScenario(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("¿Eliminar este escenario?")) return;
    await fetch(`/api/scenarios/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setCustomScenarios((prev) => prev.filter((s) => s.id !== id));
    if (config.customScenarioId === id) clearCustomScenario();
  }

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

  // Determinar el contexto de IA para el CallTrainer
  const effectiveContext = config.customScenarioId
    ? config.customScenarioPrompt
    : config.scenarioId
    ? getScenarioById(config.scenarioId)?.aiContext ?? ""
    : "";

  if (started) {
    return (
      <>
        {showNoCallsModal && (
          <NoCallsModal onClose={() => { setShowNoCallsModal(false); setStarted(false); }} />
        )}
        <CallTrainer
          sessionConfig={{
            industry: config.industry,
            difficulty: config.difficulty,
            prospectType: config.prospectType,
            personality: config.personality,
            scenarioId: config.scenarioId,
            scenarioContext: effectiveContext,
            aiApiKey: config.aiApiKey,
            aiProvider: config.aiProvider,
            voiceUri: config.selectedVoiceUri || undefined,
          }}
          token={token}
          onExit={() => setStarted(false)}
          onLimitReached={() => setShowNoCallsModal(true)}
        />
      </>
    );
  }

  const activeCustom = config.customScenarioId
    ? customScenarios.find((s) => s.id === config.customScenarioId)
    : null;

  return (
    <>
      {showCreateModal && (
        <CreateScenarioModal
          onClose={() => setShowCreateModal(false)}
          onSaved={(scenario) => {
            setCustomScenarios((prev) => [scenario as CustomScenarioSummary, ...prev]);
            setShowCreateModal(false);
            selectCustomScenario(scenario as CustomScenarioSummary);
          }}
        />
      )}

      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-2 text-sm">
          <Link href="/dashboard" className="text-slate-400 hover:text-white">
            ← Dashboard
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] items-start">
          <div className="card p-6 space-y-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-white">Prepara tu entrenamiento</h2>
              <span className="rounded-full bg-slate-800/80 px-3 py-1 text-[10px] uppercase tracking-[0.15em] text-slate-400">
                Simulación con IA
              </span>
            </div>

            {/* ── Escenarios predefinidos ── */}
            <div>
              <label className="block text-sm text-slate-400 mb-1">Escenario de venta</label>
              <select
                value={config.customScenarioId ? "__custom__" : config.scenarioId}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "__custom__") return;
                  clearCustomScenario();
                  const id = val as ScenarioId;
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
                {activeCustom && (
                  <option value="__custom__">✦ {activeCustom.name}</option>
                )}
              </select>

              {/* Vista previa escenario predefinido */}
              {!config.customScenarioId && (() => {
                const scenario = getScenarioById(config.scenarioId);
                if (!scenario) return null;
                return (
                  <>
                    <p className="text-xs text-slate-400 mt-1">{scenario.description}</p>
                    {scenario.prepNotes && (
                      <div className="mt-2 rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-[11px] text-slate-200 space-y-1">
                        <span className="block text-[10px] uppercase tracking-[0.18em] text-slate-500">
                          Contexto del prospecto
                        </span>
                        <p className="text-slate-300">{scenario.prepNotes}</p>
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Vista previa escenario custom seleccionado */}
              {activeCustom && (
                <div className="mt-2 rounded-lg border border-blue-500/30 bg-blue-500/5 px-3 py-2 text-[11px] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-[0.18em] text-blue-400">
                      Escenario personalizado
                    </span>
                    <button
                      onClick={clearCustomScenario}
                      className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      Quitar
                    </button>
                  </div>
                  <p className="font-medium text-slate-200">{activeCustom.name}</p>
                  {activeCustom.prepNotes && (
                    <p className="text-slate-400">{activeCustom.prepNotes}</p>
                  )}
                </div>
              )}
            </div>

            {/* ── Sección: Tus escenarios ── */}
            {canCreateScenarios && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-slate-300">Tus escenarios</h3>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Crear escenario
                  </button>
                </div>

                {loadingCustom ? (
                  <div className="text-xs text-slate-500 py-2">Cargando…</div>
                ) : customScenarios.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-700 px-4 py-4 text-center">
                    <p className="text-xs text-slate-500">Aún no tienes escenarios personalizados.</p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium"
                    >
                      Crea el primero →
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {customScenarios.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => selectCustomScenario(s)}
                        className={`flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer transition-colors text-sm ${
                          config.customScenarioId === s.id
                            ? "border border-blue-500/50 bg-blue-500/10"
                            : "border border-slate-700 bg-slate-900/60 hover:border-slate-600"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium truncate ${config.customScenarioId === s.id ? "text-blue-300" : "text-slate-200"}`}>
                            {s.name}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {s.prospectName} · {s.industry} · {s.difficulty}
                          </p>
                        </div>
                        <button
                          onClick={(e) => deleteCustomScenario(s.id, e)}
                          className="shrink-0 text-slate-600 hover:text-red-400 transition-colors text-base leading-none"
                          aria-label="Eliminar escenario"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Banner upsell para plan free */}
            {!canCreateScenarios && (
              <PlanUpsellBanner onUpgrade={() => router.push("/billing")} />
            )}

            {/* ── Motor de IA ── */}
            <div>
              <label className="block text-sm text-slate-400 mb-1">Motor de IA</label>
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
                  <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="underline">
                    console.groq.com
                  </a>{" "}
                  y crea una API key. Sin coste.
                </p>
              )}
              {config.aiProvider === "ollama" && (
                <p className="text-xs text-slate-400 mt-1">
                  Instala{" "}
                  <a href="https://ollama.com" target="_blank" rel="noopener noreferrer" className="underline">
                    Ollama
                  </a>{" "}
                  y ejecuta: <code className="bg-slate-800 px-1 rounded">ollama run llama3.2</code>
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
                <label className="block text-sm text-slate-400 mb-1">Sector / Industria</label>
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
                    <option key={t} value={t}>{t}</option>
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
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">Voz del prospecto (opcional)</label>
              <VoiceSelector
                value={config.selectedVoiceUri}
                onChange={(voiceUri) => config.setConfig({ selectedVoiceUri: voiceUri })}
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}
            <button onClick={handleStart} className="btn-primary w-full mt-2">
              Iniciar simulación
            </button>
          </div>

          {/* ── Panel del prospecto ── */}
          <div className="card p-4 flex flex-col items-center gap-4">
            <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Tu prospecto</p>
            <Avatar
              isSpeaking={false}
              mood={
                config.personality === "Hostile"
                  ? "annoyed"
                  : config.personality === "Skeptical"
                  ? "skeptical"
                  : "neutral"
              }
              className="mx-auto"
            />
            <div className="w-full rounded-xl bg-slate-900/80 border border-slate-800 px-3 py-2 text-xs text-slate-300 flex flex-col gap-1">
              {activeCustom ? (
                <span className="text-[10px] uppercase tracking-[0.12em] text-blue-400">
                  ✦ {activeCustom.name}
                </span>
              ) : config.scenarioId !== "free" ? (
                <span className="text-[10px] uppercase tracking-[0.12em] text-emerald-400/90">
                  {getScenarioById(config.scenarioId)?.label}
                </span>
              ) : null}
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-100">{config.prospectType}</span>
                <span className="text-[10px] uppercase tracking-[0.15em] text-slate-500">
                  {config.difficulty === "hard" ? "Difícil" : "Normal"}
                </span>
              </div>
              <p className="text-slate-400">
                {config.personality} · sector {config.industry || "general"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
