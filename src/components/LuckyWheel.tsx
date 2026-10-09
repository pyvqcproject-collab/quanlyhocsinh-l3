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
                    y="60"
                    fill="#ffffff"
                    fontSize={count > 8 ? "9.5" : count > 6 ? "10.5" : "12"}
                    fontWeight="800"
                    textAnchor="middle"
                    className="select-none font-sans drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
                    transform="rotate(90 150 60)"
                  >
                    {p.length > 18 ? p.slice(0, 16) + "…" : p}
                  </text>
                </g>
              </g>
            );
          })}

          {/* Outer golden rim & bulbs */}
          <circle cx="150" cy="150" r="140" fill="none" stroke="#fbbf24" strokeWidth="6" />
          <circle cx="150" cy="150" r="143" fill="none" stroke="#d97706" strokeWidth="1.5" />

          {/* Perimeter bulbs */}
          {Array.from({ length: 16 }).map((_, bulbIdx) => {
            const bulbAngle = ((bulbIdx * 360) / 16 - 90) * (Math.PI / 180);
            const bx = cx + 140 * Math.cos(bulbAngle);
            const by = cy + 140 * Math.sin(bulbAngle);
            return (
              <circle
                key={bulbIdx}
                cx={bx}
                cy={by}
                r="3.5"
                fill={bulbIdx % 2 === 0 ? "#ffffff" : "#fef08a"}
                stroke="#b45309"
                strokeWidth="1"
              />
            );
          })}

          {/* Center Hub */}
          <circle cx="150" cy="150" r="26" fill="#ffffff" stroke="#f59e0b" strokeWidth="4" />
          <circle cx="150" cy="150" r="20" fill="#fbbf24" />
        </g>

        {/* Center Star */}
        <g transform="translate(138, 138) scale(1)">
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            fill="#ffffff"
            stroke="#b45309"
            strokeWidth="0.5"
          />
        </g>

        {/* Top Pointer */}
        <g className="filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.4)]">
          <polygon points="136,2 164,2 150,30" fill="#e11d48" stroke="#ffffff" strokeWidth="2.5" />
          <circle cx="150" cy="6" r="4.5" fill="#fecdd3" stroke="#e11d48" strokeWidth="1" />
        </g>
      </svg>
    </div>
  );
}
