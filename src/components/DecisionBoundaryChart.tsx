import React, { useState } from 'react';
import type { EvaluationResult } from '../types';

interface DecisionBoundaryChartProps {
  currentResult: EvaluationResult | null;
  history: EvaluationResult[];
  onSelectRecord?: (record: EvaluationResult) => void;
  liveCoordinates?: { creditScore: number; dti: number };
}

export const DecisionBoundaryChart: React.FC<DecisionBoundaryChartProps> = ({
  currentResult,
  history,
  onSelectRecord,
  liveCoordinates,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<EvaluationResult | null>(null);
  const [showHistory, setShowHistory] = useState(true);

  // Coordinate scales:
  // X: 300 to 850 (range: 550)
  // Y: 0 to 60% (range: 60)
  // Chart dimensions inside SVG viewBox (800 x 500)
  const padding = { top: 40, right: 40, bottom: 60, left: 70 };
  const width = 800;
  const height = 500;
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const scoreToX = (score: number) => {
    const clamped = Math.max(300, Math.min(850, score));
    return padding.left + ((clamped - 300) / 550) * plotWidth;
  };

  const dtiToY = (dti: number) => {
    const clamped = Math.max(0, Math.min(60, dti));
    return padding.top + (1 - clamped / 60) * plotHeight;
  };

  const xToScore = (x: number) => {
    const ratio = (x - padding.left) / plotWidth;
    return Math.round(300 + ratio * 550);
  };

  const yToDti = (y: number) => {
    const ratio = (y - padding.top) / plotHeight;
    return Math.round((1 - ratio) * 60 * 10) / 10;
  };

  // Active beacon coordinates (from current live form or latest evaluation)
  const activeScore = liveCoordinates?.creditScore ?? currentResult?.creditScore ?? 720;
  const activeDti = liveCoordinates?.dti ?? currentResult?.dti ?? 28;

  const activeX = scoreToX(activeScore);
  const activeY = dtiToY(activeDti);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 shadow-xl space-y-4">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-3">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight">
            2D Decision Boundary Plane
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Empirical Classification Space: Bureau Credit Score ($X$) vs. Debt-to-Income ($Y$)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={showHistory}
              onChange={(e) => setShowHistory(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-emerald-400 focus:ring-0"
            />
            <span>Plot Portfolio History ({history.length} pts)</span>
          </label>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full overflow-hidden rounded-xl bg-slate-950 border border-slate-800">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none font-sans"
        >
          <defs>
            {/* Grid Pattern */}
            <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.75" />
            </pattern>
            {/* Radial Glow for Live Applicant */}
            <radialGradient id="beacon-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#10b981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Background Grid */}
          <rect
            x={padding.left}
            y={padding.top}
            width={plotWidth}
            height={plotHeight}
            fill="#090d16"
          />
          <rect
            x={padding.left}
            y={padding.top}
            width={plotWidth}
            height={plotHeight}
            fill="url(#grid-pattern)"
          />

          {/* 1. Prime Approval Zone: Score >= 700 and DTI <= 45 */}
          <rect
            x={scoreToX(700)}
            y={dtiToY(45)}
            width={scoreToX(850) - scoreToX(700)}
            height={dtiToY(0) - dtiToY(45)}
            fill="#064e3b"
            fillOpacity="0.35"
          />

          {/* 2. Near-Prime Approval Zone: Score 620 to 699 and DTI <= 36 */}
          <rect
            x={scoreToX(620)}
            y={dtiToY(36)}
            width={scoreToX(700) - scoreToX(620)}
            height={dtiToY(0) - dtiToY(36)}
            fill="#047857"
            fillOpacity="0.25"
          />

          {/* 3. Borderline Exception Buffer: Score 620 to 699 and DTI 36 to 40 */}
          <rect
            x={scoreToX(620)}
            y={dtiToY(40)}
            width={scoreToX(700) - scoreToX(620)}
            height={dtiToY(36) - dtiToY(40)}
            fill="#78350f"
            fillOpacity="0.3"
          />

          {/* Decision Boundary Threshold Lines */}
          {/* FICO 700 Line */}
          <line
            x1={scoreToX(700)}
            y1={dtiToY(0)}
            x2={scoreToX(700)}
            y2={dtiToY(60)}
            stroke="#10b981"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <text
            x={scoreToX(700) + 4}
            y={padding.top + 16}
            fill="#34d399"
            fontSize="10"
            fontFamily="monospace"
          >
            FICO 700 (Prime)
          </text>

          {/* FICO 620 Line */}
          <line
            x1={scoreToX(620)}
            y1={dtiToY(0)}
            x2={scoreToX(620)}
            y2={dtiToY(60)}
            stroke="#fbbf24"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <text
            x={scoreToX(620) + 4}
            y={padding.top + 16}
            fill="#fbbf24"
            fontSize="10"
            fontFamily="monospace"
          >
            FICO 620 (Near-Prime Cutoff)
          </text>

          {/* DTI 45% Hard Cap Line */}
          <line
            x1={scoreToX(700)}
            y1={dtiToY(45)}
            x2={scoreToX(850)}
            y2={dtiToY(45)}
            stroke="#10b981"
            strokeWidth="2"
          />
          <text
            x={scoreToX(850) - 8}
            y={dtiToY(45) - 6}
            fill="#34d399"
            fontSize="10"
            fontFamily="monospace"
            textAnchor="end"
          >
            45% DTI Max Tolerance
          </text>

          {/* DTI 36% Near Prime Cap Line */}
          <line
            x1={scoreToX(620)}
            y1={dtiToY(36)}
            x2={scoreToX(700)}
            y2={dtiToY(36)}
            stroke="#fbbf24"
            strokeWidth="2"
          />
          <text
            x={scoreToX(620) + 4}
            y={dtiToY(36) - 6}
            fill="#fbbf24"
            fontSize="10"
            fontFamily="monospace"
          >
            36% DTI Cap
          </text>

          {/* Axis Labels & Ticks */}
          {/* X Ticks */}
          {[300, 400, 500, 600, 700, 800, 850].map((score) => {
            const x = scoreToX(score);
            return (
              <g key={score}>
                <line
                  x1={x}
                  y1={height - padding.bottom}
                  x2={x}
                  y2={height - padding.bottom + 6}
                  stroke="#475569"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={height - padding.bottom + 20}
                  fill="#94a3b8"
                  fontSize="11"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {score}
                </text>
              </g>
            );
          })}
          <text
            x={width / 2}
            y={height - 15}
            fill="#cbd5e1"
            fontSize="12"
            fontWeight="600"
            textAnchor="middle"
          >
            Bureau Credit Score (FICO Tier)
          </text>

          {/* Y Ticks */}
          {[0, 10, 20, 30, 40, 50, 60].map((dtiVal) => {
            const y = dtiToY(dtiVal);
            return (
              <g key={dtiVal}>
                <line
                  x1={padding.left - 6}
                  y1={y}
                  x2={padding.left}
                  y2={y}
                  stroke="#475569"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 12}
                  y={y + 4}
                  fill="#94a3b8"
                  fontSize="11"
                  fontFamily="monospace"
                  textAnchor="end"
                >
                  {dtiVal}%
                </text>
              </g>
            );
          })}
          <text
            x={-height / 2}
            y={22}
            fill="#cbd5e1"
            fontSize="12"
            fontWeight="600"
            textAnchor="middle"
            transform="rotate(-90)"
          >
            Debt-to-Income Ratio (DTI %)
          </text>

          {/* Historic Ledger Points */}
          {showHistory &&
            history.map((record) => {
              const x = scoreToX(record.creditScore);
              const y = dtiToY(record.dti);
              const isApp = record.status === 'Approved';
              const isBorder = record.status === 'Borderline Review';
              const dotColor = isApp ? '#10b981' : isBorder ? '#f59e0b' : '#ef4444';

              return (
                <circle
                  key={record.id}
                  cx={x}
                  cy={y}
                  r="5"
                  fill={dotColor}
                  fillOpacity="0.75"
                  stroke="#0f172a"
                  strokeWidth="1.5"
                  className="cursor-pointer transition-transform hover:scale-150"
                  onMouseEnter={() => setHoveredPoint(record)}
                  onMouseLeave={() => setHoveredPoint(null)}
                  onClick={() => onSelectRecord && onSelectRecord(record)}
                />
              );
            })}

          {/* Live Active Applicant Beacon */}
          <g>
            {/* Outer radar pulse */}
            <circle
              cx={activeX}
              cy={activeY}
              r="24"
              fill="url(#beacon-glow)"
              className="animate-pulse"
            />
            {/* Target Ring */}
            <circle
              cx={activeX}
              cy={activeY}
              r="10"
              fill="none"
              stroke="#34d399"
              strokeWidth="2"
            />
            {/* Central Solid Point */}
            <circle
              cx={activeX}
              cy={activeY}
              r="4.5"
              fill="#ffffff"
            />
            {/* Coordinate Tag */}
            <rect
              x={activeX + 12}
              y={activeY - 26}
              width="145"
              height="28"
              rx="6"
              fill="#020617"
              fillOpacity="0.92"
              stroke="#34d399"
              strokeWidth="1"
            />
            <text
              x={activeX + 18}
              y={activeY - 8}
              fill="#34d399"
              fontSize="11"
              fontFamily="monospace"
              fontWeight="bold"
            >
              FICO: {activeScore} · DTI: {activeDti}%
            </text>
          </g>
        </svg>

        {/* Hover inspection card overlay */}
        {hoveredPoint && (
          <div
            className="absolute z-20 pointer-events-none p-2.5 rounded-lg bg-slate-900 border border-slate-700 shadow-xl text-xs space-y-1"
            style={{
              left: `${Math.min(75, Math.max(15, ((scoreToX(hoveredPoint.creditScore) - padding.left) / plotWidth) * 100))}%`,
              top: `${Math.max(10, ((dtiToY(hoveredPoint.dti) - padding.top) / plotHeight) * 100 - 15)}%`,
            }}
          >
            <div className="font-semibold text-white">{hoveredPoint.applicantName}</div>
            <div className="text-[11px] font-mono text-slate-300">
              Score: {hoveredPoint.creditScore} · DTI: {hoveredPoint.dti}% · ${hoveredPoint.requestedAmount.toLocaleString()}
            </div>
            <div
              className={`text-[10px] font-bold uppercase font-mono ${
                hoveredPoint.status === 'Approved'
                  ? 'text-emerald-400'
                  : hoveredPoint.status === 'Borderline Review'
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {hoveredPoint.status}
            </div>
          </div>
        )}
      </div>

      {/* Plane Legend & Zones Explanation */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs pt-1">
        <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800">
          <div className="w-3.5 h-3.5 rounded bg-emerald-950/80 border border-emerald-500/50 shrink-0"></div>
          <div>
            <div className="font-medium text-slate-200">Prime Zone</div>
            <div className="text-[10px] text-slate-500">Score ≥700 · DTI ≤45%</div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800">
          <div className="w-3.5 h-3.5 rounded bg-emerald-800/40 border border-emerald-400/50 shrink-0"></div>
          <div>
            <div className="font-medium text-slate-200">Near-Prime Zone</div>
            <div className="text-[10px] text-slate-500">Score 620-699 · DTI ≤36%</div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800">
          <div className="w-3.5 h-3.5 rounded bg-amber-950/60 border border-amber-500/50 shrink-0"></div>
          <div>
            <div className="font-medium text-slate-200">HITL Buffer</div>
            <div className="text-[10px] text-slate-500">Score 620-699 · DTI 36-40%</div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800">
          <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 border border-white shrink-0 animate-ping"></div>
          <div>
            <div className="font-medium text-slate-200">Live Applicant Beacon</div>
            <div className="text-[10px] text-emerald-400 font-mono">FICO {activeScore} · {activeDti}% DTI</div>
          </div>
        </div>
      </div>
    </div>
  );
};
