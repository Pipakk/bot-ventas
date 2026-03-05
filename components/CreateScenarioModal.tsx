"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/lib/store";

// ─── tipos ──────────────────────────────────────────────────────────────────

type ProspectType = "Business Owner" | "CEO" | "Technical Manager";
type Personality = "Skeptical" | "Impatient" | "Polite but resistant" | "Hostile";
type Difficulty = "easy" | "normal" | "hard";
type CallGoal =
  | "conseguir reunión"
  | "calificar lead"
  | "vender directamente"
  | "reactivar cliente"
  | "otro";
type Locale = "es-ES" | "es-neutral" | "es-LATAM";
type Tone = "formal" | "cercano" | "directo";

interface WizardData {
  name: string;
  prospectName: string;
  industry: string;
  industryCustom: string;
  product: string;
  callGoal: CallGoal;
  prospectType: ProspectType;
  personality: Personality;
  difficulty: Difficulty;
  context: string;
  objections: string[];
  constraints: string;
  locale: Locale;
  tone: Tone;
}

interface SavedScenario {
  id: string;
  name: string;
  prospectName: string;
  industry: string;
  personality: string;
  difficulty: string;
  prepNotes: string | null;
  generatedPrompt?: string;
}

interface Props {
  onClose: () => void;
  onSaved: (scenario: SavedScenario) => void;
}

// ─── constantes de opciones ──────────────────────────────────────────────────

const INDUSTRY_PRESETS = [
  "SaaS / Software",
  "Comercio local / Retail",
  "Hostelería / Restauración",
  "Consultoría / Servicios profesionales",
  "Salud / Bienestar",
  "Educación / Formación",
  "Inmobiliaria",
  "Manufactura / Industria",
  "Finanzas / Seguros",
  "Logística / Transporte",
  "Otro",
];

const CALL_GOALS: { value: CallGoal; label: string }[] = [
  { value: "conseguir reunión", label: "Conseguir reunión o demo" },
  { value: "calificar lead", label: "Calificar lead" },
  { value: "vender directamente", label: "Vender directamente" },
  { value: "reactivar cliente", label: "Reactivar cliente inactivo" },
  { value: "otro", label: "Otro" },
];

const PROSPECT_TYPES: { value: ProspectType; label: string }[] = [
  { value: "Business Owner", label: "Business Owner (Dueño del negocio)" },
  { value: "CEO", label: "CEO / Dirección general" },
  { value: "Technical Manager", label: "Technical Manager / Responsable técnico" },
];

const PERSONALITIES: { value: Personality; label: string; desc: string }[] = [
  { value: "Skeptical", label: "Escéptico", desc: "No cree en soluciones, pide datos" },
  { value: "Impatient", label: "Impaciente", desc: "Poco tiempo, quiere el punto ya" },
  {
    value: "Polite but resistant",
    label: "Educado pero resistente",
    desc: "Amable pero siempre tiene excusas",
  },
  { value: "Hostile", label: "Hostil", desc: "Ya está harto de vendedores" },
];

const DIFFICULTIES: { value: Difficulty; label: string; desc: string }[] = [
  { value: "easy", label: "Fácil", desc: "Receptivo si explicas el valor" },
  { value: "normal", label: "Medio", desc: "Escéptico, abre si hay argumentos" },
  { value: "hard", label: "Difícil", desc: "Resistente, corta si no hay valor claro" },
];

const LOCALES: { value: Locale; label: string }[] = [
  { value: "es-ES", label: "Español (España)" },
  { value: "es-neutral", label: "Español neutro" },
  { value: "es-LATAM", label: "Español (LATAM)" },
];

const TONES: { value: Tone; label: string }[] = [
  { value: "formal", label: "Formal" },
  { value: "cercano", label: "Cercano / coloquial" },
  { value: "directo", label: "Directo al grano" },
];

const EMPTY: WizardData = {
  name: "",
  prospectName: "",
  industry: "",
  industryCustom: "",
  product: "",
  callGoal: "conseguir reunión",
  prospectType: "Business Owner",
  personality: "Skeptical",
  difficulty: "normal",
  context: "",
  objections: ["No tenemos presupuesto para esto ahora mismo.", "No creo que lo necesitemos realmente.", "Ahora mismo no es el momento, estamos con otros proyectos."],
  constraints: "",
  locale: "es-ES",
  tone: "formal",
};

