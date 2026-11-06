import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeftRight,
  Smartphone,
  Gamepad2,
  HardDrive,
  Thermometer,
  Eye,
  ChevronDown,
  Loader2,
  Search,
  Sparkles,
  Check,
  PlusCircle,
  X,
  Layers,
  Flame,
  Cpu,
  ShieldCheck,
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
  { key: 'BGMI', label: 'BGMI / PUBG Mobile', subtitle: 'Esports 90/120 FPS high refresh test', emoji: '🎯' },
  { key: 'GENSHIN', label: 'Genshin Impact', subtitle: 'Heavy open-world 3D rendering load', emoji: '🌍' },
  { key: 'CODM', label: 'Call of Duty: Mobile', subtitle: 'High frame-rate multiplayer pacing', emoji: '🔫' },
  { key: 'WUTHERING', label: 'Wuthering Waves', subtitle: 'Intense shaders & ray-tracing pipeline', emoji: '⚔️' },
];

const BRAND_BADGE_STYLES = {
  apple: { bg: 'bg-slate-900', text: 'text-white', border: 'border-slate-800' },
  samsung: { bg: 'bg-blue-600', text: 'text-white', border: 'border-blue-700' },
  xiaomi: { bg: 'bg-orange-600', text: 'text-white', border: 'border-orange-700' },
  poco: { bg: 'bg-amber-600', text: 'text-white', border: 'border-amber-700' },
  oneplus: { bg: 'bg-red-600', text: 'text-white', border: 'border-red-700' },
  motorola: { bg: 'bg-teal-600', text: 'text-white', border: 'border-teal-700' },
  iqoo: { bg: 'bg-indigo-600', text: 'text-white', border: 'border-indigo-700' },
  vivo: { bg: 'bg-sky-600', text: 'text-white', border: 'border-sky-700' },
  google: { bg: 'bg-emerald-600', text: 'text-white', border: 'border-emerald-700' },
};

function getBrandBadge(brand) {
  if (!brand) return { bg: 'bg-slate-700', text: 'text-white', border: 'border-slate-800' };
  const key = brand.toLowerCase();
  return BRAND_BADGE_STYLES[key] || { bg: 'bg-slate-700', text: 'text-white', border: 'border-slate-800' };
}

/**
 * Phase 4: High-Contrast Searchable Autocomplete Dropdown
 * - Responsive combobox for Primary & Secondary device selectors
 * - 3 items visible with smooth vertical scroll for additional variants
 * - Verified image thumbnail, brand badge, and chipset preview in every option
 * - Connected on-demand extraction trigger
 */
