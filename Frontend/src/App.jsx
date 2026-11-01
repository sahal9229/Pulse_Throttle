import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar.jsx';
import ControlPanel from './components/ControlPanel.jsx';
import PhoneCard from './components/PhoneCard.jsx';
import EngineeringVerdict from './components/EngineeringVerdict.jsx';
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
    <div className="min-h-screen bg-slate-200 text-slate-900 relative selection:bg-amber-500/25 selection:text-slate-900">
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
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col sm:flex-row sm:items-end justify-between gap-3"
                >
                  <div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                      Smartphone Gaming Telemetry{' '}
                      <span className="text-amber-600">Lab</span>
                    </h1>
                    <p className="text-slate-700 text-xs sm:text-sm mt-1.5 font-semibold max-w-2xl">
                      Real-world sustained gaming performance with thermal throttling curves & hardware pacing diagnostics.
                    </p>
                  </div>

                  <div className="hidden sm:flex items-center gap-2 text-xs font-mono font-bold text-slate-600">
                    <span className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 shadow-sm">
                      {isDualMode ? 'Mode: Dual Comparison (A vs B)' : 'Mode: Single Device Telemetry'}
                    </span>
                  </div>
                </motion.div>

                {/* Interactive Control Panel */}
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

                {/* Phone Cards Grid */}
                <div
                  className={`grid gap-7 items-stretch ${
                    isDualMode ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 max-w-2xl mx-auto'
                  }`}
                >
                  <AnimatePresence mode="wait">
                    {deviceA && deviceAVisible && (
                      <PhoneCard
                        key={`${deviceA.id}-${analysisRun}`}
                        device={deviceA}
                        rank={winner === 'A' ? 1 : 2}
                        isWinner={isDualMode ? winner === 'A' : true}
                        selectedGame={selectedGame}
                        comparisonDevice={isDualMode ? deviceB : null}
                      />
                    )}
                    {!deviceAVisible && deviceA && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-white border border-slate-300 rounded-2xl p-10 flex flex-col items-center justify-center text-center shadow-sm"
                      >
                        <p className="text-slate-900 text-sm font-extrabold">
                          {deviceA.device_name} is filtered out
                        </p>
                        <p className="text-slate-600 text-xs mt-1 font-semibold">
                          Relax storage tier, temperature ceiling, or PWM dimming filter.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence mode="wait">
                    {isDualMode && deviceB && deviceBVisible && (
                      <PhoneCard
                        key={`${deviceB.id}-${analysisRun}`}
                        device={deviceB}
                        rank={winner === 'B' ? 1 : 2}
                        isWinner={winner === 'B'}
                        selectedGame={selectedGame}
                        comparisonDevice={deviceA}
                      />
                    )}
                    {isDualMode && !deviceBVisible && deviceB && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-white border border-slate-300 rounded-2xl p-10 flex flex-col items-center justify-center text-center shadow-sm"
                      >
                        <p className="text-slate-900 text-sm font-extrabold">
                          {deviceB.device_name} is filtered out
                        </p>
                        <p className="text-slate-600 text-xs mt-1 font-semibold">
                          Relax storage tier, temperature ceiling, or PWM dimming filter.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Engineering Verdict (Bento Diagnostic Grid) */}
                {deviceA && deviceAVisible && (!isDualMode || (deviceB && deviceBVisible)) && (
                  <EngineeringVerdict
                    deviceA={deviceA}
                    deviceB={isDualMode ? deviceB : null}
                    selectedGame={selectedGame}
                    isDualMode={isDualMode}
                  />
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

        {/* High-Contrast Footer */}
        <footer className="border-t border-slate-300 bg-white/70 backdrop-blur-sm mt-14">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-700">
            <p className="text-xs font-mono font-bold">
              © PulseThrottle — Mobile Hardware & Gaming Telemetry Engine
            </p>
            <p className="text-[11px] font-mono font-semibold text-slate-500">
              Connected to local FastAPI SQLite bridge • Direct Telemetry Evaluation
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
