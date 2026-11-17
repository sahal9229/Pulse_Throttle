import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeftRight,
  ChevronDown,
  Loader2,
  Search,
  Sparkles,
  PlusCircle,
  X,
  SlidersHorizontal,
  HardDrive,
  Thermometer,
  Eye,
} from 'lucide-react';
import {
  BRANDS,
  getAllDevices,
  subscribeCatalog,
  getDeviceByIdOrName,
  extractCustomPhoneTelemetry,
  searchCatalogFromApi,
  registerPendingExtractionDevice,
} from '../data/deviceData.js';
import DeviceThumbnail from './DeviceThumbnail.jsx';
import { AnimatedBackground, TextShimmer } from './motion/index.js';

const STORAGE_TIERS = ['All', 'UFS 4.0', 'UFS 3.1', 'UFS 2.2', 'NVMe Fast'];
const PWM_FILTERS = [
  { label: 'All', minHz: 0 },
  { label: '720Hz+', minHz: 720 },
  { label: '1440Hz+', minHz: 1440 },
  { label: '1920Hz+', minHz: 1920 },
];

const GAME_OPTIONS = [
  { key: 'BGMI', label: 'BGMI / PUBG', tag: '90/120 FPS' },
  { key: 'GENSHIN', label: 'Genshin Impact', tag: 'Open-World 3D' },
  { key: 'CODM', label: 'Call of Duty: Mobile', tag: 'High Refresh' },
  { key: 'WUTHERING', label: 'Wuthering Waves', tag: 'Ray Tracing' },
];

/**
 * Clean Searchable Device Selector
 * Minimalist input with brand pills, autocomplete, and live extraction
 */
