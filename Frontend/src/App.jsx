import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar.jsx';
import ControlPanel from './components/ControlPanel.jsx';
import HeadToHeadComparison from './components/HeadToHeadComparison.jsx';
import Leaderboard from './components/Leaderboard.jsx';
import {
  extractPwmHz,
  getDeviceByIdOrName,
  syncCatalogWithBackend,
  subscribeCatalog,
} from './data/deviceData.js';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [phoneA, setPhoneA] = useState('apple-iphone-16-pro-max');
  const [phoneB, setPhoneB] = useState('samsung-s24-ultra');
  const [selectedGame, setSelectedGame] = useState('BGMI');
  const [isDualMode, setIsDualMode] = useState(true);
  const [storageTier, setStorageTier] = useState('All');
  const [maxTemp, setMaxTemp] = useState(48);
  const [pwmFilter, setPwmFilter] = useState(0);
  const [analysisRun, setAnalysisRun] = useState(0);

  // Sync with FastAPI local bridge on mount
  useEffect(() => {
    syncCatalogWithBackend();
  }, []);

  // Force re-render if catalog updates
  useEffect(() => {
    const unsub = subscribeCatalog(() => {
      setAnalysisRun((n) => n + 1);
    });
    return unsub;
  }, []);

  const deviceA = useMemo(() => getDeviceByIdOrName(phoneA), [phoneA, analysisRun]);
  const deviceB = useMemo(() => getDeviceByIdOrName(phoneB), [phoneB, analysisRun]);

  const isDeviceVisible = useCallback(
    (device) => {
      if (!device) return false;
      if (device.is_extracting) return true;
      if (storageTier !== 'All' && device.storage_tier !== storageTier) return false;
      if (device.peak_temp_celsius && device.peak_temp_celsius > maxTemp) return false;
      if (pwmFilter > 0) {
        const hz = extractPwmHz(device.pwm_dimming_hz);
        if (hz < pwmFilter) return false;
      }
      return true;
    },
    [storageTier, maxTemp, pwmFilter]
  );

  const deviceAVisible = deviceA ? isDeviceVisible(deviceA) : false;
  const deviceBVisible = deviceB ? isDeviceVisible(deviceB) : false;

  const winner = useMemo(() => {
    if (!isDualMode || !deviceA || !deviceB) return null;
    if (deviceA.is_extracting || deviceB.is_extracting) return null;
    return deviceA.pulse_throttle_index >= deviceB.pulse_throttle_index ? 'A' : 'B';
  }, [deviceA, deviceB, isDualMode]);

  const handleLeaderboardSelect = useCallback(
    (deviceId) => {
      if (!deviceId) return;
      if (isDualMode && phoneB !== deviceId) {
        setPhoneA(deviceId);
      } else {
        setPhoneA(deviceId);
      }
      setActiveTab('dashboard');
    },
    [phoneB, isDualMode]
  );

  return (
    <div className="min-h-screen bg-[#EAF0F6] text-slate-900 relative selection:bg-amber-500/25 selection:text-slate-900">
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7 flex-1 w-full">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-7"
              >
                {/* Hero Header */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2"
                >
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                      Pulse<span className="text-[#D97706]">Throttle</span>
                    </h1>
                    <p className="text-slate-500 text-xs sm:text-sm mt-0.5 font-normal">
                      Deterministic hardware telemetry & sustained gaming benchmark analysis.
                    </p>
                  </div>

                  <div className="hidden sm:block text-xs font-mono text-slate-400">
                    <span>Hardware Telemetry Lab • 2026 Physics Calibrated</span>
                  </div>
                </motion.div>

                {/* Streamlined Interactive Control Panel */}
                <ControlPanel
                  phoneA={phoneA}
                  phoneB={phoneB}
                  setPhoneA={setPhoneA}
                  setPhoneB={setPhoneB}
                  selectedGame={selectedGame}
                  setSelectedGame={setSelectedGame}
                  isDualMode={isDualMode}
                  setIsDualMode={setIsDualMode}
                  storageTier={storageTier}
                  setStorageTier={setStorageTier}
                  maxTemp={maxTemp}
                  setMaxTemp={setMaxTemp}
                  pwmFilter={pwmFilter}
                  setPwmFilter={setPwmFilter}
                  onRunAnalysis={() => setAnalysisRun((n) => n + 1)}
                />

                {/* Unified Head-to-Head Comparison View */}
                {deviceA && deviceAVisible && (!isDualMode || (deviceB && deviceBVisible)) && (
                  <HeadToHeadComparison
                    key={`${deviceA.id}-${deviceB?.id || 'single'}-${analysisRun}`}
                    deviceA={deviceA}
                    deviceB={isDualMode ? deviceB : null}
                    selectedGame={selectedGame}
                    isDualMode={isDualMode}
                  />
                )}

                {/* Filter Recovery Card */}
                {((deviceA && !deviceAVisible) || (isDualMode && deviceB && !deviceBVisible)) && (
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-2xs space-y-3">
                    <p className="text-slate-900 text-sm font-bold">
                      {(!deviceAVisible ? deviceA?.device_name : deviceB?.device_name)} is hidden by active hardware filters
                    </p>
                    <p className="text-slate-500 text-xs max-w-md font-normal">
                      Relax your storage tier, thermal ceiling, or PWM dimming filter in Advanced Hardware Filters above to view this device.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setStorageTier('All');
                        setMaxTemp(48);
                        setPwmFilter(0);
                      }}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'leaderboard' && (
              <motion.div
                key="leaderboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <Leaderboard onSelectDevice={handleLeaderboardSelect} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* High-Contrast Ice Lab Footer */}
        <footer className="border-t border-slate-200/90 bg-white/80 backdrop-blur-sm mt-14">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-700">
            <p className="text-xs font-mono font-bold text-slate-800">
              © PulseThrottle — Hardware Telemetry Lab Engine
            </p>
            <p className="text-[11px] font-mono font-medium text-slate-500">
              Deterministic Silicon Calibration • Grounded Hardware Generation Physics
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
