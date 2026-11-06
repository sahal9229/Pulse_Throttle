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
        className={`w-full bg-white border ${
          isOpen ? 'border-slate-800 ring-2 ring-slate-800/10' : 'border-slate-200/90'
        } hover:border-slate-300 px-3.5 py-2.5 flex items-center justify-between gap-3 rounded-xl transition-all shadow-2xs text-left cursor-pointer`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-100 border border-slate-200/80 flex-shrink-0 flex items-center justify-center">
            <DeviceThumbnail
              src={selectedDevice?.image_url}
              alt={selectedDevice?.device_name || 'Smartphone'}
              brand={selectedDevice?.brand}
              iconSize="w-4 h-4"
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-slate-900 truncate">
                {selectedDevice ? selectedDevice.device_name : 'Select phone...'}
              </span>
              {selectedDevice?.release_year && (
                <span className="text-[10px] text-slate-400 font-mono">
                  ({selectedDevice.release_year})
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-normal truncate">
              {selectedDevice ? selectedDevice.soc_chipset : 'Search catalog...'}
            </p>
          </div>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform flex-shrink-0 ${
            isOpen ? 'rotate-180 text-slate-800' : ''
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
            className="absolute z-50 mt-1.5 w-full bg-white border border-slate-200/90 shadow-[0_12px_32px_rgba(15,23,42,0.12)] rounded-xl overflow-hidden flex flex-col"
          >
            {/* Search Input Box */}
            <div className="p-2.5 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              {isSearchingApi ? (
                <Loader2 className="w-3.5 h-3.5 text-slate-600 animate-spin flex-shrink-0" />
              ) : (
                <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              )}
              <input
                ref={inputRef}
                type="text"
                placeholder="Search phone name (e.g. iPhone 16, S24, iQOO)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs text-slate-900 placeholder-slate-400 outline-none font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-slate-400 hover:text-slate-700 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Brand Filter Pills */}
            <div className="px-2.5 py-1.5 border-b border-slate-100 bg-white flex items-center gap-1 overflow-x-auto no-scrollbar">
              {BRANDS.map((brand) => {
                const isSelected = selectedBrand === brand;
                return (
                  <button
                    key={brand}
                    type="button"
                    onClick={() => setSelectedBrand(brand)}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {brand === 'All' ? 'All' : brand}
                  </button>
                );
              })}
            </div>

            {/* Live Extraction Card */}
            {canExtractLive && (
              <div className="p-2 border-b border-slate-100 bg-slate-50">
                <button
                  type="button"
                  onClick={handleExtractLive}
                  disabled={isExtractingLive}
                  className="w-full p-2 text-left rounded-lg bg-white border border-slate-200 hover:border-slate-300 flex items-center justify-between gap-2.5 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        Fetch telemetry for "{searchQuery.trim()}"
                      </p>
                      <p className="text-[10px] text-slate-500 font-normal">
                        Queries GSMArena + benchmarks
                      </p>
                    </div>
                  </div>
                  {isExtractingLive ? (
                    <Loader2 className="w-3.5 h-3.5 text-slate-500 animate-spin" />
                  ) : (
                    <PlusCircle className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>
              </div>
            )}

            {/* Device List Viewport */}
            <div
              ref={listContainerRef}
              className="h-[216px] max-h-[216px] overflow-y-auto divide-y divide-slate-100 p-1 bg-white"
            >
              {displayDevices.length === 0 && !canExtractLive && (
                <div className="h-full flex items-center justify-center p-4 text-center text-slate-400 text-xs">
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
                        ? 'bg-slate-100'
                        : isOther
                        ? 'opacity-40 hover:opacity-100'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 border border-slate-200/80 flex-shrink-0 flex items-center justify-center p-0.5">
                        <DeviceThumbnail
                          src={device.image_url}
                          alt={device.device_name}
                          brand={device.brand}
                          iconSize="w-4 h-4"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-xs text-slate-900 truncate">
                            {device.device_name}
                          </span>
                          {device.release_year && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({device.release_year})
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 font-normal truncate">
                          {device.soc_chipset}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-mono font-bold text-slate-900 tabular-nums">
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
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_4px_24px_-4px_rgba(15,23,42,0.04)] p-6 sm:p-7 space-y-5">
      {/* 1. Top Bar: Header & Minimal Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Telemetry Target & Workload Setup
          </h2>
        </div>

        {/* Minimal Mode Toggle */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsDualMode(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              isDualMode
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Head-to-Head Compare
          </button>
          <button
            type="button"
            onClick={() => setIsDualMode(false)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              !isDualMode
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Single Device
          </button>
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
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200/80 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
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

      {/* 3. Compact Segment Control: Gaming Workload Target */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Gaming Workload Target
        </label>
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto no-scrollbar">
          {GAME_OPTIONS.map((game) => {
            const isSelected = selectedGame === game.key;
            return (
              <button
                key={game.key}
                type="button"
                onClick={() => setSelectedGame(game.key)}
                className={`flex-1 min-w-[140px] px-3 py-2 rounded-lg text-xs transition-all text-center cursor-pointer ${
                  isSelected
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800 font-medium'
                }`}
              >
                <span>{game.label}</span>
                <span className="ml-1 text-[10px] text-slate-400 font-normal">({game.tag})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Collapsible Advanced Hardware Filters */}
      <div className="border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center justify-between w-full text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors py-1 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span>Advanced Hardware Filters</span>
            {activeFilterCount > 0 && (
              <span className="px-2 py-0.2 rounded-full text-[10px] bg-amber-50 text-amber-700 font-bold border border-amber-200/80">
                {activeFilterCount} active
              </span>
            )}
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
              showFilters ? 'rotate-180 text-slate-800' : ''
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 mt-2 border-t border-slate-100">
                {/* Storage Speed Tier */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-slate-400" /> Minimum Storage Speed
                  </label>
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                    {STORAGE_TIERS.map((tier) => (
                      <button
                        key={tier}
                        type="button"
                        onClick={() => setStorageTier(tier)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                          storageTier === tier
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {tier}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Thermal Throttling Ceiling */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Thermometer className="w-3.5 h-3.5 text-slate-400" /> Thermal Throttling Ceiling
                    </label>
                    <span className="font-mono font-bold text-slate-800 tabular-nums text-xs">
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
                    className="w-full accent-slate-800 cursor-pointer"
                  />
                </div>

                {/* Eye Safety (PWM Dimming) */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-slate-400" /> Display Flicker Safety (PWM)
                  </label>
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                    {PWM_FILTERS.map((f) => (
                      <button
                        key={f.label}
                        type="button"
                        onClick={() => setPwmFilter(f.minHz)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                          pwmFilter === f.minHz
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
