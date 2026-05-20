"use client";

export function VoltmeterIllustration() {
  const cx = 100;
  const cy = 98;
  const rOuter = 78;
  const rInner = 52;

  const ticks: { v: number; major: boolean }[] = [];
  for (let v = 0; v <= 60; v++) {
    const val = v / 10;
    ticks.push({ v: val, major: val % 1 === 0 });
  }

  function angleFor(v: number) {
    return Math.PI - (Math.PI * v) / 6;
  }

  const needleV = 2.6;
  const na = angleFor(needleV);
  const nLen = 62;
  const nx = cx + nLen * Math.cos(na);
  const ny = cy - nLen * Math.sin(na);

  return (
    <svg
      viewBox="0 0 200 118"
      style={{
        width: "100%",
        maxWidth: 280,
        height: "auto",
        display: "block",
        margin: "0 auto",
      }}
    >
      <defs>
        <linearGradient id="vmFace" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#e2e8f0" />
        </linearGradient>
      </defs>
      <ellipse cx={cx} cy={cy + 8} rx="72" ry="14" fill="rgba(15,23,42,0.06)" />
      <path
        d={`M ${cx - rOuter} ${cy} A ${rOuter} ${rOuter} 0 0 1 ${cx + rOuter} ${cy}`}
        fill="url(#vmFace)"
        stroke="#94a3b8"
        strokeWidth="2"
      />
      <path
        d={`M ${cx - rInner} ${cy} A ${rInner} ${rInner} 0 0 1 ${cx + rInner} ${cy}`}
        fill="none"
        stroke="#cbd5e1"
        strokeWidth="1"
      />
      {ticks.map(({ v, major }) => {
        const a = angleFor(v);
        const r1 = major ? rOuter - 4 : rOuter - 10;
        const r2 = rOuter - (major ? 1 : 6);
        const x1 = cx + r1 * Math.cos(a);
        const y1 = cy - r1 * Math.sin(a);
        const x2 = cx + r2 * Math.cos(a);
        const y2 = cy - r2 * Math.sin(a);
        return (
          <line
            key={v}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#475569"
            strokeWidth={major ? 2 : 1}
            strokeLinecap="round"
          />
        );
      })}
      {[0, 1, 2, 3, 4, 5, 6].map((n) => {
        const a = angleFor(n);
        const tx = cx + (rOuter - 22) * Math.cos(a);
        const ty = cy - (rOuter - 22) * Math.sin(a);
        return (
          <text
            key={n}
            x={tx}
            y={ty}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#0f172a"
            fontSize="12"
            fontWeight="700"
            fontFamily="system-ui,sans-serif"
          >
            {n}
          </text>
        );
      })}
      <text
        x={cx}
        y={cy + 6}
        textAnchor="middle"
        fill="#0f172a"
        fontSize="22"
        fontWeight="900"
        fontFamily="Georgia,serif"
      >
        V
      </text>
      <line
        x1={cx}
        y1={cy}
        x2={nx}
        y2={ny}
        stroke="#dc2626"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle
        cx={cx}
        cy={cy}
        r="6"
        fill="#1e293b"
        stroke="#fff"
        strokeWidth="2"
      />
    </svg>
  );
}
