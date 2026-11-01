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
} from 'lucide-react';

// Mode-aware radial dial / donut gauge
function RadialIndexGauge({ score, delta, isDualMode, winnerName }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const normalizedScore = Math.min(Math.max(score || 0, 0), 100);
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-5 bg-slate-50 border border-slate-300 rounded-2xl h-full text-center relative overflow-hidden">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
        {isDualMode ? 'Winning Advantage' : 'Hardware Score'}
      </p>

      {/* SVG Radial Gauge */}
      <div className="relative w-36 h-36 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 130 130">
          <defs>
            <linearGradient id="marigoldGaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#EA580C" />
            </linearGradient>
          </defs>
          {/* Background track */}
          <circle
            cx="65"
            cy="65"
            r={radius}
            stroke="#CBD5E1"
            strokeWidth="10"
            fill="transparent"
          />
          {/* Animated score arc */}
          <motion.circle
            cx="65"
            cy="65"
            r={radius}
            stroke="url(#marigoldGaugeGrad)"
            strokeWidth="10"
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
            strokeLinecap="round"
          />
        </svg>

        {/* Center Readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black font-mono text-slate-900 tracking-tight leading-none">
            {isDualMode ? `+${delta}` : score}
          </span>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">
            {isDualMode ? 'Pts Advantage' : 'Score / 100'}
          </span>
        </div>
      </div>

      <p className="text-xs font-extrabold text-slate-900 mt-2 truncate max-w-[200px]">
        {isDualMode ? winnerName : 'Telemetry Grade'}
      </p>
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
      <div className="tactile-card p-6 sm:p-7 border border-amber-300 bg-amber-50/70 flex items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md flex-shrink-0">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">
              Live Hardware Telemetry Extraction in Progress for {extractingName}
            </h3>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              Comparative engineering verdict and score advantage will automatically benchmark as soon as telemetry parsing finishes.
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

  return (
    <div className="tactile-card p-6 sm:p-7 space-y-6">
      {/* Verdict Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl btn-gradient-marigold flex items-center justify-center shadow-md">
            <Award className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              Engineering Verdict & Hardware Telemetry Analysis
            </h2>
            <p className="text-xs text-slate-600 font-semibold mt-0.5">
              Deterministic architectural evaluation based on silicon node, sustained throttling & display pacing
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold font-mono self-start sm:self-auto flex items-center gap-1.5 shadow-sm">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          Rigorous Lab Telemetry
        </span>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
        {/* Left: Gauge Dial */}
        <div className="md:col-span-1">
          <RadialIndexGauge
            score={w.pulse_throttle_index}
            delta={winner.delta}
            isDualMode={isDualMode}
            winnerName={w.device_name}
          />
        </div>

        {/* Center: Executive Summary */}
        <div className="md:col-span-2 p-5 bg-slate-50 border border-slate-300 rounded-2xl flex flex-col justify-between space-y-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Executive Evaluation Summary
            </span>
            <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1">
              {isDualMode ? (
                <>
                  <span className="text-amber-600 font-black">{w.device_name}</span> wins the comparison by{' '}
                  <span className="font-mono text-slate-900">{winner.delta} index points</span> over {o.device_name}.
                </>
              ) : (
                <>
                  <span className="text-amber-600 font-black">{w.device_name}</span> achieves a PulseThrottle Index of{' '}
                  <span className="font-mono text-slate-900">{w.pulse_throttle_index} / 100</span>.
                </>
              )}
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed mt-2">
              {isDualMode ? (
                <>
                  Under heavy {selectedGame} load, the {w.device_name} leverages its{' '}
                  <strong className="text-slate-900">{w.soc_chipset}</strong> with superior thermal stability (
                  {w.wildlife_stability_pct}%) and peak temperatures of {w.peak_temp_celsius}°C, outlasting the {o.device_name}{' '}
                  which reached {o.peak_temp_celsius}°C.
                </>
              ) : (
                <>
                  The {w.device_name} showcases solid engineering balance with its {w.soc_chipset}. With AnTuTu v10 scoring{' '}
                  {w.antutu_v10_score ? w.antutu_v10_score.toLocaleString() : 'high'} and {w.pwm_dimming_hz} PWM dimming, it provides esports-grade frame consistency.
                </>
              )}
            </p>
          </div>

          {/* Quick Pillar Deliberation */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-200 text-xs">
            <div>
              <span className="block text-[10px] font-bold uppercase text-slate-500">Thermals</span>
              <span className="font-mono font-extrabold text-slate-900">{w.peak_temp_celsius}°C</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase text-slate-500">3DMark Pct</span>
              <span className="font-mono font-extrabold text-slate-900">{w.wildlife_stability_pct}%</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase text-slate-500">PWM Safety</span>
              <span className="font-mono font-extrabold text-slate-900">{w.pwm_dimming_hz}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase text-slate-500">Storage IO</span>
              <span className="font-mono font-extrabold text-slate-900">{w.storage_tier}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
