import React from "react";

export const WHEEL_COLORS = [
  "#f43f5e", // rose-500
  "#0ea5e9", // sky-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#06b6d4", // cyan-500
  "#84cc16", // lime-500
  "#eab308", // yellow-500
  "#6366f1"  // indigo-500
];

interface LuckyWheelProps {
  prizes: string[];
  rotation: number;
  isSpinning?: boolean;
  size?: number;
}

export default function LuckyWheel({ prizes, rotation, isSpinning = false, size = 280 }: LuckyWheelProps) {
  const count = Math.max(1, prizes.length);
  const sliceAngle = 360 / count;
  const cx = 150;
  const cy = 150;
  const r = 140;

  return (
    <div className="relative mx-auto flex items-center justify-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 300 300" className="w-full h-full drop-shadow-2xl">
        <g
          style={{
            transform: `rotate(${rotation}deg)`,
            transformOrigin: "150px 150px",
            transition: isSpinning ? "transform 4000ms cubic-bezier(0.15, 0.9, 0.25, 1)" : "none"
          }}
        >
          {prizes.map((p, i) => {
            const startAngle = i * sliceAngle;
            const endAngle = (i + 1) * sliceAngle;
            const rad1 = ((startAngle - 90) * Math.PI) / 180;
            const rad2 = ((endAngle - 90) * Math.PI) / 180;

            const x1 = cx + r * Math.cos(rad1);
            const y1 = cy + r * Math.sin(rad1);
            const x2 = cx + r * Math.cos(rad2);
            const y2 = cy + r * Math.sin(rad2);
            const largeArc = sliceAngle > 180 ? 1 : 0;
            const pathD = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
            const color = WHEEL_COLORS[i % WHEEL_COLORS.length];
            const midAngle = startAngle + sliceAngle / 2;

            return (
              <g key={i}>
                <path d={pathD} fill={color} stroke="#ffffff" strokeWidth="2.5" />
                <g transform={`rotate(${midAngle} 150 150)`}>
                  <text
                    x="150"
                    y="45"
                    fill="#ffffff"
                    fontSize="11"
                    fontWeight="800"
                    textAnchor="middle"
                    style={{ textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}
                  >
                    {p.length > 14 ? p.substring(0, 13) + "…" : p}
                  </text>
                </g>
              </g>
            );
          })}
        </g>

        {/* Viền ngoài trang trí */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#fbbf24" strokeWidth="6" opacity="0.9" />

        {/* Trục tâm của vòng quay */}
        <circle cx={cx} cy={cy} r="26" fill="#ffffff" stroke="#f59e0b" strokeWidth="4" />
        <circle cx={cx} cy={cy} r="14" fill="#f59e0b" />
        <circle cx={cx} cy={cy} r="6" fill="#ffffff" />
      </svg>

      {/* Mũi tên chỉ phần thưởng ở vị trí 12h */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-20 pointer-events-none drop-shadow-md"
        style={{
          width: 0,
          height: 0,
          borderLeft: "14px solid transparent",
          borderRight: "14px solid transparent",
          borderTop: "24px solid #ef4444"
        }}
      />
    </div>
  );
}
