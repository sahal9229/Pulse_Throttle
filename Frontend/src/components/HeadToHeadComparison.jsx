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
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_4px_24px_-4px_rgba(15,23,42,0.04)] overflow-hidden transition-all">
      {/* 1. TOP HEADER: Clean Device A vs Device B Matchup with Prominent Scores */}
      <div className="p-6 sm:p-8 lg:p-10 border-b border-slate-100 bg-white">
        {isDualMode && deviceB ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Device A Identity & Score */}
            <div className="lg:col-span-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/90 flex-shrink-0 flex items-center justify-center p-1 shadow-2xs">
                  <DeviceThumbnail
                    src={deviceA.image_url}
                    alt={deviceA.device_name}
                    brand={deviceA.brand}
                    iconSize="w-6 h-6"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
                      {deviceA.device_name}
                    </h3>
                    {winner === 'A' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white shadow-2xs">
                        Winner
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                    {deviceA.soc_chipset}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {deviceA.os || 'Mobile OS'} • {deviceA.release_year || 'Current'}
                  </p>
                </div>
              </div>

              <div className="text-right flex-shrink-0 pl-2">
                <span className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-900 tracking-tight tabular-nums">
                  {scoreA.toFixed(1)}
                </span>
                <span className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  PTI Score
                </span>
              </div>
            </div>

            {/* Matchup Center Delta Badge */}
            <div className="lg:col-span-2 flex flex-col items-center justify-center py-2 lg:py-0 border-y lg:border-y-0 lg:border-x border-slate-100">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-700 font-mono text-xs font-bold shadow-2xs">
                <span>+{scoreDelta}</span>
                <span className="text-[10px] uppercase font-sans font-semibold text-amber-800">
                  Advantage
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium mt-1">
                {winner === 'A' ? deviceA.device_name : deviceB.device_name} leads
              </span>
            </div>

            {/* Device B Identity & Score */}
            <div className="lg:col-span-5 flex items-center justify-between gap-4">
              <div className="text-left lg:text-left flex-shrink-0 pr-2 order-2 lg:order-1">
                <span className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-900 tracking-tight tabular-nums">
                  {scoreB.toFixed(1)}
                </span>
                <span className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider">
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
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
                      {deviceB.device_name}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                    {deviceB.soc_chipset}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {deviceB.os || 'Mobile OS'} • {deviceB.release_year || 'Current'}
                  </p>
                </div>
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/90 flex-shrink-0 flex items-center justify-center p-1 shadow-2xs">
                  <DeviceThumbnail
                    src={deviceB.image_url}
                    alt={deviceB.device_name}
                    brand={deviceB.brand}
                    iconSize="w-6 h-6"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Single Device Header */
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/90 flex-shrink-0 flex items-center justify-center p-1">
                <DeviceThumbnail
                  src={deviceA.image_url}
                  alt={deviceA.device_name}
                  brand={deviceA.brand}
                  iconSize="w-7 h-7"
                />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {deviceA.device_name}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {deviceA.soc_chipset} • {deviceA.gpu_and_storage}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-4xl font-extrabold font-mono text-slate-900 tabular-nums">
                  {scoreA.toFixed(1)}
                </span>
                <span className="text-xs text-slate-400 font-mono ml-1">/ 100</span>
                <span className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                  PulseThrottle Index
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. MIDDLE: KEY HERO METRICS (3-Column Comparative Summary) */}
      <div className="p-6 sm:p-8 lg:p-10 bg-slate-50/50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Hero 1: Sustained Gaming FPS */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <Gamepad2 className="w-4 h-4 text-slate-400" />
                Sustained FPS ({selectedGame})
              </span>
              {isDualMode && deviceB && (
                <span className="text-[11px] font-mono font-semibold text-slate-500">
                  {fpsA === fpsB ? 'Tied' : fpsA > fpsB ? `+${fpsA - fpsB} FPS` : `+${fpsB - fpsA} FPS`}
                </span>
              )}
            </div>

            {isDualMode && deviceB ? (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="border-r border-slate-100 pr-2">
                  <span className="block text-[10px] text-slate-400 font-medium truncate">
                    {deviceA.device_name}
                  </span>
                  <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">
                    {gameBenchA.sustained_avg_fps}
                  </span>
                </div>
                <div className="pl-1">
                  <span className="block text-[10px] text-slate-400 font-medium truncate">
                    {deviceB.device_name}
                  </span>
                  <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">
                    {gameBenchB.sustained_avg_fps}
                  </span>
                </div>
              </div>
            ) : (
              <div className="pt-1">
                <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                  {gameBenchA.sustained_avg_fps}
                </span>
                <span className="block text-xs text-slate-400 font-medium mt-0.5">
                  Max: {gameBenchA.max_unlocked_setting}
                </span>
              </div>
            )}

            <p className="text-[11px] text-slate-400 font-normal leading-relaxed truncate">
              {gameBenchA.thermal_and_frame_drop_notes || 'Consistent shader pacing curve.'}
            </p>
          </div>

          {/* Hero 2: Peak Thermals */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <Thermometer className="w-4 h-4 text-slate-400" />
                Peak Thermals
              </span>
              {isDualMode && deviceB && deviceA.peak_temp_celsius && deviceB.peak_temp_celsius && (
                <span className="text-[11px] font-mono font-semibold text-slate-500">
                  {Math.abs(deviceA.peak_temp_celsius - deviceB.peak_temp_celsius).toFixed(1)}°C delta
                </span>
              )}
            </div>

            {isDualMode && deviceB ? (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="border-r border-slate-100 pr-2">
                  <span className="block text-[10px] text-slate-400 font-medium truncate">
                    {deviceA.device_name}
                  </span>
                  <span
                    className={`text-xl font-bold font-mono tabular-nums ${
                      deviceA.peak_temp_celsius > 44.5 ? 'text-rose-600' : 'text-slate-900'
                    }`}
                  >
                    {deviceA.peak_temp_celsius ? `${deviceA.peak_temp_celsius}°C` : 'N/A'}
                  </span>
                </div>
                <div className="pl-1">
                  <span className="block text-[10px] text-slate-400 font-medium truncate">
                    {deviceB.device_name}
                  </span>
                  <span
                    className={`text-xl font-bold font-mono tabular-nums ${
                      deviceB.peak_temp_celsius > 44.5 ? 'text-rose-600' : 'text-slate-900'
                    }`}
                  >
                    {deviceB.peak_temp_celsius ? `${deviceB.peak_temp_celsius}°C` : 'N/A'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="pt-1">
                <span
                  className={`text-2xl font-bold font-mono tabular-nums ${
                    deviceA.peak_temp_celsius > 44.5 ? 'text-rose-600' : 'text-slate-900'
                  }`}
                >
                  {deviceA.peak_temp_celsius ? `${deviceA.peak_temp_celsius}°C` : 'N/A'}
                </span>
                <span className="block text-xs text-slate-400 font-medium mt-0.5">
                  {deviceA.peak_temp_celsius > 44.5 ? 'Heavy Heat Load' : 'Safe Operating Temperature'}
                </span>
              </div>
            )}

            <p className="text-[11px] text-slate-400 font-normal leading-relaxed">
              {deviceA.peak_temp_celsius > 44.5
                ? 'Approaches thermal throttling limits under load.'
                : 'Controlled heat dissipation curve.'}
            </p>
          </div>

          {/* Hero 3: 3DMark Loop Stability */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-slate-400" />
                3DMark Stability
              </span>
              {isDualMode && deviceB && deviceA.wildlife_stability_pct && deviceB.wildlife_stability_pct && (
                <span className="text-[11px] font-mono font-semibold text-slate-500">
                  {Math.abs(deviceA.wildlife_stability_pct - deviceB.wildlife_stability_pct).toFixed(1)}% delta
                </span>
              )}
            </div>

            {isDualMode && deviceB ? (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="border-r border-slate-100 pr-2">
                  <span className="block text-[10px] text-slate-400 font-medium truncate">
                    {deviceA.device_name}
                  </span>
                  <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">
                    {deviceA.wildlife_stability_pct ? `${deviceA.wildlife_stability_pct}%` : 'N/A'}
                  </span>
                </div>
                <div className="pl-1">
                  <span className="block text-[10px] text-slate-400 font-medium truncate">
                    {deviceB.device_name}
                  </span>
                  <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">
                    {deviceB.wildlife_stability_pct ? `${deviceB.wildlife_stability_pct}%` : 'N/A'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="pt-1">
                <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                  {deviceA.wildlife_stability_pct ? `${deviceA.wildlife_stability_pct}%` : 'N/A'}
                </span>
                <span className="block text-xs text-slate-400 font-medium mt-0.5">
                  20-Minute Wild Life Stress Loop
                </span>
              </div>
            )}

            <p className="text-[11px] text-slate-400 font-normal leading-relaxed">
              Sustained 3D rendering resilience against heat-induced throttling.
            </p>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM: PROGRESSIVE DISCLOSURE ACCORDION ("View Full Telemetry Breakdown") */}
      <div className="border-t border-slate-100 bg-white">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-6 sm:px-8 py-4 flex items-center justify-between text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50/80 transition-colors cursor-pointer select-none"
        >
          <span className="flex items-center gap-2">
            <span>{isExpanded ? 'Hide Detailed Telemetry & Benchmarks' : 'View Full Telemetry Breakdown'}</span>
            <span className="text-[11px] text-slate-400 font-normal">
              (Sub-Pillars, AnTuTu v10, Geekbench 6, Storage & PWM)
            </span>
          </span>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isExpanded ? 'rotate-180 text-slate-800' : ''
            }`}
          />
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
              <div className="p-6 sm:p-8 lg:p-10 space-y-8 border-t border-slate-100 bg-slate-50/30">
                {/* 4 Sub-Pillars Comparative Table */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <span>Core Architectural Pillars</span>
                    <span className="text-[11px] text-slate-400 font-normal normal-case">
                      Weighted: 35% Thermal • 30% Compute • 20% Storage • 15% OS
                    </span>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200/80 divide-y divide-slate-100 shadow-2xs">
                    {/* Pillar 1: TSS */}
                    <div className="p-4 grid grid-cols-12 gap-4 items-center text-xs">
                      <div className="col-span-4 sm:col-span-3 font-semibold text-slate-800">
                        Thermal Stability (TSS)
                      </div>
                      <div className="col-span-8 sm:col-span-9 flex items-center justify-between gap-4 font-mono font-bold tabular-nums">
                        <span className="text-slate-900 w-16">{bA.tss || 75.0}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden flex">
                          <div
                            className="h-full bg-slate-800 rounded-full"
                            style={{ width: `${Math.min(bA.tss || 75, 100)}%` }}
                          />
                        </div>
                        {isDualMode && deviceB && (
                          <>
                            <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden flex">
                              <div
                                className="h-full bg-slate-400 rounded-full"
                                style={{ width: `${Math.min(bB.tss || 75, 100)}%` }}
                              />
                            </div>
                            <span className="text-slate-500 w-16 text-right">{bB.tss || 75.0}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Pillar 2: FPE */}
                    <div className="p-4 grid grid-cols-12 gap-4 items-center text-xs">
                      <div className="col-span-4 sm:col-span-3 font-semibold text-slate-800">
                        FPS Pacing Efficiency (FPE)
                      </div>
                      <div className="col-span-8 sm:col-span-9 flex items-center justify-between gap-4 font-mono font-bold tabular-nums">
                        <span className="text-slate-900 w-16">{bA.fpe || 88.0}%</span>
                        <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden flex">
                          <div
                            className="h-full bg-slate-800 rounded-full"
                            style={{ width: `${Math.min(bA.fpe || 88, 100)}%` }}
                          />
                        </div>
                        {isDualMode && deviceB && (
                          <>
                            <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden flex">
                              <div
                                className="h-full bg-slate-400 rounded-full"
                                style={{ width: `${Math.min(bB.fpe || 88, 100)}%` }}
                              />
                            </div>
                            <span className="text-slate-500 w-16 text-right">{bB.fpe || 88.0}%</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Pillar 3: Compute */}
                    <div className="p-4 grid grid-cols-12 gap-4 items-center text-xs">
                      <div className="col-span-4 sm:col-span-3 font-semibold text-slate-800">
                        Compute Index
                      </div>
                      <div className="col-span-8 sm:col-span-9 flex items-center justify-between gap-4 font-mono font-bold tabular-nums">
                        <span className="text-slate-900 w-16">{bA.compute || 85.0}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden flex">
                          <div
                            className="h-full bg-slate-800 rounded-full"
                            style={{ width: `${Math.min(bA.compute || 85, 100)}%` }}
                          />
                        </div>
                        {isDualMode && deviceB && (
                          <>
                            <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden flex">
                              <div
                                className="h-full bg-slate-400 rounded-full"
                                style={{ width: `${Math.min(bB.compute || 85, 100)}%` }}
                              />
                            </div>
                            <span className="text-slate-500 w-16 text-right">{bB.compute || 85.0}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Pillar 4: Storage */}
                    <div className="p-4 grid grid-cols-12 gap-4 items-center text-xs">
                      <div className="col-span-4 sm:col-span-3 font-semibold text-slate-800">
                        Storage & Bus Bandwidth
                      </div>
                      <div className="col-span-8 sm:col-span-9 flex items-center justify-between gap-4 font-mono font-bold tabular-nums">
                        <span className="text-slate-900 w-16">{bA.storage || 90.0}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden flex">
                          <div
                            className="h-full bg-slate-800 rounded-full"
                            style={{ width: `${Math.min(bA.storage || 90, 100)}%` }}
                          />
                        </div>
                        {isDualMode && deviceB && (
                          <>
                            <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden flex">
                              <div
                                className="h-full bg-slate-400 rounded-full"
                                style={{ width: `${Math.min(bB.storage || 90, 100)}%` }}
                              />
                            </div>
                            <span className="text-slate-500 w-16 text-right">{bB.storage || 90.0}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Synthetic Benchmarks & Hardware Specifications Grid */}
                <div className="space-y-4">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Synthetic Benchmarks & Hardware Specifications
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {/* AnTuTu v10 */}
                    <div className="p-4 bg-white rounded-xl border border-slate-200/80 space-y-1 shadow-2xs">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                        AnTuTu v10 Total
                      </span>
                      <div className="font-mono font-bold text-sm text-slate-900 tabular-nums">
                        {deviceA.antutu_v10_score ? deviceA.antutu_v10_score.toLocaleString() : 'N/A'}
                      </div>
                      {isDualMode && deviceB && (
                        <div className="text-[11px] font-mono text-slate-400 tabular-nums pt-0.5">
                          vs {deviceB.antutu_v10_score ? deviceB.antutu_v10_score.toLocaleString() : 'N/A'}
                        </div>
                      )}
                    </div>

                    {/* Geekbench 6 Multi */}
                    <div className="p-4 bg-white rounded-xl border border-slate-200/80 space-y-1 shadow-2xs">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Geekbench 6 Multi
                      </span>
                      <div className="font-mono font-bold text-sm text-slate-900 tabular-nums">
                        {deviceA.geekbench_6_multi ? deviceA.geekbench_6_multi.toLocaleString() : 'N/A'}
                      </div>
                      {isDualMode && deviceB && (
                        <div className="text-[11px] font-mono text-slate-400 tabular-nums pt-0.5">
                          vs {deviceB.geekbench_6_multi ? deviceB.geekbench_6_multi.toLocaleString() : 'N/A'}
                        </div>
                      )}
                    </div>

                    {/* Storage Tier */}
                    <div className="p-4 bg-white rounded-xl border border-slate-200/80 space-y-1 shadow-2xs">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Storage Standard
                      </span>
                      <div className="font-mono font-bold text-sm text-slate-900 truncate">
                        {deviceA.storage_tier || 'UFS 4.0'}
                      </div>
                      {isDualMode && deviceB && (
                        <div className="text-[11px] font-mono text-slate-400 truncate pt-0.5">
                          vs {deviceB.storage_tier || 'UFS 4.0'}
                        </div>
                      )}
                    </div>

                    {/* PWM Dimming */}
                    <div className="p-4 bg-white rounded-xl border border-slate-200/80 space-y-1 shadow-2xs">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                        PWM Dimming (Eye Safety)
                      </span>
                      <div className="font-mono font-bold text-sm text-slate-900 truncate">
                        {deviceA.pwm_dimming_hz || 'Standard'}
                      </div>
                      {isDualMode && deviceB && (
                        <div className="text-[11px] font-mono text-slate-400 truncate pt-0.5">
                          vs {deviceB.pwm_dimming_hz || 'Standard'}
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
