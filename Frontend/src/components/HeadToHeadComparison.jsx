import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  Trophy,
  Gamepad2,
  Thermometer,
  Activity,
  Cpu,
  HardDrive,
  Eye,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import DeviceThumbnail from './DeviceThumbnail.jsx';
import { AnimatedNumber, Tilt, Spotlight } from './motion/index.js';

/**
 * Head-to-Head Comparison View
 * Modern, clean engineering dashboard layout inspired by Linear & Vercel
 * - Top: Clean Device A vs Device B selection header with prominent overall PulseThrottle score and delta
 * - Middle: Key Hero Metrics (Sustained FPS, Peak Thermals, 3DMark Stability) in a clean 3-column comparative summary
 * - Bottom: Progressive disclosure accordion ("View Full Telemetry Breakdown") containing 4 sub-pillars and synthetic specs
 */
export default function HeadToHeadComparison({
  deviceA,
  deviceB,
  selectedGame = 'BGMI',
  isDualMode = true,
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!deviceA) return null;

  const isExtracting = deviceA.is_extracting || (isDualMode && deviceB?.is_extracting);

  // Score calculations
  const scoreA = parseFloat(deviceA.pulse_throttle_index) || 0;
  const scoreB = deviceB ? parseFloat(deviceB.pulse_throttle_index) || 0 : 0;
  const winner = isDualMode && deviceB ? (scoreA >= scoreB ? 'A' : 'B') : 'A';
  const scoreDelta = isDualMode && deviceB ? Math.abs(scoreA - scoreB).toFixed(1) : '0';

  // Game benchmarks
  const gameBenchA = deviceA.game_benchmarks?.[selectedGame] || {
    sustained_avg_fps: '60 FPS',
    max_unlocked_setting: 'High / 60 FPS',
  };
  const gameBenchB = deviceB?.game_benchmarks?.[selectedGame] || {
    sustained_avg_fps: '60 FPS',
    max_unlocked_setting: 'High / 60 FPS',
  };

  const fpsA = parseInt(gameBenchA.sustained_avg_fps) || 0;
  const fpsB = parseInt(gameBenchB?.sustained_avg_fps) || 0;

  // Breakdown 4 pillars
  const bA = deviceA.score_breakdown || { tss: 75, fpe: 85, compute: 80, storage: 85 };
  const bB = deviceB?.score_breakdown || { tss: 75, fpe: 85, compute: 80, storage: 85 };

  return (
    <div className="bg-white dark:bg-[#140C22] rounded-2xl border border-slate-200/90 dark:border-white/10 shadow-[0_4px_24px_-4px_rgba(15,23,42,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] overflow-hidden transition-all relative">
      {/* Motion Primitive: Ambient Spotlight */}
      <Spotlight size={380} className="from-amber-400/8 via-amber-200/4 to-transparent dark:from-amber-500/10 dark:via-purple-500/5" />

      {/* 1. TOP HEADER: Clean Device A vs Device B Matchup with Prominent Scores */}
      <div className="p-6 sm:p-8 lg:p-10 border-b border-slate-100 dark:border-white/5 bg-white dark:bg-[#140C22] relative z-10">
        {isDualMode && deviceB ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Device A Identity & Score */}
            <div className="lg:col-span-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <Tilt rotationFactor={8} className="flex-shrink-0">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-[#1B1228] border border-slate-200/90 dark:border-white/10 flex items-center justify-center p-1 shadow-2xs">
                    <DeviceThumbnail
                      src={deviceA.image_url}
                      alt={deviceA.device_name}
                      brand={deviceA.brand}
                      iconSize="w-6 h-6"
                    />
                  </div>
                </Tilt>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate">
                      {deviceA.device_name}
                    </h3>
                    {winner === 'A' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white shadow-2xs">
                        Winner
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                    {deviceA.soc_chipset}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                    {deviceA.os || 'Mobile OS'} • {deviceA.release_year || 'Current'}
                  </p>
                </div>
              </div>

              <div className="text-right flex-shrink-0 pl-2">
                <span className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-900 dark:text-white tracking-tight tabular-nums">
                  <AnimatedNumber value={scoreA} decimals={1} />
                </span>
                <span className="block text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  PTI Score
                </span>
              </div>
            </div>

            {/* Matchup Center Delta Badge */}
            <div className="lg:col-span-2 flex flex-col items-center justify-center py-2 lg:py-0 border-y lg:border-y-0 lg:border-x border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-700/40 text-amber-700 dark:text-amber-400 font-mono text-xs font-bold shadow-2xs">
                <AnimatedNumber value={parseFloat(scoreDelta)} decimals={1} prefix="+" />
                <span className="text-[10px] uppercase font-sans font-semibold text-amber-800 dark:text-amber-300 ml-1">
                  Advantage
                </span>
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1">
                {winner === 'A' ? deviceA.device_name : deviceB.device_name} leads
              </span>
            </div>

            {/* Device B Identity & Score */}
            <div className="lg:col-span-5 flex items-center justify-between gap-4">
              <div className="text-left lg:text-left flex-shrink-0 pr-2 order-2 lg:order-1">
                <span className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-900 dark:text-white tracking-tight tabular-nums">
                  <AnimatedNumber value={scoreB} decimals={1} />
                </span>
                <span className="block text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  PTI Score
                </span>
              </div>

              <div className="flex items-center gap-4 min-w-0 order-1 lg:order-2 ml-auto">
                <div className="min-w-0 text-left lg:text-right">
                  <div className="flex items-center gap-2 justify-start lg:justify-end">
                    {winner === 'B' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white shadow-2xs">
                        Winner
                      </span>
                    )}
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate">
                      {deviceB.device_name}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                    {deviceB.soc_chipset}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                    {deviceB.os || 'Mobile OS'} • {deviceB.release_year || 'Current'}
                  </p>
                </div>
                <Tilt rotationFactor={8} className="flex-shrink-0">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-[#1B1228] border border-slate-200/90 dark:border-white/10 flex items-center justify-center p-1 shadow-2xs">
                    <DeviceThumbnail
                      src={deviceB.image_url}
                      alt={deviceB.device_name}
                      brand={deviceB.brand}
                      iconSize="w-6 h-6"
                    />
                  </div>
                </Tilt>
              </div>
            </div>
          </div>
        ) : (
          /* Single Device Header */
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Tilt rotationFactor={8} className="flex-shrink-0">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-[#1B1228] border border-slate-200/90 dark:border-white/10 flex items-center justify-center p-1">
                  <DeviceThumbnail
                    src={deviceA.image_url}
                    alt={deviceA.device_name}
                    brand={deviceA.brand}
                    iconSize="w-7 h-7"
                  />
                </div>
              </Tilt>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {deviceA.device_name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  {deviceA.soc_chipset} • {deviceA.gpu_and_storage}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-4xl font-extrabold font-mono text-slate-900 dark:text-white tabular-nums">
                  <AnimatedNumber value={scoreA} decimals={1} />
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-mono ml-1">/ 100</span>
                <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  PulseThrottle Index
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. MIDDLE: KEY HERO METRICS (3-Column Comparative Summary) */}
      <div className="p-6 sm:p-8 lg:p-10 bg-slate-50/50 dark:bg-[#0E0717]/60 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Hero 1: Sustained Gaming FPS */}
          <div className="bg-white dark:bg-[#170F26] p-5 rounded-xl border border-slate-200/80 dark:border-white/10 space-y-3 shadow-2xs hover:border-slate-300 dark:hover:border-white/20 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <Gamepad2 className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                Sustained FPS ({selectedGame})
              </span>
              {isDualMode && deviceB && (
                <span className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400">
                  {fpsA === fpsB ? 'Tied' : fpsA > fpsB ? `+${fpsA - fpsB} FPS` : `+${fpsB - fpsA} FPS`}
                </span>
              )}
            </div>

            {isDualMode && deviceB ? (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="border-r border-slate-100 dark:border-white/5 pr-2">
                  <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate">
                    {deviceA.device_name}
                  </span>
                  <span className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                    {fpsA > 0 ? (
                      <AnimatedNumber value={fpsA} suffix=" FPS" />
                    ) : (
                      gameBenchA.sustained_avg_fps
                    )}
                  </span>
                </div>
                <div className="pl-1">
                  <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate">
                    {deviceB.device_name}
                  </span>
                  <span className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                    {fpsB > 0 ? (
                      <AnimatedNumber value={fpsB} suffix=" FPS" />
                    ) : (
                      gameBenchB.sustained_avg_fps
                    )}
                  </span>
                </div>
              </div>
            ) : (
              <div className="pt-1">
                <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                  {fpsA > 0 ? (
                    <AnimatedNumber value={fpsA} suffix=" FPS" />
                  ) : (
                    gameBenchA.sustained_avg_fps
                  )}
                </span>
                <span className="block text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                  Max: {gameBenchA.max_unlocked_setting}
                </span>
              </div>
            )}

            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-normal leading-relaxed truncate">
              {gameBenchA.thermal_and_frame_drop_notes || 'Consistent shader pacing curve.'}
            </p>
          </div>

          {/* Hero 2: Peak Thermals */}
          <div className="bg-white dark:bg-[#170F26] p-5 rounded-xl border border-slate-200/80 dark:border-white/10 space-y-3 shadow-2xs hover:border-slate-300 dark:hover:border-white/20 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <Thermometer className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                Peak Thermals
              </span>
              {isDualMode && deviceB && deviceA.peak_temp_celsius && deviceB.peak_temp_celsius && (
                <span className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400">
                  {Math.abs(deviceA.peak_temp_celsius - deviceB.peak_temp_celsius).toFixed(1)}°C delta
                </span>
              )}
            </div>

            {isDualMode && deviceB ? (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="border-r border-slate-100 dark:border-white/5 pr-2">
                  <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate">
                    {deviceA.device_name}
                  </span>
                  <span
                    className={`text-xl font-bold font-mono tabular-nums ${
                      deviceA.peak_temp_celsius > 44.5 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {deviceA.peak_temp_celsius ? (
                      <AnimatedNumber value={deviceA.peak_temp_celsius} decimals={1} suffix="°C" />
                    ) : (
                      'N/A'
                    )}
                  </span>
                </div>
                <div className="pl-1">
                  <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate">
                    {deviceB.device_name}
                  </span>
                  <span
                    className={`text-xl font-bold font-mono tabular-nums ${
                      deviceB.peak_temp_celsius > 44.5 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {deviceB.peak_temp_celsius ? (
                      <AnimatedNumber value={deviceB.peak_temp_celsius} decimals={1} suffix="°C" />
                    ) : (
                      'N/A'
                    )}
                  </span>
                </div>
              </div>
            ) : (
              <div className="pt-1">
                <span
                  className={`text-2xl font-bold font-mono tabular-nums ${
                    deviceA.peak_temp_celsius > 44.5 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {deviceA.peak_temp_celsius ? (
                    <AnimatedNumber value={deviceA.peak_temp_celsius} decimals={1} suffix="°C" />
                  ) : (
                    'N/A'
                  )}
                </span>
                <span className="block text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                  {deviceA.peak_temp_celsius > 44.5 ? 'Heavy Heat Load' : 'Safe Operating Temperature'}
                </span>
              </div>
            )}

            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-normal leading-relaxed">
              {deviceA.peak_temp_celsius > 44.5
                ? 'Approaches thermal throttling limits under load.'
                : 'Controlled heat dissipation curve.'}
            </p>
          </div>

          {/* Hero 3: 3DMark Loop Stability */}
          <div className="bg-white dark:bg-[#170F26] p-5 rounded-xl border border-slate-200/80 dark:border-white/10 space-y-3 shadow-2xs hover:border-slate-300 dark:hover:border-white/20 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                3DMark Stability
              </span>
              {isDualMode && deviceB && deviceA.wildlife_stability_pct && deviceB.wildlife_stability_pct && (
                <span className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400">
                  {Math.abs(deviceA.wildlife_stability_pct - deviceB.wildlife_stability_pct).toFixed(1)}% delta
                </span>
              )}
            </div>

            {isDualMode && deviceB ? (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="border-r border-slate-100 dark:border-white/5 pr-2">
                  <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate">
                    {deviceA.device_name}
                  </span>
                  <span className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                    {deviceA.wildlife_stability_pct ? (
                      <AnimatedNumber value={deviceA.wildlife_stability_pct} decimals={1} suffix="%" />
                    ) : (
                      'N/A'
                    )}
                  </span>
                </div>
                <div className="pl-1">
                  <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate">
                    {deviceB.device_name}
                  </span>
                  <span className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                    {deviceB.wildlife_stability_pct ? (
                      <AnimatedNumber value={deviceB.wildlife_stability_pct} decimals={1} suffix="%" />
                    ) : (
                      'N/A'
                    )}
                  </span>
                </div>
              </div>
            ) : (
              <div className="pt-1">
                <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                  {deviceA.wildlife_stability_pct ? (
                    <AnimatedNumber value={deviceA.wildlife_stability_pct} decimals={1} suffix="%" />
                  ) : (
                    'N/A'
                  )}
                </span>
                <span className="block text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                  20-Minute Wild Life Stress Loop
                </span>
              </div>
            )}

            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-normal leading-relaxed">
              Sustained 3D rendering resilience against heat-induced throttling.
            </p>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM: PROGRESSIVE DISCLOSURE ACCORDION ("View Full Telemetry Breakdown") */}
      <div className="border-t-2 border-amber-300/80 dark:border-amber-500/40 bg-gradient-to-r from-amber-500/[0.08] via-amber-500/[0.03] to-slate-50 dark:to-[#140C22] transition-colors">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-6 sm:px-8 py-4 flex items-center justify-between text-xs font-semibold transition-all cursor-pointer select-none group hover:bg-amber-500/[0.12] dark:hover:bg-amber-500/[0.08]"
        >
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-amber-500 text-white shadow-2xs group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4" />
            </span>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                  {isExpanded ? 'Hide Detailed Telemetry & Benchmarks' : 'View Full Telemetry Breakdown'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-400/50 uppercase tracking-wider">
                  Hardware Deep Dive
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Sub-Pillars, AnTuTu v10 Total, Geekbench 6, Storage Tier & PWM Eye Safety
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="hidden sm:inline-block text-xs font-bold text-amber-900/90 dark:text-amber-400 group-hover:text-amber-950 dark:group-hover:text-amber-300">
              {isExpanded ? 'Collapse' : 'Expand All Specs'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-white dark:bg-[#1B1228] border border-slate-200/90 dark:border-white/10 shadow-2xs flex items-center justify-center text-slate-600 dark:text-slate-400 group-hover:border-amber-400 group-hover:text-amber-800 dark:group-hover:text-amber-400 transition-colors">
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  isExpanded ? 'rotate-180 text-amber-800 dark:text-amber-400' : ''
                }`}
              />
            </div>
          </div>
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="p-6 sm:p-8 lg:p-10 space-y-8 border-t border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-[#0E0717]/40">
                {/* 4 Sub-Pillars Comparative Table */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <span>Core Architectural Pillars</span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal normal-case">
                      Weighted: 35% Thermal • 30% Compute • 20% Storage • 15% OS
                    </span>
                  </div>

                  {isDualMode && deviceB && (
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-2 pt-0.5">
                      <span className="flex items-center gap-1.5 text-slate-900 dark:text-white font-bold">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-800 dark:bg-amber-500 inline-block" />
                        {deviceA.device_name}
                      </span>
                      <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-bold">
                        {deviceB.device_name}
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-400 dark:bg-slate-500 inline-block" />
                      </span>
                    </div>
                  )}

                  <div className="bg-white dark:bg-[#140C22] rounded-xl border border-slate-200/80 dark:border-white/10 divide-y divide-slate-100 dark:divide-white/5 shadow-2xs">
                    {/* Pillar 1: TSS */}
                    <div className="p-4 grid grid-cols-12 gap-4 items-center text-xs">
                      <div className="col-span-4 sm:col-span-3 font-semibold text-slate-800 dark:text-slate-200">
                        Thermal Stability (TSS)
                      </div>
                      <div className="col-span-8 sm:col-span-9 flex items-center justify-between gap-4 font-mono font-bold tabular-nums">
                        <span className="text-slate-900 dark:text-white w-16">
                          <AnimatedNumber value={bA.tss || 75.0} decimals={1} />
                        </span>
                        <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden flex">
                          <motion.div
                            className="h-full bg-slate-800 dark:bg-amber-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(bA.tss || 75, 100)}%` }}
                            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                          />
                        </div>
                        {isDualMode && deviceB && (
                          <>
                            <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden flex">
                              <motion.div
                                className="h-full bg-slate-400 dark:bg-slate-500 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(bB.tss || 75, 100)}%` }}
                                transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                              />
                            </div>
                            <span className="text-slate-500 dark:text-slate-400 w-16 text-right">
                              <AnimatedNumber value={bB.tss || 75.0} decimals={1} />
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Pillar 2: FPE */}
                    <div className="p-4 grid grid-cols-12 gap-4 items-center text-xs">
                      <div className="col-span-4 sm:col-span-3 font-semibold text-slate-800 dark:text-slate-200">
                        FPS Pacing Efficiency (FPE)
                      </div>
                      <div className="col-span-8 sm:col-span-9 flex items-center justify-between gap-4 font-mono font-bold tabular-nums">
                        <span className="text-slate-900 dark:text-white w-16">
                          <AnimatedNumber value={bA.fpe || 88.0} decimals={1} suffix="%" />
                        </span>
                        <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden flex">
                          <motion.div
                            className="h-full bg-slate-800 dark:bg-amber-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(bA.fpe || 88, 100)}%` }}
                            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                          />
                        </div>
                        {isDualMode && deviceB && (
                          <>
                            <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden flex">
                              <motion.div
                                className="h-full bg-slate-400 dark:bg-slate-500 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(bB.fpe || 88, 100)}%` }}
                                transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                              />
                            </div>
                            <span className="text-slate-500 dark:text-slate-400 w-16 text-right">
                              <AnimatedNumber value={bB.fpe || 88.0} decimals={1} suffix="%" />
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Pillar 3: Compute */}
                    <div className="p-4 grid grid-cols-12 gap-4 items-center text-xs">
                      <div className="col-span-4 sm:col-span-3 font-semibold text-slate-800 dark:text-slate-200">
                        Compute Index
                      </div>
                      <div className="col-span-8 sm:col-span-9 flex items-center justify-between gap-4 font-mono font-bold tabular-nums">
                        <span className="text-slate-900 dark:text-white w-16">
                          <AnimatedNumber value={bA.compute || 85.0} decimals={1} />
                        </span>
                        <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden flex">
                          <motion.div
                            className="h-full bg-slate-800 dark:bg-amber-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(bA.compute || 85, 100)}%` }}
                            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                          />
                        </div>
                        {isDualMode && deviceB && (
                          <>
                            <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden flex">
                              <motion.div
                                className="h-full bg-slate-400 dark:bg-slate-500 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(bB.compute || 85, 100)}%` }}
                                transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                              />
                            </div>
                            <span className="text-slate-500 dark:text-slate-400 w-16 text-right">
                              <AnimatedNumber value={bB.compute || 85.0} decimals={1} />
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Pillar 4: Storage */}
                    <div className="p-4 grid grid-cols-12 gap-4 items-center text-xs">
                      <div className="col-span-4 sm:col-span-3 font-semibold text-slate-800 dark:text-slate-200">
                        Storage & Bus Bandwidth
                      </div>
                      <div className="col-span-8 sm:col-span-9 flex items-center justify-between gap-4 font-mono font-bold tabular-nums">
                        <span className="text-slate-900 dark:text-white w-16">
                          <AnimatedNumber value={bA.storage || 90.0} decimals={1} />
                        </span>
                        <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden flex">
                          <motion.div
                            className="h-full bg-slate-800 dark:bg-amber-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(bA.storage || 90, 100)}%` }}
                            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                          />
                        </div>
                        {isDualMode && deviceB && (
                          <>
                            <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden flex">
                              <motion.div
                                className="h-full bg-slate-400 dark:bg-slate-500 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(bB.storage || 90, 100)}%` }}
                                transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                              />
                            </div>
                            <span className="text-slate-500 dark:text-slate-400 w-16 text-right">
                              <AnimatedNumber value={bB.storage || 90.0} decimals={1} />
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Synthetic Benchmarks & Hardware Specifications Grid */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                      Synthetic Benchmarks & Hardware Specifications
                    </span>
                    {isDualMode && deviceB && (
                      <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                        Side-by-Side Architectural Audit
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* AnTuTu v10 Total */}
                    <div className="p-4 bg-white dark:bg-[#170F26] rounded-xl border border-slate-200/80 dark:border-white/10 space-y-3 shadow-2xs hover:border-slate-300 dark:hover:border-white/20 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Cpu className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                          AnTuTu v10 Total
                        </span>
                        {isDualMode && deviceB && deviceA.antutu_v10_score && deviceB.antutu_v10_score && deviceA.antutu_v10_score !== deviceB.antutu_v10_score && (
                          <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
                            {deviceA.antutu_v10_score > deviceB.antutu_v10_score
                              ? `+${(deviceA.antutu_v10_score - deviceB.antutu_v10_score).toLocaleString()} pts`
                              : `+${(deviceB.antutu_v10_score - deviceA.antutu_v10_score).toLocaleString()} pts`}
                          </span>
                        )}
                      </div>

                      {isDualMode && deviceB ? (
                        <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100 dark:border-white/5">
                          <div className="border-r border-slate-100 dark:border-white/5 pr-2">
                            <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate mb-1">
                              {deviceA.device_name}
                            </span>
                            <span className="text-base sm:text-lg font-bold font-mono text-slate-900 dark:text-white tabular-nums block">
                              {deviceA.antutu_v10_score ? deviceA.antutu_v10_score.toLocaleString() : 'N/A'}
                            </span>
                          </div>
                          <div className="pl-1">
                            <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate mb-1">
                              {deviceB.device_name}
                            </span>
                            <span className="text-base sm:text-lg font-bold font-mono text-slate-900 dark:text-white tabular-nums block">
                              {deviceB.antutu_v10_score ? deviceB.antutu_v10_score.toLocaleString() : 'N/A'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="pt-1">
                          <span className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums block">
                            {deviceA.antutu_v10_score ? deviceA.antutu_v10_score.toLocaleString() : 'N/A'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Geekbench 6 Multi */}
                    <div className="p-4 bg-white dark:bg-[#170F26] rounded-xl border border-slate-200/80 dark:border-white/10 space-y-3 shadow-2xs hover:border-slate-300 dark:hover:border-white/20 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                          Geekbench 6 Multi
                        </span>
                        {isDualMode && deviceB && deviceA.geekbench_6_multi && deviceB.geekbench_6_multi && deviceA.geekbench_6_multi !== deviceB.geekbench_6_multi && (
                          <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
                            {deviceA.geekbench_6_multi > deviceB.geekbench_6_multi
                              ? `+${(deviceA.geekbench_6_multi - deviceB.geekbench_6_multi).toLocaleString()}`
                              : `+${(deviceB.geekbench_6_multi - deviceA.geekbench_6_multi).toLocaleString()}`}
                          </span>
                        )}
                      </div>

                      {isDualMode && deviceB ? (
                        <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100 dark:border-white/5">
                          <div className="border-r border-slate-100 dark:border-white/5 pr-2">
                            <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate mb-1">
                              {deviceA.device_name}
                            </span>
                            <span className="text-base sm:text-lg font-bold font-mono text-slate-900 dark:text-white tabular-nums block">
                              {deviceA.geekbench_6_multi ? deviceA.geekbench_6_multi.toLocaleString() : 'N/A'}
                            </span>
                          </div>
                          <div className="pl-1">
                            <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate mb-1">
                              {deviceB.device_name}
                            </span>
                            <span className="text-base sm:text-lg font-bold font-mono text-slate-900 dark:text-white tabular-nums block">
                              {deviceB.geekbench_6_multi ? deviceB.geekbench_6_multi.toLocaleString() : 'N/A'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="pt-1">
                          <span className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums block">
                            {deviceA.geekbench_6_multi ? deviceA.geekbench_6_multi.toLocaleString() : 'N/A'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Storage Standard */}
                    <div className="p-4 bg-white dark:bg-[#170F26] rounded-xl border border-slate-200/80 dark:border-white/10 space-y-3 shadow-2xs hover:border-slate-300 dark:hover:border-white/20 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <HardDrive className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                          Storage Standard
                        </span>
                      </div>

                      {isDualMode && deviceB ? (
                        <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100 dark:border-white/5">
                          <div className="border-r border-slate-100 dark:border-white/5 pr-2">
                            <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate mb-1">
                              {deviceA.device_name}
                            </span>
                            <span className="text-xs sm:text-sm font-bold font-mono text-slate-900 dark:text-white truncate block">
                              {deviceA.storage_tier || 'UFS 4.0'}
                            </span>
                          </div>
                          <div className="pl-1">
                            <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate mb-1">
                              {deviceB.device_name}
                            </span>
                            <span className="text-xs sm:text-sm font-bold font-mono text-slate-900 dark:text-white truncate block">
                              {deviceB.storage_tier || 'UFS 4.0'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="pt-1">
                          <span className="text-base font-bold font-mono text-slate-900 dark:text-white truncate block">
                            {deviceA.storage_tier || 'UFS 4.0'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* PWM Dimming */}
                    <div className="p-4 bg-white dark:bg-[#170F26] rounded-xl border border-slate-200/80 dark:border-white/10 space-y-3 shadow-2xs hover:border-slate-300 dark:hover:border-white/20 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                          PWM Dimming (Eye Safety)
                        </span>
                      </div>

                      {isDualMode && deviceB ? (
                        <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100 dark:border-white/5">
                          <div className="border-r border-slate-100 dark:border-white/5 pr-2">
                            <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate mb-1">
                              {deviceA.device_name}
                            </span>
                            <span className="text-xs sm:text-sm font-bold font-mono text-slate-900 dark:text-white truncate block" title={deviceA.pwm_dimming_hz}>
                              {deviceA.pwm_dimming_hz || 'Standard'}
                            </span>
                          </div>
                          <div className="pl-1">
                            <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate mb-1">
                              {deviceB.device_name}
                            </span>
                            <span className="text-xs sm:text-sm font-bold font-mono text-slate-900 dark:text-white truncate block" title={deviceB.pwm_dimming_hz}>
                              {deviceB.pwm_dimming_hz || 'Standard'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="pt-1">
                          <span className="text-base font-bold font-mono text-slate-900 dark:text-white truncate block">
                            {deviceA.pwm_dimming_hz || 'Standard'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

