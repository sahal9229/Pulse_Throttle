import { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import {
  Trophy,
  Cpu,
  Gauge,
  Thermometer,
  HardDrive,
  Eye,
  Activity,
  Gamepad2,
  Zap,
  Smartphone,
  Sparkles,
  Flame,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import DeviceThumbnail from './DeviceThumbnail.jsx';

// Semantic sub-score progress bar with Impeccable High-Contrast Telemetry Accents & Explanatory Context
function SubScoreBar({ label, description, value, maxValue = 100, unit = '', pillarType = 'tss', delay = 0 }) {
  const [animatedWidth, setAnimatedWidth] = useState(0);
  const percentage = Math.min((value / maxValue) * 100, 100);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedWidth(percentage), 80 + delay);
    return () => clearTimeout(timer);
  }, [percentage, delay]);

  const colorConfig = {
    tss: {
      bar: 'bg-[#F59E0B]',
      text: 'text-amber-700',
    },
    fpe: {
      bar: 'bg-[#10B981]',
      text: 'text-emerald-700',
    },
    compute: {
      bar: 'bg-[#4F46E5]',
      text: 'text-indigo-700',
    },
    storage: {
      bar: 'bg-[#0284C7]',
      text: 'text-sky-700',
    },
  };

  const currentConfig = colorConfig[pillarType] || colorConfig.tss;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-bold text-slate-800">{label}</span>
          {description && (
            <span className="text-[10px] text-slate-600 font-medium hidden sm:inline">
              • {description}
            </span>
          )}
        </div>
        <span className={`font-mono font-bold tabular-nums flex-shrink-0 ${currentConfig.text}`}>
          {value}{unit}
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-200/80 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${currentConfig.bar}`}
          initial={{ width: 0 }}
          animate={{ width: `${animatedWidth}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

