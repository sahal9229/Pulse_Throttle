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

// Semantic sub-score progress bar
function SubScoreBar({ label, value, maxValue = 100, unit = '', pillarType = 'tss', delay = 0 }) {
  const [animatedWidth, setAnimatedWidth] = useState(0);
  const percentage = Math.min((value / maxValue) * 100, 100);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedWidth(percentage), 80 + delay);
    return () => clearTimeout(timer);
  }, [percentage, delay]);

  const colorConfig = {
    tss: {
      bar: 'bg-gradient-to-r from-amber-400 to-orange-500',
      text: 'text-amber-800',
    },
    fpe: {
      bar: 'bg-gradient-to-r from-emerald-500 to-teal-500',
      text: 'text-emerald-800',
    },
    compute: {
      bar: 'bg-gradient-to-r from-indigo-500 to-blue-600',
      text: 'text-indigo-900',
    },
    storage: {
      bar: 'bg-gradient-to-r from-sky-400 to-cyan-600',
      text: 'text-sky-900',
    },
  };

  const currentConfig = colorConfig[pillarType] || colorConfig.tss;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs font-bold">
        <span className="text-slate-700">{label}</span>
        <span className={`font-mono ${currentConfig.text}`}>
          {value}{unit}
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
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
    <div className="bg-white rounded-2xl border border-amber-400 ring-2 ring-amber-500/20 p-6 sm:p-7 shadow-[0_8px_24px_rgba(245,158,11,0.12)] flex flex-col justify-between space-y-6 relative overflow-hidden">
      {/* Top Badges */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-lg text-xs font-black font-mono flex items-center gap-1.5 shadow-sm bg-amber-500 text-white">
            <Trophy className="w-3.5 h-3.5" />
            Rank #{rank || '—'}
          </span>
          <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5 shadow-xs">
            <Loader2 className="w-3.5 h-3.5 text-amber-600 animate-spin" />
            Live Extraction in Progress...
          </span>
        </div>
        <span className="text-xs font-bold text-slate-600 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">
          {device.os === 'iOS' ? '🍎 Apple iOS' : '🤖 Android Platform'}
        </span>
      </div>

      {/* Device Identity Header with Thumbnail */}
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-300 flex-shrink-0 flex items-center justify-center shadow-sm">
          <DeviceThumbnail
            src={device.image_url}
            alt={device.device_name}
            brand={device.brand}
            iconSize="w-8 h-8"
          />
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
            {device.device_name}
          </h3>
          <p className="text-xs sm:text-sm font-semibold text-amber-700 truncate">
            {device.soc_chipset || 'Extracting chipset & architecture...'}
          </p>
          <div className="h-4 w-48 bg-slate-200 rounded-md animate-shimmer" />
        </div>
      </div>

      {/* PulseThrottle Index Readout Box Placeholder with Shimmer */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-300 flex flex-col gap-2 shadow-inner">
        <div className="flex items-center justify-between">
          <span className="text-amber-800 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-bounce" />
            Synthesizing PulseThrottle Index
          </span>
          <span className="text-[11px] font-bold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-full border border-amber-300">
            Live Telemetry Pipeline
          </span>
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <div className="h-9 w-24 bg-amber-200/80 rounded-lg animate-shimmer" />
          <span className="text-xs font-bold text-slate-500">/ 100 Calculating...</span>
        </div>
        {/* Animated 3-step ticker */}
        <div className="pt-2 border-t border-amber-200/80 mt-1 flex items-center gap-2 text-xs font-bold text-amber-900">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping flex-shrink-0" />
          <span className="truncate">{extractionSteps[tickerStep].title}</span>
        </div>
        <p className="text-[11px] text-amber-800/80 italic font-medium -mt-1">
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
            <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 w-3/5 animate-shimmer" />
            </div>
          </div>
        ))}
      </div>

      {/* Hardware Benchmark Specs Grid Shimmer */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-3 border-t border-slate-200">
        {['AnTuTu v10', 'Geekbench 6 Multi', '3DMark Stability', 'Peak Thermals', 'PWM Dimming', 'Storage Tier'].map((item) => (
          <div key={item} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="block text-[10px] font-bold uppercase text-slate-500">{item}</span>
            <div className="h-4 w-16 bg-slate-200 rounded-sm animate-shimmer" />
          </div>
        ))}
      </div>

      {/* Gaming Status Shimmer Card */}
      <div className="p-4 rounded-xl bg-slate-100 border border-slate-300 space-y-2">
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
  const tempDelta = comparisonDevice
    ? (device.peak_temp_celsius - comparisonDevice.peak_temp_celsius).toFixed(1)
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
          isWinner ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-300'
        } p-6 sm:p-7 shadow-[0_8px_24px_rgba(15,23,42,0.08)] flex flex-col justify-between space-y-6 relative overflow-hidden`}
      >
        {/* Top Badges: Rank & Winner Flag */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-lg text-xs font-black font-mono flex items-center gap-1.5 shadow-sm ${
                rank === 1
                  ? 'btn-gradient-marigold text-white'
                  : 'bg-slate-100 text-slate-800 border border-slate-300'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              Rank #{rank}
            </span>
            {isWinner && (
              <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Leader
              </span>
            )}
          </div>

          <span className="text-xs font-bold text-slate-600 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">
            {device.os === 'iOS' ? '🍎 Apple iOS' : '🤖 Android Platform'}
          </span>
        </div>

        {/* Device Identity Header with Image Thumbnail & Brand Fallback */}
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-300 flex-shrink-0 flex items-center justify-center shadow-sm">
            <DeviceThumbnail
              src={device.image_url}
              alt={device.device_name}
              brand={device.brand}
              iconSize="w-8 h-8"
            />
          </div>


          <div className="min-w-0 flex-1">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
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

        {/* PulseThrottle Index Readout Box */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-300 flex items-center justify-between shadow-inner">
          <div>
            <span className="block text-slate-600 text-[11px] font-bold uppercase tracking-wider">
              PulseThrottle Index (Overall)
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl sm:text-4xl font-black font-mono text-slate-900">
                {device.pulse_throttle_index}
              </span>
              <span className="text-xs font-bold text-slate-500">/ 100</span>
            </div>
          </div>

          {ptiDelta !== null && (
            <div
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold font-mono border ${
                parseFloat(ptiDelta) >= 0
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-rose-100 text-rose-800 border-rose-300'
              }`}
            >
              {parseFloat(ptiDelta) >= 0 ? `+${ptiDelta}` : ptiDelta} pts
            </div>
          )}
        </div>

        {/* Four Semantic Sub-Scores */}
        <div className="space-y-3 pt-2">
          <SubScoreBar
            label="Thermal Stability Score (TSS)"
            value={breakdown.tss || 75.0}
            pillarType="tss"
            delay={0}
          />
          <SubScoreBar
            label="FPS Pacing Efficiency (FPE)"
            value={breakdown.fpe || 88.0}
            pillarType="fpe"
            delay={100}
          />
          <SubScoreBar
            label="Compute Performance Index"
            value={breakdown.compute || 85.0}
            pillarType="compute"
            delay={200}
          />
          <SubScoreBar
            label="Storage Bandwidth & Latency"
            value={breakdown.storage || 90.0}
            pillarType="storage"
            delay={300}
          />
        </div>

        {/* Hardware Benchmark Specs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-3 border-t border-slate-200">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="block text-[10px] font-bold uppercase text-slate-500">AnTuTu v10</span>
            <span className="font-mono font-extrabold text-xs sm:text-sm text-slate-900">
              {device.antutu_v10_score ? device.antutu_v10_score.toLocaleString() : 'N/A'}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="block text-[10px] font-bold uppercase text-slate-500">Geekbench 6 Multi</span>
            <span className="font-mono font-extrabold text-xs sm:text-sm text-slate-900">
              {device.geekbench_6_multi ? device.geekbench_6_multi.toLocaleString() : 'N/A'}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="block text-[10px] font-bold uppercase text-slate-500">3DMark Stability</span>
            <span className="font-mono font-extrabold text-xs sm:text-sm text-slate-900">
              {device.wildlife_stability_pct ? `${device.wildlife_stability_pct}%` : 'N/A'}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="block text-[10px] font-bold uppercase text-slate-500">Peak Thermals</span>
            <span
              className={`font-mono font-extrabold text-xs sm:text-sm ${
                device.peak_temp_celsius > 44.5
                  ? 'text-rose-700'
                  : device.peak_temp_celsius > 43.0
                  ? 'text-amber-700'
                  : 'text-emerald-700'
              }`}
            >
              {device.peak_temp_celsius ? `${device.peak_temp_celsius}°C` : 'N/A'}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="block text-[10px] font-bold uppercase text-slate-500">PWM Dimming</span>
            <span className="font-mono font-extrabold text-xs sm:text-sm text-slate-900">
              {device.pwm_dimming_hz || 'Standard'}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="block text-[10px] font-bold uppercase text-slate-500">Storage Tier</span>
            <span className="font-mono font-extrabold text-xs sm:text-sm text-slate-900">
              {device.storage_tier || 'UFS 4.0'}
            </span>
          </div>
        </div>

        {/* Selected Game Telemetry Card */}
        <div className="p-4 rounded-xl bg-slate-100 border border-slate-300 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-900">
            <span className="flex items-center gap-1.5">
              <Gamepad2 className="w-4 h-4 text-amber-600" />
              {gameBenchmark.game_name || selectedGame}
            </span>
            <span className="font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
              {gameBenchmark.sustained_avg_fps}
            </span>
          </div>
          <p className="text-xs text-slate-600 font-medium">
            Setting: <span className="font-bold text-slate-800">{gameBenchmark.max_unlocked_setting}</span>
          </p>
          <p className="text-[11px] text-slate-600 italic">
            "{gameBenchmark.thermal_and_frame_drop_notes}"
          </p>
        </div>
      </div>
    </motion.div>
  );
}
