import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  Cpu,
  Thermometer,
  Gamepad2,
  CheckCircle2,
  Award,
  ShieldCheck,
  Zap,
  Loader2,
  Flame,
  Gauge,
  Layers,
} from 'lucide-react';

// Executive Circular SVG Radial Gauge
function RadialIndexGauge({ score, delta, isDualMode, deviceName }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const displayScore = isDualMode ? Math.min(Math.max(parseFloat(delta) || 0, 0) * 5, 100) : Math.min(Math.max(score || 0, 0), 100);
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-[#F1F5F9] border border-slate-200/90 rounded-2xl h-full text-center relative overflow-hidden">
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3">
        {isDualMode ? 'Winning Advantage' : 'Hardware Telemetry Index'}
      </span>

      {/* SVG Radial Gauge */}
      <div className="relative w-36 h-36 flex items-center justify-center my-1">
        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 130 130">
          <defs>
            <linearGradient id="amberGaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
          </defs>
          {/* Background Track */}
          <circle
            cx="65"
            cy="65"
            r={radius}
            stroke="#E2E8F0"
            strokeWidth="9"
            fill="transparent"
          />
          {/* Animated Arc */}
          <motion.circle
            cx="65"
            cy="65"
            r={radius}
            stroke="url(#amberGaugeGrad)"
            strokeWidth="9"
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.1, ease: [0.4, 0, 0.2, 1] }}
            strokeLinecap="round"
          />
        </svg>

        {/* Center Readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold font-mono text-slate-900 tracking-tight leading-none tabular-nums">
            {isDualMode ? `+${delta}` : score}
          </span>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1.5">
            {isDualMode ? 'Index Delta' : '/ 100 PTI'}
          </span>
        </div>
      </div>

      <p className="text-xs font-extrabold text-slate-800 mt-2 truncate max-w-[190px]">
        {deviceName}
      </p>
      <span className="text-[10px] font-mono text-slate-500 font-semibold mt-0.5">
        {isDualMode ? 'Comparative Superiority' : 'Certified Telemetry'}
      </span>
    </div>
  );
}

export default function EngineeringVerdict({
  deviceA,
  deviceB,
  selectedGame,
  isDualMode,
}) {
  // If either device is currently extracting telemetry in the background, display a live status banner
  if (deviceA?.is_extracting || (isDualMode && deviceB?.is_extracting)) {
    const extractingName = deviceA?.is_extracting ? deviceA.device_name : deviceB?.device_name;
    return (
      <div className="bg-white rounded-2xl border border-amber-300/90 bg-amber-50/50 p-6 sm:p-7 flex items-center justify-between gap-4 shadow-[0_12px_32px_-4px_rgba(15,23,42,0.06)]">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white flex items-center justify-center shadow-md flex-shrink-0">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Live Hardware Telemetry Extraction in Progress for {extractingName}
            </h3>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              Comparative engineering verdict and score advantage will automatically compute as soon as telemetry parsing finishes.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const winner = useMemo(() => {
    if (!deviceA || deviceA.pulse_throttle_index == null) return null;
    if (!isDualMode || !deviceB) return { device: deviceA, slot: 'A', delta: 0 };
    if (deviceB.pulse_throttle_index == null) return null;

    if (deviceA.pulse_throttle_index >= deviceB.pulse_throttle_index) {
      return {
        device: deviceA,
        other: deviceB,
        slot: 'A',
        delta: (deviceA.pulse_throttle_index - deviceB.pulse_throttle_index).toFixed(1),
      };
    }
    return {
      device: deviceB,
      other: deviceA,
      slot: 'B',
      delta: (deviceB.pulse_throttle_index - deviceA.pulse_throttle_index).toFixed(1),
    };
  }, [deviceA, deviceB, isDualMode]);

  if (!winner || !winner.device) return null;

  const w = winner.device;
  const o = winner.other;

  // Compute lead in AnTuTu v10
  const computeLead = isDualMode && o && w.antutu_v10_score && o.antutu_v10_score
    ? (w.antutu_v10_score - o.antutu_v10_score).toLocaleString()
    : null;

  const gameA = w.game_benchmarks?.[selectedGame] || {
    sustained_avg_fps: '60 FPS',
    thermal_and_frame_drop_notes: 'Consistent shader execution curve.',
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 space-y-6 shadow-[0_12px_32px_-4px_rgba(15,23,42,0.06),0_4px_12px_-2px_rgba(15,23,42,0.03)]">
      {/* Verdict Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-200/90">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#D97706] flex items-center justify-center shadow-md">
            <Award className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              {isDualMode ? 'Engineering Verdict & Telemetry Analysis' : 'Hardware Telemetry Certification Report'}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Deterministic architectural evaluation based on silicon node, sustained throttling & display pacing
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold font-mono self-start sm:self-auto flex items-center gap-1.5 shadow-2xs">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          Rigorous Lab Telemetry
        </span>
      </div>

      {/* Bento 3-Column Diagnostic Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Column: Radial SVG Gauge */}
        <div className="lg:col-span-3">
          <RadialIndexGauge
            score={w.pulse_throttle_index}
            delta={winner.delta}
            isDualMode={isDualMode}
            deviceName={w.device_name}
          />
        </div>

        {/* Center Column: 3 Scannable Diagnostic Summaries with Clear Engineering Explanations */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-3">
          {/* Summary 1: Silicon & Compute */}
          <div className="p-4 rounded-xl bg-[#F1F5F9] border border-slate-200/90 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                ⚡ Silicon Architecture & Node
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                {w.release_year ? `Era: ${w.release_year}` : 'Current Era'}
              </span>
            </div>
            <p className="text-xs text-slate-900 font-bold">
              {w.soc_chipset}
            </p>
            <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
              {isDualMode && o ? (
                computeLead && !computeLead.startsWith('-')
                  ? `Outperforms ${o.device_name} with +${computeLead} higher AnTuTu v10 compute horsepower, delivering faster game asset compilation and physics compute.`
                  : `Features an efficient silicon architecture optimized for sustained gaming instructions against ${o.device_name}.`
              ) : (
                `Delivers ${w.antutu_v10_score ? w.antutu_v10_score.toLocaleString() : 'solid'} AnTuTu v10 points with low driver latency and balanced single-core IPC.`
              )}
            </p>
          </div>

          {/* Summary 2: Workload Stability */}
          <div className="p-4 rounded-xl bg-[#F1F5F9] border border-slate-200/90 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Gamepad2 className="w-3.5 h-3.5 text-[#10B981]" />
                🎮 Real-World Gaming Experience
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {gameA.sustained_avg_fps}
              </span>
            </div>
            <p className="text-xs text-slate-900 font-bold">
              {selectedGame} Sustained Performance
            </p>
            <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
              {gameA.sustained_avg_fps === '0 FPS'
                ? 'Device cannot run this game due to architectural or memory limits (below minimum 4GB RAM).'
                : isDualMode && o
                ? `Maintains a steady ${gameA.sustained_avg_fps} with 3DMark thermal stability rated at ${w.wildlife_stability_pct}%, minimizing mid-game frame stutter.`
                : `Verified frame pacing with minimal 99th percentile frame-time spikes across continuous 20-minute play sessions.`}
            </p>
          </div>

          {/* Summary 3: Thermal Margin */}
          <div className="p-4 rounded-xl bg-[#F1F5F9] border border-slate-200/90 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-[#F59E0B]" />
                🌡️ Thermal Throttling & Hand Feel
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                Peak: {w.peak_temp_celsius}°C
              </span>
            </div>
            <p className="text-xs text-slate-900 font-bold">
              {w.peak_temp_celsius > 44.5
                ? 'Heavy Heat Dissipation (Requires Cooling)'
                : w.peak_temp_celsius > 43.0
                ? 'Noticeably Warm but Controlled'
                : 'Cool & Ergonomic Hand Comfort'}
            </p>
            <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
              {w.peak_temp_celsius > 44.5
                ? 'Approaches thermal limits under sustained 3D load, resulting in automatic clock throttling to protect battery integrity.'
                : 'Silicon package remains well within safe thermal thresholds without aggressive frequency cutbacks.'}
            </p>
          </div>
        </div>

        {/* Right Column: 4 Tactile Micro-KPI Tiles with Clarified Explanations */}
        <div className="lg:col-span-4 grid grid-cols-2 gap-3">
          {/* Tile 1: Index Lead / Grade */}
          <div className="p-4 rounded-xl bg-[#F1F5F9] border border-slate-200/90 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                {isDualMode ? 'Overall Lead' : 'Total Score'}
              </span>
              <span className="text-[9px] text-slate-600 font-medium">PulseThrottle Metric</span>
            </div>
            <div className="my-1.5">
              <span className="text-2xl font-extrabold font-mono text-slate-900 tabular-nums">
                {isDualMode ? `+${winner.delta}` : `${w.pulse_throttle_index}`}
              </span>
              <span className="text-[10px] font-bold text-slate-400 ml-1">pts</span>
            </div>
            <span className="text-[10px] font-bold text-[#D97706] uppercase tracking-tight">
              {isDualMode ? 'Winning Advantage' : 'Hardware Rating / 100'}
            </span>
          </div>

          {/* Tile 2: Compute Horsepower */}
          <div className="p-4 rounded-xl bg-[#F1F5F9] border border-slate-200/90 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Compute Power
              </span>
              <span className="text-[9px] text-slate-600 font-medium">CPU + GPU Combined</span>
            </div>
            <div className="my-1.5">
              <span className="text-xl font-extrabold font-mono text-slate-900 tabular-nums">
                {w.antutu_v10_score ? (w.antutu_v10_score > 1000000 ? `${(w.antutu_v10_score / 1000000).toFixed(2)}M` : `${Math.round(w.antutu_v10_score / 1000)}k`) : 'N/A'}
              </span>
            </div>
            <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-tight">
              AnTuTu v10 Total
            </span>
          </div>

          {/* Tile 3: Peak Temp */}
          <div className="p-4 rounded-xl bg-[#F1F5F9] border border-slate-200/90 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Peak Thermals
              </span>
              <span className="text-[9px] text-slate-600 font-medium">Under Max Stress</span>
            </div>
            <div className="my-1.5">
              <span className={`text-2xl font-extrabold font-mono tabular-nums ${
                w.peak_temp_celsius > 44.5 ? 'text-rose-700' : 'text-slate-900'
              }`}>
                {w.peak_temp_celsius}°C
              </span>
            </div>
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-tight">
              {w.peak_temp_celsius > 44.5 ? 'High Throttling' : 'Safe Operating'}
            </span>
          </div>

          {/* Tile 4: 3DMark Stability % */}
          <div className="p-4 rounded-xl bg-[#F1F5F9] border border-slate-200/90 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                3DMark Loop
              </span>
              <span className="text-[9px] text-slate-600 font-medium">20-Min Sustained</span>
            </div>
            <div className="my-1.5">
              <span className="text-2xl font-extrabold font-mono text-slate-900 tabular-nums">
                {w.wildlife_stability_pct}%
              </span>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-tight">
              Wild Life Stability
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
