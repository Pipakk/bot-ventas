"use client";

import { useEffect, useState } from "react";
import { getVoices, getSpanishVoices, previewVoice } from "@/modules/audio/speech";

const PREVIEW_PHRASE = "Hola, soy el prospecto. ¿En qué puedo ayudarle?";

interface VoiceSelectorProps {
  value: string;
  onChange: (voiceUri: string) => void;
  className?: string;
}

export function VoiceSelector({ value, onChange, className = "" }: VoiceSelectorProps) {
  const [voices, setVoices] = useState<{ voiceURI: string; name: string; lang: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const applyVoices = (list: { voiceURI: string; name: string; lang: string }[]) => {
      setVoices(list);
      setLoading(false);
      if (!value && list[0]) onChange(list[0].voiceURI);
    };
    getVoices().then((list) => applyVoices(getSpanishVoices(list)));
    const t = setTimeout(() => {
      getVoices().then((list) => applyVoices(getSpanishVoices(list)));
    }, 600);
    return () => clearTimeout(t);
  }, [onChange, value]);

  const handlePreview = () => {
    setPlaying(true);
    previewVoice(value || null, PREVIEW_PHRASE, () => setPlaying(false));
  };

  if (loading) {
    return (
      <div className={`text-sm text-slate-500 ${className}`}>
        Cargando voces…
      </div>
    );
  }

  if (voices.length === 0) {
    return (
      <div className={`text-sm text-slate-500 ${className}`}>
        No hay voces en español disponibles en tu navegador.
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <select
          value={value || voices[0]?.voiceURI}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100"
          aria-label="Voz del prospecto"
        >
          {voices.map((v: { voiceURI: string; name: string; lang: string }) => (
            <option key={v.voiceURI} value={v.voiceURI}>
              {v.name} ({v.lang})
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handlePreview}
          disabled={playing}
          className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 disabled:opacity-50"
        >
          {playing ? "Reproduciendo…" : "Escuchar"}
        </button>
      </div>
      <p className="text-xs text-slate-500">
        Todas las voces en español que ofrece tu navegador (gratuitas). Usa «Escuchar» para una vista previa.
      </p>
    </div>
  );
}
