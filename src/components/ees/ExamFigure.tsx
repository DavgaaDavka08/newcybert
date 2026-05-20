"use client";

import type { EesIllustration } from "@/lib/ees-data";
import { VoltmeterIllustration } from "./VoltmeterIllustration";

/** Шалгалтын зураг — зураггүй бол тайлбарын хайрцаг */
export function ExamFigure({ kind }: { kind: EesIllustration }) {
  if (!kind) return null;
  if (kind === "voltmeter") return <VoltmeterIllustration />;

  const labels: Record<
    Exclude<NonNullable<EesIllustration>, "voltmeter">,
    string
  > = {
    "velocity-graph": "Хурд-хугацааны график",
    "heating-graph": "Температур-хугацааны график (нафталин)",
    "mass-square": "Квадрат дээрх бөмбөлгүүд",
    "voltage-divider": "Хүчдэл хуваагч хэлхээ",
    "truth-table": "Логик хүснэгт",
    "magnetic-force": "Соронзон орон, дамжуулагч",
    "electric-field": "Цэнэгүүд, цахилгаан орон",
    circuit: "Цахилгаан хэлхээ",
    wave: "Долгионы зураг",
    interference: "Интерференцийн зураг",
    "oscillation-graph": "Хэлбэлзлийн график",
    reflection: "Тусгал",
    lens: "Линз, дүрс",
  };

  const label = labels[kind as keyof typeof labels] ?? "Зураг";

  return (
    <div
      style={{
        padding: "20px 16px",
        background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
        borderRadius: 12,
        border: "1px dashed #cbd5e1",
        textAlign: "center",
        color: "#64748b",
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#94a3b8"
        strokeWidth="1.5"
        style={{ margin: "0 auto 8px", display: "block" }}
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M8 12h8M12 8v8" />
      </svg>
      {label}
      <div
        style={{
          fontSize: 11,
          fontWeight: 500,
          marginTop: 4,
          color: "#94a3b8",
        }}
      >
        (Шалгалтын зураг — даалгаврын өгөгдөлд үзүүлсэн)
      </div>
    </div>
  );
}
