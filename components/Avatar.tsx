"use client";

import Image from "next/image";

export type AvatarMood = "neutral" | "skeptical" | "annoyed" | "interested";

interface AvatarProps {
  isSpeaking: boolean;
  mood?: AvatarMood;
  className?: string;
}

/**
 * Avatar basado en PNG estático.
 * Para usar tu propio PNG:
 *  - Descarga el avatar de empresario (por ejemplo desde PngTree u otra librería)
 *  - Guárdalo como `public/avatar-business.png` en el proyecto
 */
export function Avatar({ isSpeaking, className = "" }: AvatarProps) {
  return (
    <div
      className={`relative flex items-center justify-center rounded-[32px] border border-slate-800/80 bg-slate-950/80 px-4 py-4 shadow-[0_18px_45px_rgba(15,23,42,0.9)] ${className}`}
    >
      <div className="absolute inset-0 rounded-[32px] bg-gradient-to-t from-slate-950 via-slate-900/60 to-slate-900/10 pointer-events-none" />
      <div
        className={`relative transition-transform duration-200 ${
          isSpeaking ? "scale-[1.02]" : "scale-100"
        }`}
      >
        <div
          className={`absolute -inset-4 rounded-[32px] bg-primary-500/20 blur-2xl transition-opacity ${
            isSpeaking ? "opacity-80" : "opacity-20"
          }`}
        />
        <Image
          src="/avatar-business.png"
          alt="Avatar de prospecto empresarial"
          width={260}
          height={360}
          className="relative z-10 h-auto w-[220px] sm:w-[240px] object-contain"
        />
      </div>
    </div>
  );
}