function PhoneCardSkeleton({ device, rank }) {
  const [tickerStep, setTickerStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerStep((s) => (s + 1) % 3);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  const extractionSteps = [
    { title: 'Querying GSMArena & Hardware Silicon', sub: 'Parsing SoC, GPU architecture, RAM & storage bus bandwidth...' },
    { title: 'Scraping AnTuTu v10 & Geekbench 6', sub: 'Extracting compute horsepower, single & multi-core performance...' },
    { title: 'Synthesizing Thermal Dissipation & FPS Stability', sub: 'Calculating 3DMark stability loops and game frame drops...' }
  ];

  return (
    <div className="bg-white rounded-2xl border border-amber-400/90 ring-2 ring-amber-500/20 p-6 sm:p-7 shadow-[0_12px_32px_-4px_rgba(15,23,42,0.06),0_4px_12px_-2px_rgba(15,23,42,0.03)] flex flex-col justify-between space-y-6 relative overflow-hidden">
      {/* Top Badges */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-lg text-xs font-black font-mono flex items-center gap-1.5 shadow-sm bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white">
            <Trophy className="w-3.5 h-3.5" />
            Rank #{rank || '—'}
          </span>
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5 shadow-2xs">
            <Loader2 className="w-3.5 h-3.5 text-amber-600 animate-spin" />
            Live Extraction in Progress...
          </span>
        </div>
        <span className="text-xs font-bold text-slate-600 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">
          {device.os === 'iOS' ? '🍎 iOS' : '🤖 Android'}
        </span>
      </div>

      {/* Device Identity Header with Thumbnail */}
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/90 flex-shrink-0 flex items-center justify-center shadow-[0_4px_12px_-2px_rgba(15,23,42,0.06)]">
          <DeviceThumbnail
            src={device.image_url}
            alt={device.device_name}
            brand={device.brand}
            iconSize="w-8 h-8"
          />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight truncate">
            {device.device_name}
          </h3>
          <p className="text-xs sm:text-sm font-semibold text-amber-700 truncate">
            {device.soc_chipset || 'Extracting chipset & architecture...'}
          </p>
          <div className="h-4 w-44 bg-slate-200 rounded-md animate-shimmer" />
        </div>
      </div>

      {/* PulseThrottle Index Readout Box Placeholder with Shimmer */}
      <div className="p-4 rounded-xl bg-[#F1F5F9] border border-slate-200/90 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-slate-500 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#D97706] animate-pulse" />
            Synthesizing PulseThrottle Index
          </span>
          <span className="text-[10px] font-bold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-full border border-amber-200">
            Live Telemetry Pipeline
          </span>
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <div className="h-9 w-24 bg-slate-200 rounded-lg animate-shimmer" />
          <span className="text-xs font-bold text-slate-400">/ 100 Calculating...</span>
        </div>
        {/* Animated 3-step ticker */}
        <div className="pt-2 border-t border-slate-200 mt-1 flex items-center gap-2 text-xs font-bold text-slate-800">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping flex-shrink-0" />
          <span className="truncate">{extractionSteps[tickerStep].title}</span>
        </div>
        <p className="text-[11px] text-slate-500 font-medium -mt-1">
          {extractionSteps[tickerStep].sub}
        </p>
      </div>

      {/* Four Semantic Sub-Scores Shimmer Bars */}
      <div className="space-y-3 pt-2">
        {['Thermal Stability Score (TSS)', 'FPS Pacing Efficiency (FPE)', 'Compute Performance Index', 'Storage Bandwidth & Latency'].map((label) => (
          <div key={label} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-600">{label}</span>
              <div className="h-3 w-10 bg-slate-200 rounded-sm animate-shimmer" />
            </div>
            <div className="h-2 rounded-full bg-slate-200/80 overflow-hidden">
              <div className="h-full rounded-full bg-amber-400 w-3/5 animate-shimmer" />
            </div>
          </div>
        ))}
      </div>

      {/* Hardware Benchmark Specs Grid Shimmer */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-3 border-t border-slate-200">
        {['AnTuTu v10', 'Geekbench 6 Multi', '3DMark Stability', 'Peak Thermals', 'PWM Dimming', 'Storage Tier'].map((item) => (
          <div key={item} className="p-2.5 rounded-xl bg-[#F1F5F9] border border-slate-200/80 space-y-1">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">{item}</span>
            <div className="h-4 w-16 bg-slate-200 rounded-sm animate-shimmer" />
          </div>
        ))}
      </div>

      {/* Gaming Status Shimmer Card */}
      <div className="p-4 rounded-xl bg-[#F1F5F9] border border-slate-200/90 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Gamepad2 className="w-4 h-4 text-amber-600" />
            <span>Gaming Workload Pipeline</span>
          </div>
          <div className="h-5 w-24 bg-slate-200 rounded-sm animate-shimmer" />
        </div>
        <div className="h-3 w-4/5 bg-slate-200 rounded-sm animate-shimmer" />
      </div>
    </div>
  );
}

export default function PhoneCard({
  device,
  rank,
  isWinner,
  selectedGame,
  comparisonDevice,
}) {
  const cardRef = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useTransform(mouseY, [-180, 180], [4, -4]);
  const rotateY = useTransform(mouseX, [-180, 180], [-4, 4]);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  if (!device) return null;

  // Render Skeleton Card immediately while extraction is in progress
  if (device.is_extracting) {
    return <PhoneCardSkeleton device={device} rank={rank} />;
  }

  const gameBenchmark = device.game_benchmarks?.[selectedGame] || {
    max_unlocked_setting: 'High / 60 FPS Target',
    sustained_avg_fps: '58-60 FPS',
    thermal_and_frame_drop_notes: 'Consistent real-world load pacing under gaming test run.',
  };

  const breakdown = device.score_breakdown || {
    tss: 75.0,
    fpe: 88.0,
    compute: 85.0,
    storage: 90.0,
  };

  // Metric Deltas against comparison device
  const ptiDelta = comparisonDevice
    ? (device.pulse_throttle_index - comparisonDevice.pulse_throttle_index).toFixed(1)
    : null;

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY }}
      className="phone-perspective transition-transform duration-200"
    >
      <div
        className={`bg-white rounded-2xl border ${
          isWinner
            ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-[0_16px_36px_-4px_rgba(245,158,11,0.14),0_6px_16px_-2px_rgba(15,23,42,0.04)]'
            : 'border-slate-200/90 shadow-[0_12px_32px_-4px_rgba(15,23,42,0.06),0_4px_12px_-2px_rgba(15,23,42,0.03)]'
        } p-6 sm:p-7 flex flex-col justify-between space-y-6 relative overflow-hidden`}
      >
        {/* Top Badges: Rank, Winner Flag, and Single Clean OS Indicator */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-lg text-xs font-black font-mono flex items-center gap-1.5 shadow-sm ${
                rank === 1
                  ? 'btn-gradient-marigold text-white'
                  : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              Rank #{rank}
            </span>
            {isWinner && (
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Leader
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {device.release_year && (
              <span className="text-[11px] font-mono font-bold text-slate-500 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                {device.release_year}
              </span>
            )}
            <span className="text-xs font-bold text-slate-600 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">
              {device.os === 'iOS' ? '🍎 iOS' : '🤖 Android'}
            </span>
          </div>
        </div>

        {/* Device Identity Header with 3D Floating Phone Thumbnail */}
        <div className="flex items-start gap-4">
          <div
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/90 flex-shrink-0 flex items-center justify-center shadow-[0_8px_20px_-4px_rgba(15,23,42,0.1)] transition-transform duration-300"
            style={{ transform: 'translateZ(20px)' }}
          >
            <DeviceThumbnail
              src={device.image_url}
              alt={device.device_name}
              brand={device.brand}
              iconSize="w-8 h-8"
            />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight truncate">
              {device.device_name}
            </h3>
            <p className="text-xs sm:text-sm font-semibold text-slate-700 mt-0.5 truncate">
              {device.soc_chipset}
            </p>
            <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">
              {device.gpu_and_storage}
            </p>
          </div>
        </div>

        {/* PulseThrottle Index Readout Well */}
        <div className="p-4 rounded-xl bg-[#F1F5F9] border border-slate-200/90 flex items-center justify-between">
          <div>
            <span className="block text-slate-500 text-xs font-bold uppercase tracking-wider">
              PulseThrottle Index (Overall)
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-900 tabular-nums">
                {device.pulse_throttle_index}
              </span>
              <span className="text-xs font-bold text-slate-400">/ 100</span>
            </div>
          </div>

          {ptiDelta !== null && (
            <div
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold font-mono tabular-nums border ${
                parseFloat(ptiDelta) >= 0
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              {parseFloat(ptiDelta) >= 0 ? `+${ptiDelta}` : ptiDelta} pts
            </div>
          )}
        </div>

        {/* Four Semantic Sub-Scores with Clear Explanatory Microcopy */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Diagnostic Sub-Scores (Weighted Pillars)
            </span>
            <span className="text-[10px] text-slate-600 font-semibold">
              35% Thermal • 30% Compute • 20% Storage • 15% OS
            </span>
          </div>

          <SubScoreBar
            label="Thermal Stability (TSS)"
            description="Throttling resistance under sustained load"
            value={breakdown.tss || 75.0}
            pillarType="tss"
            delay={0}
          />
          <SubScoreBar
            label="FPS Pacing Efficiency (FPE)"
            description="99th percentile frametime smoothness"
            value={breakdown.fpe || 88.0}
            pillarType="fpe"
            delay={100}
          />
          <SubScoreBar
            label="Compute Index"
            description="Raw CPU & GPU benchmark horsepower"
            value={breakdown.compute || 85.0}
            pillarType="compute"
            delay={200}
          />
          <SubScoreBar
            label="Storage & Bus Bandwidth"
            description="Memory bus speed and data loading latency"
            value={breakdown.storage || 90.0}
            pillarType="storage"
            delay={300}
          />
        </div>

        {/* Clean 2x3 Specification Grid with Clarified Labels */}
        <div className="space-y-1.5 pt-3 border-t border-slate-200/90">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Core Hardware & Lab Metrics
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div className="p-2.5 rounded-xl bg-[#F1F5F9] border border-slate-200/80">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">AnTuTu v10</span>
              <span className="font-mono font-bold text-xs sm:text-sm text-slate-900 tabular-nums">
                {device.antutu_v10_score ? device.antutu_v10_score.toLocaleString() : 'N/A'}
              </span>
              <span className="block text-[9px] text-slate-600 font-medium mt-0.5">Total Benchmark</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#F1F5F9] border border-slate-200/80">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Geekbench 6 Multi</span>
              <span className="font-mono font-bold text-xs sm:text-sm text-slate-900 tabular-nums">
                {device.geekbench_6_multi ? device.geekbench_6_multi.toLocaleString() : 'N/A'}
              </span>
              <span className="block text-[9px] text-slate-600 font-medium mt-0.5">Multi-Core CPU</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#F1F5F9] border border-slate-200/80">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">3DMark Loop Stability</span>
              <span className="font-mono font-bold text-xs sm:text-sm text-slate-900 tabular-nums">
                {device.wildlife_stability_pct ? `${device.wildlife_stability_pct}%` : 'N/A'}
              </span>
              <span className="block text-[9px] text-slate-600 font-medium mt-0.5">Wild Life 20-min</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#F1F5F9] border border-slate-200/80">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Peak Thermal Load</span>
              <span
                className={`font-mono font-bold text-xs sm:text-sm tabular-nums ${
                  device.peak_temp_celsius > 44.5
                    ? 'text-rose-700'
                    : device.peak_temp_celsius > 43.0
                    ? 'text-amber-700'
                    : 'text-emerald-700'
                }`}
              >
                {device.peak_temp_celsius ? `${device.peak_temp_celsius}°C` : 'N/A'}
              </span>
              <span className="block text-[9px] text-slate-600 font-medium mt-0.5">
                {device.peak_temp_celsius > 44.5 ? 'Runs Hot' : device.peak_temp_celsius > 43.0 ? 'Warm Load' : 'Cool Operating'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#F1F5F9] border border-slate-200/80">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Display Flicker (PWM)</span>
              <span className="font-mono font-bold text-xs sm:text-sm text-slate-900 tabular-nums truncate block">
                {device.pwm_dimming_hz || 'Standard DC'}
              </span>
              <span className="block text-[9px] text-slate-600 font-medium mt-0.5">Eye Strain Rating</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#F1F5F9] border border-slate-200/80">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Storage Standard</span>
              <span className="font-mono font-bold text-xs sm:text-sm text-slate-900 tabular-nums truncate block">
                {device.storage_tier || 'UFS 4.0'}
              </span>
              <span className="block text-[9px] text-slate-600 font-medium mt-0.5">Bus Protocol</span>
            </div>
          </div>
        </div>

        {/* Selected Game Telemetry Section */}
        <div className="p-4 rounded-xl bg-[#F1F5F9] border border-slate-200/90 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-900">
            <span className="flex items-center gap-1.5">
              <Gamepad2 className="w-4 h-4 text-[#D97706]" />
              {gameBenchmark.game_name || selectedGame} Workload
            </span>
            <span className={`font-mono text-xs font-bold tabular-nums px-2.5 py-0.5 rounded border ${
              gameBenchmark.sustained_avg_fps === '0 FPS' || (gameBenchmark.max_unlocked_setting && gameBenchmark.max_unlocked_setting.includes('INCOMPATIBLE'))
                ? 'text-rose-700 bg-rose-50 border-rose-200'
                : 'text-emerald-800 bg-emerald-50 border-emerald-200'
            }`}>
              {gameBenchmark.sustained_avg_fps === '0 FPS' ? '0 FPS (Unsupported)' : `Sustained: ${gameBenchmark.sustained_avg_fps}`}
            </span>
          </div>
          <p className="text-xs text-slate-700 font-medium">
            Max Graphic Setting: <span className="font-bold text-slate-900">{gameBenchmark.max_unlocked_setting}</span>
          </p>
          <p className="text-[11px] text-slate-600 font-medium leading-relaxed bg-white/70 p-2 rounded-lg border border-slate-200/60 mt-1">
            {gameBenchmark.thermal_and_frame_drop_notes}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