function SearchableDeviceSelector({ label, selectedDevice, onSelect, otherSelectedId, slot }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [catalog, setCatalog] = useState(() => getAllDevices());
  const [apiResults, setApiResults] = useState([]);
  const [isSearchingApi, setIsSearchingApi] = useState(false);
  const [extractingId, setExtractingId] = useState(null);
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

  // Real-time Autocomplete query to Supabase Catalog Search with 200ms debounce
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

  // Combined devices: local database matching + Supabase catalog search matches
  const displayDevices = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    // 1. Filter local loaded devices
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

    // 2. Merge with Supabase master catalog results (avoiding duplicates)
    const seenNames = new Set(localFiltered.map((d) => d.device_name.toLowerCase()));
    const merged = [...localFiltered];

    for (const apiDev of apiResults) {
      const lower = apiDev.device_name.toLowerCase();
      if (!seenNames.has(lower)) {
        seenNames.add(lower);
        merged.push(apiDev);
      }
    }

    return merged;
  }, [catalog, searchQuery, selectedBrand, apiResults]);

  const hasExactMatch = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return displayDevices.some((d) => d.device_name.toLowerCase() === q);
  }, [displayDevices, searchQuery]);

  const canExtractLive = searchQuery.trim().length >= 2 && !hasExactMatch;

  // On-demand Extraction Trigger: instantly registers pending skeleton device, closes dropdown, and extracts in background
  const handleDeviceSelect = (device) => {
    // If device already has complete benchmark scores, select immediately
    if (device.pulse_throttle_index && !device.is_catalog_item && !device.is_extracting) {
      onSelect(device.id);
      setSearchQuery('');
      setIsOpen(false);
      return;
    }

    // Unbenchmarked catalog item: instantly create pending extraction device, select it, and close dropdown immediately
    const targetName = device.canonical_name || device.device_name;
    const pending = registerPendingExtractionDevice(targetName, device);
    if (pending) {
      onSelect(pending.id);
    } else {
      onSelect(device.id);
    }
    setSearchQuery('');
    setIsOpen(false);

    // Fire off async background extraction so comparison tab updates automatically
    extractCustomPhoneTelemetry(targetName).catch((err) => {
      console.warn('Background extraction error:', err);
    });
  };

  // Trigger manual live extraction for custom input: closes dropdown instantly and switches to skeleton card
  const handleExtractLive = () => {
    const query = searchQuery.trim();
    if (!query) return;

    const pending = registerPendingExtractionDevice(query);
    if (pending) {
      onSelect(pending.id);
    }
    setSearchQuery('');
    setIsOpen(false);

    // Background live web scraping
    extractCustomPhoneTelemetry(query).catch((err) => {
      console.warn('Background live extraction error:', err);
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (displayDevices.length > 0) {
        handleDeviceSelect(displayDevices[0]);
      } else if (canExtractLive) {
        handleExtractLive();
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative flex-1 min-w-0" ref={dropdownRef}>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-slate-600 text-xs font-bold uppercase tracking-wider">
          {label}
        </label>
        {selectedDevice?.is_past_search && (
          <span className="text-[10px] text-amber-800 bg-amber-100 border border-amber-300 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
            <Flame className="w-3 h-3 text-amber-600" /> Synced Run
          </span>
        )}
      </div>

      {/* Main Dropdown Button */}
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
          isOpen ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-200/90'
        } hover:border-slate-300 px-3.5 py-3 flex items-center justify-between gap-3 rounded-xl transition-all shadow-[0_4px_16px_-2px_rgba(15,23,42,0.04)] text-left cursor-pointer`}
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Thumbnail or Icon with fallback */}
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200/90 flex-shrink-0 flex items-center justify-center shadow-2xs">
            <DeviceThumbnail
              src={selectedDevice?.image_url}
              alt={selectedDevice?.device_name || 'Smartphone'}
              brand={selectedDevice?.brand}
              iconSize="w-5 h-5"
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm text-slate-900 truncate">
                {selectedDevice ? selectedDevice.device_name : 'Select or Search Phone...'}
              </span>
              {selectedDevice?.os && (
                <span className="text-[10px] font-bold text-slate-600 px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200 flex-shrink-0">
                  {selectedDevice.os === 'iOS' ? '🍎 iOS' : '🤖 Android'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 font-medium truncate mt-0.5">
              {selectedDevice
                ? `${selectedDevice.soc_chipset} • Score: ${selectedDevice.pulse_throttle_index}`
                : 'Search any model (e.g. iPhone, Samsung, Moto, iQOO, Xiaomi)...'}
            </p>
          </div>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-slate-500 transition-transform flex-shrink-0 ${
            isOpen ? 'rotate-180 text-amber-600' : ''
          }`}
        />
      </button>

      {/* Autocomplete Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-2 w-full bg-white border border-slate-200/90 shadow-[0_16px_36px_rgba(15,23,42,0.14)] rounded-2xl overflow-hidden flex flex-col"
          >
            {/* Search Input Box with Live Autocomplete feedback */}
            <div className="p-3 border-b border-slate-200/90 bg-[#F1F5F9] flex items-center gap-2">
              {isSearchingApi ? (
                <Loader2 className="w-4 h-4 text-amber-500 animate-spin flex-shrink-0" />
              ) : (
                <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
              )}
              <input
                ref={inputRef}
                type="text"
                placeholder="Type phone name (e.g. iPhone 16, S24, Edge 60, iQOO, POCO)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none font-semibold"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-slate-400 hover:text-slate-700 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Brand Filter Pills */}
            <div className="px-3 py-2 border-b border-slate-200/90 bg-white flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {BRANDS.map((brand) => {
                const isSelected = selectedBrand === brand;
                return (
                  <button
                    key={brand}
                    type="button"
                    onClick={() => setSelectedBrand(brand)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white border-transparent shadow-xs'
                        : 'bg-[#F1F5F9] text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {brand === 'All' ? 'All Brands' : brand}
                  </button>
                );
              })}
            </div>

            {/* Live Extraction Card for unlisted searches */}
            {canExtractLive && (
              <div className="p-2 border-b border-slate-100 bg-amber-50/60">
                <button
                  type="button"
                  onClick={handleExtractLive}
                  disabled={isExtractingLive}
                  className="w-full p-2.5 text-left rounded-xl bg-amber-50 border border-amber-300 hover:bg-amber-100 flex items-center justify-between gap-3 group transition-all text-slate-900 shadow-sm cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center flex-shrink-0">
                      {isExtractingLive ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-slate-900 truncate">
                        {isExtractingLive
                          ? `Fetching specifications & benchmarks for "${searchQuery.trim()}"...`
                          : `⚡ Fetch Live Telemetry for "${searchQuery.trim()}"`}
                      </p>
                      <p className="text-[10px] text-slate-600 font-medium">
                        Searches hardware databases & calculates deterministic benchmark scores
                      </p>
                    </div>
                  </div>
                  {!isExtractingLive && (
                    <PlusCircle className="w-5 h-5 text-amber-600 group-hover:scale-110 transition-transform flex-shrink-0" />
                  )}
                </button>
              </div>
            )}

            {/* Device List Viewport: Displays 3 items visible with smooth vertical scroll for additional variants */}
            <div
              ref={listContainerRef}
              className="h-[216px] max-h-[216px] overflow-y-auto scroll-smooth overscroll-contain divide-y divide-slate-100 p-1.5 bg-white space-y-1"
              style={{ scrollbarWidth: 'thin' }}
            >
              {displayDevices.length === 0 && !canExtractLive && (
                <div className="h-full flex items-center justify-center p-6 text-center text-slate-500 text-xs font-semibold">
                  No matching smartphones found. Type any name to extract telemetry.
                </div>
              )}

              {displayDevices.map((device) => {
                const isSelected = selectedDevice?.id === device.id;
                const isOther = otherSelectedId === device.id;
                const isItemExtracting = extractingId === device.id;
                const brandStyle = getBrandBadge(device.brand);

                return (
                  <button
                    key={device.id}
                    type="button"
                    onClick={() => handleDeviceSelect(device)}
                    disabled={isItemExtracting}
                    className={`w-full h-[66px] p-2 rounded-xl flex items-center justify-between gap-3 transition-colors text-left cursor-pointer ${
                      isSelected
                        ? 'bg-amber-50 border border-amber-300'
                        : isOther
                        ? 'bg-slate-50 opacity-60 hover:opacity-100'
                        : 'hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Verified Image Thumbnail with Brand Fallback */}
                      <div className="w-11 h-11 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center p-0.5 relative">
                        <DeviceThumbnail
                          src={device.image_url}
                          alt={device.device_name}
                          brand={device.brand}
                          className="w-full h-full object-cover rounded-md"
                          iconSize="w-5 h-5"
                        />
                      </div>

                      {/* Device Details with Brand Badge and Chipset Preview */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-sm text-slate-900 truncate">
                            {device.device_name}
                          </span>
                          {/* Brand Badge */}
                          <span
                            className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded border shadow-2xs ${brandStyle.bg} ${brandStyle.text} ${brandStyle.border}`}
                          >
                            {device.brand}
                          </span>
                          {/* OS Badge */}
                          <span className="text-[9px] font-bold text-slate-600 px-1 py-0.2 rounded bg-slate-100 border border-slate-200 flex-shrink-0">
                            {device.os === 'iOS' ? '🍎 iOS' : '🤖 Android'}
                          </span>
                          {device.release_year && (
                            <span className="text-[9px] font-semibold text-slate-400">
                              {device.release_year}
                            </span>
                          )}
                        </div>

                        {/* Chipset Preview */}
                        <div className="flex items-center gap-1 text-xs text-slate-600 font-medium truncate mt-0.5">
                          <Cpu className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{device.soc_chipset}</span>
                        </div>
                      </div>
                    </div>

                    {/* PTI Score or On-Demand Extraction Trigger Badge */}
                    <div className="text-right flex-shrink-0 pl-2">
                      {isItemExtracting ? (
                        <div className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-md border border-amber-300">
                          <Loader2 className="w-3 h-3 animate-spin" /> Extracting...
                        </div>
                      ) : device.pulse_throttle_index ? (
                        <>
                          <div className="text-xs font-black font-mono text-slate-900">
                            {device.pulse_throttle_index}
                          </div>
                          <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                            Score
                          </div>
                        </>
                      ) : (
                        <div className="text-[10px] font-extrabold text-amber-700 bg-amber-50 px-2 py-1 rounded-md border border-amber-300 flex items-center gap-1 hover:bg-amber-100 transition-colors">
                          <Sparkles className="w-3 h-3 text-amber-600" /> Click to Extract
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer indicator showing 3 items visible with smooth scroll for additional variants */}
            {displayDevices.length > 3 && (
              <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-200/90 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                <span>Showing 3 visible of {displayDevices.length} variants</span>
                <span className="flex items-center gap-1 text-[#D97706] font-bold">
                  Scroll for more <ChevronDown className="w-3 h-3 text-[#D97706]" />
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

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
  const deviceA = useMemo(() => getDeviceByIdOrName(phoneA), [phoneA]);
  const deviceB = useMemo(() => getDeviceByIdOrName(phoneB), [phoneB]);

  const handleSwap = () => {
    if (!isDualMode) return;
    const temp = phoneA;
    setPhoneA(phoneB);
    setPhoneB(temp);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_12px_32px_-4px_rgba(15,23,42,0.06),0_4px_12px_-2px_rgba(15,23,42,0.03)] p-6 sm:p-7 space-y-6">
      {/* Top Header: Comparison Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/90">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
            Hardware Telemetry & Testing Setup
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Select test devices, target gaming workload & hardware quality thresholds
          </p>
        </div>

        {/* Dual vs Single Mode Buttons */}
        <div className="flex items-center p-1 bg-[#F1F5F9] border border-slate-200 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsDualMode(true)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              isDualMode
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Compare 2 Phones (A vs B)
          </button>
          <button
            type="button"
            onClick={() => setIsDualMode(false)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              !isDualMode
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Inspect Single Phone
          </button>
        </div>
      </div>

      {/* Device Selectors Row */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
        <SearchableDeviceSelector
          label="Primary Smartphone (Slot A)"
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
              className="p-3 rounded-xl bg-[#F1F5F9] hover:bg-slate-200/80 border border-slate-200 text-slate-700 hover:text-slate-900 transition-all shadow-2xs cursor-pointer"
              title="Swap Slot A and Slot B"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {isDualMode && (
          <SearchableDeviceSelector
            label="Secondary Smartphone (Slot B)"
            selectedDevice={deviceB}
            onSelect={setPhoneB}
            otherSelectedId={phoneA}
            slot="B"
          />
        )}
      </div>

      {/* Game Selection Row */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider">
            Gaming Workload Target
          </label>
          <span className="text-[11px] text-slate-500 font-semibold">
            Simulates sustained 3D load, shader pipelines & heat generation
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {GAME_OPTIONS.map((game) => {
            const isSelected = selectedGame === game.key;
            return (
              <button
                key={game.key}
                type="button"
                onClick={() => setSelectedGame(game.key)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-50/80 border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
                    : 'bg-[#F1F5F9] border-slate-200 hover:border-slate-300 hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{game.emoji}</span>
                  <span className="font-extrabold text-xs text-slate-900">{game.label}</span>
                </div>
                <p className="text-[11px] text-slate-500 font-semibold mt-1">
                  {game.subtitle}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Hardware Telemetry Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200/90">
        {/* Storage Tier Filter */}
        <div className="space-y-1.5">
          <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-slate-500" /> Minimum Storage Speed
          </label>
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {STORAGE_TIERS.map((tier) => (
              <button
                key={tier}
                type="button"
                onClick={() => setStorageTier(tier)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                  storageTier === tier
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-[#F1F5F9] text-slate-700 border-slate-200 hover:bg-slate-200/80'
                }`}
              >
                {tier}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-slate-500 font-medium">Hides devices with slower flash memory tiers</p>
        </div>

        {/* Max Temperature Ceiling */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label className="text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Thermometer className="w-3.5 h-3.5 text-slate-500" /> Thermal Throttling Ceiling
            </label>
            <span className="font-mono font-bold text-slate-900 tabular-nums">
              {maxTemp >= 48 ? 'No Thermal Limit' : `Max ${maxTemp}°C`}
            </span>
          </div>
          <input
            type="range"
            min={40}
            max={48}
            step={0.5}
            value={maxTemp}
            onChange={(e) => setMaxTemp(parseFloat(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer"
          />
          <p className="text-[10px] text-slate-500 font-medium">Hides phones that exceed this temperature under load</p>
        </div>

        {/* Eye Safety PWM Dimming */}
        <div className="space-y-1.5">
          <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-slate-500" /> Display Flicker Safety (PWM)
          </label>
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {PWM_FILTERS.map((f) => (
              <button
                key={f.label}
                type="button"
                onClick={() => setPwmFilter(f.minHz)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                  pwmFilter === f.minHz
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-[#F1F5F9] text-slate-700 border-slate-200 hover:bg-slate-200/80'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-slate-500 font-medium">Higher Hz reduces eye strain and headaches in dim lighting</p>
        </div>
      </div>
    </div>
  );
}
