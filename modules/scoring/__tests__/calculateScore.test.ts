import { describe, it, expect } from "vitest";
import { calculateScore } from "../calculateScore";

describe("calculateScore", () => {
  it("returns total score 0-100", () => {
    const result = calculateScore({
      segments: [
        { speaker: "user", text: "Hola, buenos días", startMs: 0, endMs: 2000 },
        { speaker: "prospect", text: "Dígame", startMs: 2500, endMs: 4000 },
        { speaker: "user", text: "¿Qué problema tiene actualmente con su proveedor?", startMs: 5000, endMs: 8000 },
      ],
      durationSeconds: 10,
      difficulty: "normal",
    });
    expect(result.totalScore).toBeGreaterThanOrEqual(0);
    expect(result.totalScore).toBeLessThanOrEqual(100);
    expect(result.breakdown).toBeDefined();
    expect(result.suggestions.length).toBeGreaterThanOrEqual(0);
  });

  it("includes talk/listen ratio in breakdown", () => {
    const result = calculateScore({
      segments: [
        { speaker: "user", text: "Hola", startMs: 0, endMs: 1000 },
        { speaker: "prospect", text: "Sí", startMs: 1500, endMs: 3000 },
      ],
      durationSeconds: 5,
      difficulty: "normal",
    });
    expect(typeof result.breakdown.talkListenRatio).toBe("number");
  });
});