// ─── helpers ─────────────────────────────────────────────────────────────────

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  maxLength,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      className={`input-base w-full ${className ?? ""}`}
    />
  );
}

function Textarea({
  value,
  onChange,
  placeholder,
  rows,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows ?? 4}
      className="input-base w-full resize-y"
    />
  );
}

function Select<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="select-base w-full"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// ─── Steps ───────────────────────────────────────────────────────────────────

function Step1({
  data,
  set,
}: {
  data: WizardData;
  set: (k: keyof WizardData, v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label required>Nombre del escenario</Label>
        <Input
          value={data.name}
          onChange={(v) => set("name", v)}
          placeholder="Ej: Venta ERP a fabricante mediano"
          maxLength={120}
        />
      </div>
      <div>
        <Label required>Nombre del prospecto</Label>
        <Input
          value={data.prospectName}
          onChange={(v) => set("prospectName", v)}
          placeholder="Ej: Carlos Martínez"
          maxLength={80}
        />
      </div>
      <div>
        <Label required>Industria</Label>
        <select
          value={data.industry === "otro-custom" ? "Otro" : data.industry}
          onChange={(e) => {
            if (e.target.value === "Otro") {
              set("industry", "otro-custom");
            } else {
              set("industry", e.target.value);
              set("industryCustom", "");
            }
          }}
          className="select-base w-full"
        >
          <option value="">Selecciona una industria…</option>
          {INDUSTRY_PRESETS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        {(data.industry === "otro-custom" || data.industry === "Otro") && (
          <Input
            className="mt-2"
            value={data.industryCustom}
            onChange={(v) => set("industryCustom", v)}
            placeholder="Especifica la industria…"
            maxLength={100}
          />
        )}
      </div>
      <div>
        <Label required>Producto o servicio que vendes</Label>
        <Input
          value={data.product}
          onChange={(v) => set("product", v)}
          placeholder="Ej: Software de gestión de inventario con IA"
          maxLength={200}
        />
      </div>
    </div>
  );
}

function Step2({
  data,
  set,
}: {
  data: WizardData;
  set: (k: keyof WizardData, v: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <Label required>Objetivo de la llamada</Label>
        <Select<CallGoal>
          value={data.callGoal}
          onChange={(v) => set("callGoal", v)}
          options={CALL_GOALS}
        />
      </div>
      <div>
        <Label required>Tipo de prospecto</Label>
        <div className="grid gap-2">
          {PROSPECT_TYPES.map((pt) => (
            <button
              key={pt.value}
              type="button"
              onClick={() => set("prospectType", pt.value)}
              className={`text-left px-3 py-2 rounded-lg border text-sm transition-colors ${
                data.prospectType === pt.value
                  ? "border-blue-500 bg-blue-500/10 text-blue-400"
                  : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]"
              }`}
            >
              {pt.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label required>Personalidad del prospecto</Label>
        <div className="grid sm:grid-cols-2 gap-2">
          {PERSONALITIES.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => set("personality", p.value)}
              className={`text-left px-3 py-2 rounded-lg border text-sm transition-colors ${
                data.personality === p.value
                  ? "border-blue-500 bg-blue-500/10 text-blue-400"
                  : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]"
              }`}
            >
              <span className="font-medium block">{p.label}</span>
              <span className="text-xs opacity-70">{p.desc}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label required>Nivel de dificultad</Label>
        <div className="grid grid-cols-3 gap-2">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => set("difficulty", d.value)}
              className={`text-center px-2 py-2 rounded-lg border text-sm transition-colors ${
                data.difficulty === d.value
                  ? "border-blue-500 bg-blue-500/10 text-blue-400"
                  : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]"
              }`}
            >
              <span className="font-medium block">{d.label}</span>
              <span className="text-xs opacity-70 hidden sm:block">{d.desc}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Idioma / Acento</Label>
          <Select<Locale> value={data.locale} onChange={(v) => set("locale", v)} options={LOCALES} />
        </div>
        <div>
          <Label>Tono de conversación</Label>
          <Select<Tone> value={data.tone} onChange={(v) => set("tone", v)} options={TONES} />
        </div>
      </div>
    </div>
  );
}

function Step3({
  data,
  setField,
  setObjection,
  addObjection,
  removeObjection,
}: {
  data: WizardData;
  setField: (k: keyof WizardData, v: string) => void;
  setObjection: (i: number, v: string) => void;
  addObjection: () => void;
  removeObjection: (i: number) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <Label required>Contexto y situación del prospecto</Label>
        <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
          Qué está pasando en su negocio, sus dolores principales, qué ha intentado antes.
        </p>
        <Textarea
          value={data.context}
          onChange={(v) => setField("context", v)}
          placeholder="Ej: Carlos dirige una empresa de fabricación de 40 personas. Han crecido un 30% en 2 años pero siguen gestionando el inventario con Excel. Han tenido roturas de stock que les han costado contratos. No tiene tiempo para implementar nada que lleve más de 2 semanas."
          rows={5}
        />
      </div>
      <div>
        <Label required>Objeciones típicas esperadas</Label>
        <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
          Te damos 3 de base, edítalas o añade más (hasta 8). La IA también puede improvisar objeciones adicionales que encajen con el contexto.
        </p>
        <div className="space-y-2">
          {data.objections.map((obj, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                type="text"
                value={obj}
                onChange={(e) => setObjection(i, e.target.value)}
                placeholder={`Objeción ${i + 1}… (edita o añade la tuya)`}
                className="input-base flex-1 text-sm"
                maxLength={200}
              />
              {data.objections.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeObjection(i)}
                  className="text-red-400 hover:text-red-300 text-lg leading-none px-1"
                  aria-label="Eliminar objeción"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {data.objections.length < 8 && (
            <button
              type="button"
              onClick={addObjection}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              + Añadir objeción
            </button>
          )}
        </div>
      </div>
      <div>
        <Label>Restricciones y condicionantes (opcional)</Label>
        <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
          Presupuesto, timing, competencia actual, experiencias previas negativas…
        </p>
        <Textarea
          value={data.constraints}
          onChange={(v) => setField("constraints", v)}
          placeholder="Ej: Tiene contrato con SAP hasta diciembre. Presupuesto máximo €500/mes. Ya probó una herramienta similar hace 2 años y fue un fracaso."
          rows={3}
        />
      </div>
    </div>
  );
}

function Step4Preview({
  prompt,
  onEdit,
  saving,
  onSave,
}: {
  prompt: string;
  onEdit: () => void;
  saving: boolean;
  onSave: () => void;
}) {
  const [copied, setCopied] = useState(false);

  function copyPrompt() {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
            Vista previa del prompt generado
          </p>
          <button
            type="button"
            onClick={copyPrompt}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            {copied ? "¡Copiado!" : "Copiar"}
          </button>
        </div>
        <div
          className="rounded-lg border p-3 text-xs leading-relaxed font-mono overflow-y-auto max-h-64 whitespace-pre-wrap"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
            color: "var(--text-muted)",
          }}
        >
          {prompt}
        </div>
      </div>
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        Este prompt define cómo se comportará el prospecto en la simulación. Puedes volver atrás
        para ajustar los campos antes de guardar.
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onEdit}
          className="btn-secondary flex-1"
          disabled={saving}
        >
          Editar campos
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="btn-primary flex-1"
        >
          {saving ? "Guardando…" : "Guardar escenario"}
        </button>
      </div>
    </div>
  );
}

// ─── Modal principal ─────────────────────────────────────────────────────────

const STEP_TITLES = [
  "Información básica",
  "Perfil del prospecto",
  "Realismo de la simulación",
  "Vista previa y guardar",
];

export default function CreateScenarioModal({ onClose, onSaved }: Props) {
  const token = useAuthStore((s) => s.token);
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>(EMPTY);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState("");

  // Cierre con ESC
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const set = useCallback((k: keyof WizardData, v: string) => {
    setData((prev) => ({ ...prev, [k]: v }));
  }, []);

  function setObjection(i: number, v: string) {
    setData((prev) => {
      const next = [...prev.objections];
      next[i] = v;
      return { ...prev, objections: next };
    });
  }

  function addObjection() {
    setData((prev) =>
      prev.objections.length < 8
        ? { ...prev, objections: [...prev.objections, ""] }
        : prev
    );
  }

  function removeObjection(i: number) {
    setData((prev) => {
      const next = prev.objections.filter((_, idx) => idx !== i);
      return { ...prev, objections: next.length > 0 ? next : [""] };
    });
  }

  function validate(): string {
    if (step === 0) {
      if (!data.name.trim()) return "El nombre del escenario es obligatorio.";
      if (!data.prospectName.trim()) return "El nombre del prospecto es obligatorio.";
      const ind =
        data.industry === "otro-custom" ? data.industryCustom : data.industry;
      if (!ind.trim()) return "Selecciona o escribe una industria.";
      if (!data.product.trim()) return "El producto/servicio es obligatorio.";
    }
    if (step === 2) {
      if (!data.context.trim()) return "El contexto del prospecto es obligatorio.";
      const filled = data.objections.filter((o) => o.trim() !== "");
      if (filled.length < 1) return "Añade al menos 1 objeción.";
    }
    return "";
  }

  async function generatePreview() {
    const industry =
      data.industry === "otro-custom" ? data.industryCustom : data.industry;

    const res = await fetch("/api/scenarios/preview", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...data,
        industry,
        objections: data.objections.filter((o) => o.trim() !== ""),
      }),
    });

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.error ?? "Error generando preview");
    }
    const result = await res.json();
    return result.prompt as string;
  }

  async function handleNext() {
    const err = validate();
    if (err) { setError(err); return; }
    setError("");

    if (step < 2) {
      setStep((s) => s + 1);
      return;
    }

    // Paso 2 → paso 3 (preview): generar prompt
    if (step === 2) {
      setSaving(true);
      try {
        const prompt = await generatePreview();
        setGeneratedPrompt(prompt);
        setStep(3);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error generando preview");
      } finally {
        setSaving(false);
      }
    }
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    const industry =
      data.industry === "otro-custom" ? data.industryCustom : data.industry;

    try {
      const res = await fetch("/api/scenarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...data,
          industry,
          objections: data.objections.filter((o) => o.trim() !== ""),
        }),
      });

      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Error al guardar el escenario.");
        return;
      }
      onSaved(body.scenario as SavedScenario);
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  const progress = ((step) / 3) * 100;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh]"
        style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b" style={{ borderColor: "var(--border)" }}>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-blue-400 mb-0.5">
              Paso {step + 1} de 4
            </p>
            <h2 className="text-base font-semibold" style={{ color: "var(--text)" }}>
              {STEP_TITLES[step]}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-lg transition-opacity hover:opacity-70"
            style={{ color: "var(--text-muted)", background: "var(--surface)" }}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 w-full" style={{ background: "var(--border)" }}>
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {error && (
            <div className="mb-3 rounded-lg px-3 py-2 text-sm bg-red-500/10 text-red-400 border border-red-500/20">
              {error}
            </div>
          )}

          {step === 0 && <Step1 data={data} set={set} />}
          {step === 1 && <Step2 data={data} set={set} />}
          {step === 2 && (
            <Step3
              data={data}
              setField={set}
              setObjection={setObjection}
              addObjection={addObjection}
              removeObjection={removeObjection}
            />
          )}
          {step === 3 && (
            <Step4Preview
              prompt={generatedPrompt}
              onEdit={() => setStep(2)}
              saving={saving}
              onSave={handleSave}
            />
          )}
        </div>

        {/* Footer navigation (steps 0-2) */}
        {step < 3 && (
          <div
            className="px-5 py-4 border-t flex gap-3"
            style={{ borderColor: "var(--border)" }}
          >
            {step > 0 ? (
              <button
                type="button"
                onClick={() => { setError(""); setStep((s) => s - 1); }}
                className="btn-secondary flex-1"
                disabled={saving}
              >
                Atrás
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              className="btn-primary flex-1"
              disabled={saving}
            >
              {saving
                ? "Generando…"
                : step === 2
                ? "Ver preview"
                : "Continuar"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