function SearchableDeviceSelector({ label, selectedDevice, onSelect, otherSelectedId, slot }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [catalog, setCatalog] = useState(() => getAllDevices());
  const [apiResults, setApiResults] = useState([]);
  const [isSearchingApi, setIsSearchingApi] = useState(false);
  const [isExtractingLive, setIsExtractingLive] = useState(false);

  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const listContainerRef = useRef(null);

  // Subscribe to dynamic catalog updates
  useEffect(() => {
    const unsub = subscribeCatalog((updated) => setCatalog([...updated]));
    return unsub;
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Real-time Autocomplete query with 200ms debounce
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setApiResults([]);
      setIsSearchingApi(false);
      return;
    }

    setIsSearchingApi(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchCatalogFromApi(q, selectedBrand, 15);
        setApiResults(results || []);
      } catch (err) {
        console.debug('Autocomplete search error:', err);
      } finally {
        setIsSearchingApi(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedBrand]);

  // Combined devices
  const displayDevices = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    const localFiltered = catalog.filter((d) => {
      if (selectedBrand !== 'All') {
        const dBrand = (d.brand || '').toLowerCase();
        if (selectedBrand === 'Poco/Xiaomi') {
          if (dBrand !== 'xiaomi' && dBrand !== 'poco') return false;
        } else if (dBrand !== selectedBrand.toLowerCase()) {
          return false;
        }
      }
      if (!q) return true;
      return (
        d.device_name.toLowerCase().includes(q) ||
        d.soc_chipset.toLowerCase().includes(q) ||
        (d.brand && d.brand.toLowerCase().includes(q)) ||
        (d.gpu && d.gpu.toLowerCase().includes(q))
      );
    });

    if (!q) return localFiltered;

    const seenIds = new Set(localFiltered.map((d) => d.id));
    const remoteMatches = [];

    for (const item of apiResults) {
      if (item && item.id && !seenIds.has(item.id)) {
        seenIds.add(item.id);
        remoteMatches.push({
          id: item.id,
          device_name: item.canonical_name || item.id,
          brand: item.brand || 'Other',
          soc_chipset: item.base_soc || 'Unknown SoC',
          image_url: item.default_image || '',
          pulse_throttle_index: item.pulse_throttle_index ?? 70.0,
          antutu_v10_score: 1100000,
          geekbench_6_multi: 4500,
          wildlife_stability_pct: 78.0,
          peak_temp_celsius: 42.5,
          pwm_dimming_hz: '2160Hz',
          storage_tier: 'UFS 4.0',
          os: item.os || 'Android',
          release_year: item.release_year || 2024,
          is_api_catalog_item: true,
        });
      }
    }

    return [...localFiltered, ...remoteMatches];
  }, [catalog, apiResults, searchQuery, selectedBrand]);

  const canExtractLive = useMemo(() => {
    const q = searchQuery.trim();
    if (q.length < 3) return false;
    const exactLocal = catalog.some(
      (d) => d.device_name.toLowerCase() === q.toLowerCase() || d.id === q.toLowerCase()
    );
    return !exactLocal;
  }, [searchQuery, catalog]);

  const handleDeviceSelect = (device) => {
    onSelect(device.id);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleExtractLive = async () => {
    const q = searchQuery.trim();
    if (!q) return;

    setIsExtractingLive(true);
    registerPendingExtractionDevice(q);
    onSelect(q.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
    setIsOpen(false);

    try {
      await extractCustomPhoneTelemetry(q);
    } catch (err) {
      console.error('Failed to extract device:', err);
    } finally {
      setIsExtractingLive(false);
      setSearchQuery('');
    }
  };

  return (
    <div ref={dropdownRef} className="relative flex-1 min-w-[280px]">
      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>

      {/* Main Trigger Button */}
      <button
        type="button"
        onClick={() => {
          const next = !isOpen;
          setIsOpen(next);
          if (next) {
            setTimeout(() => inputRef.current?.focus(), 80);
          }
        }}
        className={`w-full bg-white dark:bg-[#0B0D14] border ${
          isOpen ? 'border-slate-800 dark:border-amber-500 ring-2 ring-slate-800/10 dark:ring-amber-500/25' : 'border-slate-200/90 dark:border-white/[0.08]'
        } hover:border-slate-300 dark:hover:border-white/20 px-3.5 py-2.5 flex items-center justify-between gap-3 rounded-xl transition-all shadow-sm text-left cursor-pointer`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-100 dark:bg-[#141824] border border-slate-200/80 dark:border-white/10 flex-shrink-0 flex items-center justify-center">
            <DeviceThumbnail
              src={selectedDevice?.image_url}
              alt={selectedDevice?.device_name || 'Smartphone'}
              brand={selectedDevice?.brand}
              iconSize="w-4 h-4"
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                {selectedDevice ? selectedDevice.device_name : 'Select phone...'}
              </span>
              {selectedDevice?.release_year && (
                <span className="text-[10px] text-slate-400 dark:text-slate-400 font-mono">
                  ({selectedDevice.release_year})
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
              {selectedDevice ? selectedDevice.soc_chipset : 'Search catalog...'}
            </p>
          </div>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-slate-400 dark:text-slate-400 transition-transform flex-shrink-0 ${
            isOpen ? 'rotate-180 text-slate-800 dark:text-amber-400' : ''
          }`}
        />
      </button>

      {/* Autocomplete Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute z-50 mt-1.5 w-full bg-white dark:bg-[#0E1118] border border-slate-200/90 dark:border-white/10 shadow-[0_12px_32px_rgba(15,23,42,0.12)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.85)] rounded-xl overflow-hidden flex flex-col"
          >
            {/* Search Input Box */}
            <div className="p-2.5 border-b border-slate-100 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0B0D14] flex items-center gap-2">
              {isSearchingApi ? (
                <Loader2 className="w-3.5 h-3.5 text-slate-600 dark:text-amber-400 animate-spin flex-shrink-0" />
              ) : (
                <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400 flex-shrink-0" />
              )}
              <input
                ref={inputRef}
                type="text"
                placeholder="Search phone name (e.g. iPhone 16, S24, iQOO)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Brand Filter Pills */}
            <div className="px-2.5 py-1.5 border-b border-slate-100 dark:border-white/[0.08] bg-white dark:bg-[#0E1118] flex items-center gap-1 overflow-x-auto no-scrollbar">
              {BRANDS.map((brand) => {
                const isSelected = selectedBrand === brand;
                return (
                  <button
                    key={brand}
                    type="button"
                    onClick={() => setSelectedBrand(brand)}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 font-bold shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.08]'
                    }`}
                  >
                    {brand === 'All' ? 'All' : brand}
                  </button>
                );
              })}
            </div>

            {/* Live Extraction Card */}
            {canExtractLive && (
              <div className="p-2 border-b border-slate-100 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0B0D14]">
                <button
                  type="button"
                  onClick={handleExtractLive}
                  disabled={isExtractingLive}
                  className="w-full p-2 text-left rounded-lg bg-white dark:bg-[#0E1118] border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 flex items-center justify-between gap-2.5 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                    <div className="min-w-0">
                      {isExtractingLive ? (
                        <TextShimmer className="text-xs font-semibold">
                          {`Fetching telemetry for "${searchQuery.trim()}"...`}
                        </TextShimmer>
                      ) : (
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          Fetch telemetry for "{searchQuery.trim()}"
                        </p>
                      )}
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                        Queries GSMArena + benchmarks
                      </p>
                    </div>
                  </div>
                  {isExtractingLive ? (
                    <Loader2 className="w-3.5 h-3.5 text-slate-500 dark:text-amber-400 animate-spin" />
                  ) : (
                    <PlusCircle className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400" />
                  )}
                </button>
              </div>
            )}

            {/* Device List Viewport */}
            <div
              ref={listContainerRef}
              className="h-[216px] max-h-[216px] overflow-y-auto divide-y divide-slate-100 dark:divide-white/[0.06] p-1 bg-white dark:bg-[#0E1118]"
            >
              {displayDevices.length === 0 && !canExtractLive && (
                <div className="h-full flex items-center justify-center p-4 text-center text-slate-400 dark:text-slate-500 text-xs font-medium">
                  No matching models. Type name to extract.
                </div>
              )}

              {displayDevices.map((device) => {
                const isSelected = selectedDevice?.id === device.id;
                const isOther = otherSelectedId === device.id;

                return (
                  <button
                    key={device.id}
                    type="button"
                    onClick={() => handleDeviceSelect(device)}
                    className={`w-full p-2 rounded-lg flex items-center justify-between gap-3 text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-slate-100 dark:bg-[#1E2538]'
                        : isOther
                        ? 'opacity-40 hover:opacity-100'
                        : 'hover:bg-slate-50 dark:hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 dark:bg-[#141824] border border-slate-200/80 dark:border-white/10 flex-shrink-0 flex items-center justify-center p-0.5">
                        <DeviceThumbnail
                          src={device.image_url}
                          alt={device.device_name}
                          brand={device.brand}
                          iconSize="w-4 h-4"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                            {device.device_name}
                          </span>
                          {device.release_year && (
                            <span className="text-[10px] text-slate-400 dark:text-slate-400 font-mono">
                              ({device.release_year})
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal truncate">
                          {device.soc_chipset}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-mono font-bold text-slate-900 dark:text-amber-400 tabular-nums">
                      {device.pulse_throttle_index}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Clean & Streamlined Hardware Telemetry Control Panel
 */
export default function ControlPanel({
  phoneA,
  phoneB,
  setPhoneA,
  setPhoneB,
  selectedGame,
  setSelectedGame,
  isDualMode,
  setIsDualMode,
  storageTier,
  setStorageTier,
  maxTemp,
  setMaxTemp,
  pwmFilter,
  setPwmFilter,
  onRunAnalysis,
}) {
  const [showFilters, setShowFilters] = useState(false);
  const deviceA = useMemo(() => getDeviceByIdOrName(phoneA), [phoneA]);
  const deviceB = useMemo(() => getDeviceByIdOrName(phoneB), [phoneB]);

  const handleSwap = () => {
    if (!isDualMode) return;
    const temp = phoneA;
    setPhoneA(phoneB);
    setPhoneB(temp);
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (storageTier !== 'All') count++;
    if (maxTemp < 48) count++;
    if (pwmFilter > 0) count++;
    return count;
  }, [storageTier, maxTemp, pwmFilter]);

  return (
    <div className="bg-white dark:bg-[#0E1118] rounded-2xl border border-slate-200/90 dark:border-white/[0.08] shadow-[0_4px_24px_-4px_rgba(15,23,42,0.04)] dark:shadow-[0_20px_45px_-10px_rgba(0,0,0,0.8)] p-6 sm:p-7 space-y-5">
      {/* 1. Top Bar: Header & Minimal Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/[0.08]">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
            Telemetry Target & Workload Setup
          </h2>
        </div>

        {/* Minimal Mode Toggle with AnimatedBackground */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-[#0B0D14] border border-slate-200/50 dark:border-white/[0.08] rounded-xl self-start sm:self-auto">
          <AnimatedBackground
            defaultValue={isDualMode ? 'compare' : 'single'}
            className="bg-white dark:bg-[#1E2538] rounded-lg shadow-sm border border-transparent dark:border-white/10"
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            onValueChange={(id) => {
              if (id) setIsDualMode(id === 'compare');
            }}
          >
            <button
              data-id="compare"
              type="button"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                isDualMode
                  ? 'text-slate-900 dark:text-white font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Head-to-Head Compare
            </button>
            <button
              data-id="single"
              type="button"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                !isDualMode
                  ? 'text-slate-900 dark:text-white font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Single Device
            </button>
          </AnimatedBackground>
        </div>
      </div>

      {/* 2. Device Selectors Row */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
        <SearchableDeviceSelector
          label="Device A"
          selectedDevice={deviceA}
          onSelect={setPhoneA}
          otherSelectedId={isDualMode ? phoneB : null}
          slot="A"
        />

        {isDualMode && (
          <div className="flex items-center justify-center pt-2 lg:pt-5">
            <button
              type="button"
              onClick={handleSwap}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-[#0B0D14] hover:bg-slate-200 dark:hover:bg-[#141824] border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors shadow-2xs cursor-pointer active:scale-95 duration-150"
              title="Swap Device A and Device B"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {isDualMode && (
          <SearchableDeviceSelector
            label="Device B"
            selectedDevice={deviceB}
            onSelect={setPhoneB}
            otherSelectedId={phoneA}
            slot="B"
          />
        )}
      </div>

      {/* 3. Compact Segment Control with AnimatedBackground: Gaming Workload Target */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Gaming Workload Target
        </label>
        <div className="flex items-center p-1 bg-slate-100 dark:bg-[#0B0D14] border border-slate-200/50 dark:border-white/[0.08] rounded-xl overflow-x-auto no-scrollbar">
          <AnimatedBackground
            defaultValue={selectedGame}
            className="bg-white dark:bg-[#1E2538] rounded-lg shadow-sm border border-transparent dark:border-white/10"
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onValueChange={(id) => {
              if (id) setSelectedGame(id);
            }}
          >
            {GAME_OPTIONS.map((game) => {
              const isSelected = selectedGame === game.key;
              return (
                <button
                  key={game.key}
                  data-id={game.key}
                  type="button"
                  className={`flex-1 min-w-[140px] px-3 py-2 rounded-lg text-xs transition-colors text-center cursor-pointer ${
                    isSelected
                      ? 'text-slate-900 dark:text-amber-400 font-bold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
                  }`}
                >
                  <span>{game.label}</span>
                  <span className={`ml-1 text-[10px] font-normal ${isSelected ? 'text-amber-600 dark:text-amber-300/80 font-medium' : 'text-slate-400 dark:text-slate-500'}`}>
                    ({game.tag})
                  </span>
                </button>
              );
            })}
          </AnimatedBackground>
        </div>
      </div>

      {/* 4. Collapsible Advanced Hardware Filters */}
      <div className="border-t border-slate-100 dark:border-white/[0.08] pt-3">
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center justify-between w-full text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors py-1 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400" />
            <span>Advanced Hardware Filters</span>
            {activeFilterCount > 0 && (
              <span className="px-2 py-0.2 rounded-full text-[10px] bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-bold border border-amber-200/80 dark:border-amber-700/50">
                {activeFilterCount} active
              </span>
            )}
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-400 transition-transform ${
              showFilters ? 'rotate-180 text-slate-800 dark:text-amber-400' : ''
            }`}
          />
        </button>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 mt-2 border-t border-slate-100 dark:border-white/[0.08]">
                {/* Storage Speed Tier */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400" /> Minimum Storage Speed
                  </label>
                  <div className="flex items-center p-0.5 bg-slate-100 dark:bg-[#0B0D14] border border-slate-200/50 dark:border-white/[0.08] rounded-lg overflow-x-auto no-scrollbar">
                    <AnimatedBackground
                      defaultValue={storageTier}
                      className="bg-slate-900 dark:bg-amber-500 rounded-md shadow-2xs"
                      transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                      onValueChange={(id) => {
                        if (id) setStorageTier(id);
                      }}
                    >
                      {STORAGE_TIERS.map((tier) => (
                        <button
                          key={tier}
                          data-id={tier}
                          type="button"
                          className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                            storageTier === tier
                              ? 'text-white dark:text-slate-950 font-bold'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          {tier}
                        </button>
                      ))}
                    </AnimatedBackground>
                  </div>
                </div>

                {/* Thermal Throttling Ceiling */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Thermometer className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400" /> Thermal Throttling Ceiling
                    </label>
                    <span className="font-mono font-bold text-slate-800 dark:text-white tabular-nums text-xs">
                      {maxTemp >= 48 ? 'No Limit' : `≤ ${maxTemp}°C`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={40}
                    max={48}
                    step={0.5}
                    value={maxTemp}
                    onChange={(e) => setMaxTemp(parseFloat(e.target.value))}
                    className="w-full accent-slate-800 dark:accent-amber-500 cursor-pointer"
                  />
                </div>

                {/* Eye Safety (PWM Dimming) */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400" /> Display Flicker Safety (PWM)
                  </label>
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                    {PWM_FILTERS.map((f) => (
                      <button
                        key={f.label}
                        type="button"
                        onClick={() => setPwmFilter(f.minHz)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                          pwmFilter === f.minHz
                            ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 font-bold shadow-sm'
                            : 'bg-slate-100 dark:bg-[#0B0D14] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#141824] border border-slate-200/50 dark:border-white/[0.08]'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
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
