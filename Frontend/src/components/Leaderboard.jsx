import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Trophy,
  ArrowUp,
  ArrowDown,
  Thermometer,
  ChevronRight,
  Flame,
  BookOpen,
  X,
  Smartphone,
  Cpu,
  Layers,
  Sparkles,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { BRANDS, getAllDevices, subscribeCatalog, clearLeaderboard, restoreDefaultCatalog } from '../data/deviceData.js';
import DeviceThumbnail from './DeviceThumbnail.jsx';
import { AnimatedBackground } from './motion/index.js';

const SORT_OPTIONS = [
  { key: 'pulse_throttle_index', label: 'PulseThrottle Index (High → Low)', asc: false },
  { key: 'antutu_v10_score', label: 'AnTuTu v10 Score (High → Low)', asc: false },
  { key: 'geekbench_6_multi', label: 'Geekbench 6 Multi-Core (High → Low)', asc: false },
  { key: 'wildlife_stability_pct', label: '3DMark Thermal Stability % (High → Low)', asc: false },
  { key: 'peak_temp_celsius', label: 'Coolest Peak Temp (Low → High °C)', asc: true },
  { key: 'device_name', label: 'Model Name (A → Z)', asc: true },
];

const PLATFORMS = [
  { id: 'All', label: 'All Platforms' },
  { id: 'iOS', label: '🍎 iPhone / iOS' },
  { id: 'Android', label: '🤖 Android' },
];

function getTempBadge(temp) {
  if (!temp) return <span className="text-slate-400 dark:text-slate-500 font-mono">N/A</span>;
  if (temp < 43.0) {
    return <span className="font-mono font-extrabold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-700/50">{temp}°C</span>;
  }
  if (temp <= 44.5) {
    return <span className="font-mono font-extrabold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-700/50">{temp}°C</span>;
  }
  return <span className="font-mono font-extrabold text-rose-800 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-rose-300 dark:border-rose-700/50">{temp}°C</span>;
}

export default function Leaderboard({ onSelectDevice }) {
  const [catalog, setCatalog] = useState(() => getAllDevices());
  const [activeCatalogMode, setActiveCatalogMode] = useState('all'); // 'past_searches' | 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState('All');
  const [brandFilter, setBrandFilter] = useState('All');
  const [sortKey, setSortKey] = useState('pulse_throttle_index');
  const [sortAsc, setSortAsc] = useState(false);

  // Subscribe to live catalog updates
  useEffect(() => {
    const unsub = subscribeCatalog((updated) => setCatalog([...updated]));
    return unsub;
  }, []);

  const handleHeaderSort = (key) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(key === 'peak_temp_celsius' || key === 'device_name');
    }
  };

  const handleSortOptionSelect = (option) => {
    setSortKey(option.key);
    setSortAsc(option.asc);
  };

  const filteredDevices = useMemo(() => {
    let list = [...catalog];

    // Mode Toggle: Past Searches Toppers vs Complete Hardware Database
    if (activeCatalogMode === 'past_searches') {
      list = list.filter((d) => Boolean(d.is_past_search));
    }

    // Platform Filter
    if (platformFilter !== 'All') {
      list = list.filter((d) => d.os === platformFilter);
    }

    // Brand Filter
    if (brandFilter !== 'All') {
      if (brandFilter === 'Poco/Xiaomi') {
        list = list.filter((d) => {
          const b = d.brand?.toLowerCase();
          return b === 'xiaomi' || b === 'poco';
        });
      } else {
        list = list.filter((d) => d.brand?.toLowerCase() === brandFilter.toLowerCase());
      }
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (d) =>
          d.device_name.toLowerCase().includes(q) ||
          d.soc_chipset.toLowerCase().includes(q) ||
          d.brand?.toLowerCase().includes(q)
      );
    }

    // Sort
    list.sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = (valB || '').toLowerCase();
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      valA = valA ?? (sortAsc ? 9999999 : -1);
      valB = valB ?? (sortAsc ? 9999999 : -1);
      return sortAsc ? valA - valB : valB - valA;
    });

    return list;
  }, [catalog, activeCatalogMode, platformFilter, brandFilter, searchQuery, sortKey, sortAsc]);

  const pastSearchesCount = useMemo(() => {
    return catalog.filter((d) => Boolean(d.is_past_search)).length;
  }, [catalog]);

  return (
    <div className="bg-white dark:bg-[#0E1118] rounded-2xl border border-slate-200/90 dark:border-white/[0.08] shadow-[0_4px_24px_-4px_rgba(15,23,42,0.04)] dark:shadow-[0_20px_45px_-10px_rgba(0,0,0,0.8)] p-6 sm:p-8 space-y-6">
      {/* Top Header & View Mode Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/[0.08]">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Trophy className="w-5 h-5 text-slate-800 dark:text-amber-400" />
            Hardware Benchmark Leaderboard
          </h2>
        </div>

        <div className="flex items-center flex-wrap gap-2 self-start sm:self-auto">
          {/* Toggle Mode: Past Searches vs Complete Database with AnimatedBackground */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-[#0B0D14] border border-slate-200/50 dark:border-white/[0.08] rounded-xl">
            <AnimatedBackground
              defaultValue={activeCatalogMode}
              className="bg-white dark:bg-[#1E2538] rounded-lg shadow-sm border border-transparent dark:border-white/10"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              onValueChange={(id) => {
                if (id) setActiveCatalogMode(id);
              }}
            >
              <button
                data-id="past_searches"
                type="button"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeCatalogMode === 'past_searches'
                    ? 'text-slate-900 dark:text-white font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>Top Searches</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-mono">
                  {pastSearchesCount}
                </span>
              </button>
              <button
                data-id="all"
                type="button"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeCatalogMode === 'all'
                    ? 'text-slate-900 dark:text-white font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                <span>Complete Database</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-mono">
                  {catalog.length}
                </span>
              </button>
            </AnimatedBackground>
          </div>

          {/* Action Buttons: Clear & Restore */}
          {catalog.length > 0 ? (
            <button
              type="button"
              onClick={clearLeaderboard}
              title="Clean all data from leaderboard"
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-slate-200 dark:border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clean Leaderboard</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={restoreDefaultCatalog}
              title="Restore default catalog"
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white bg-slate-100 dark:bg-[#0B0D14] hover:bg-slate-200 dark:hover:bg-[#141824] border border-slate-200 dark:border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Catalog</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="space-y-4">
        {/* Row 1: Search Input & Sort Dropdown */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search phone name, chipset, or GPU architecture..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F1F5F9] dark:bg-[#0B0D14] border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-9 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-[#0E1118] focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 outline-none transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Sort By:</span>
            <select
              value={SORT_OPTIONS.find((o) => o.key === sortKey && o.asc === sortAsc)?.label || ''}
              onChange={(e) => {
                const opt = SORT_OPTIONS.find((o) => o.label === e.target.value);
                if (opt) handleSortOptionSelect(opt);
              }}
              className="bg-[#F1F5F9] dark:bg-[#0B0D14] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none shadow-sm cursor-pointer focus:border-amber-500 focus:bg-white dark:focus:bg-[#0E1118]"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.label} value={opt.label} className="bg-white dark:bg-[#0E1118] text-slate-900 dark:text-white">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Platform Pills & Brand Pills with AnimatedBackground */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Platform Pills */}
          <div className="flex items-center p-0.5 bg-slate-100 dark:bg-[#0B0D14] border border-slate-200/50 dark:border-white/[0.08] rounded-lg">
            <AnimatedBackground
              defaultValue={platformFilter}
              className="bg-slate-900 dark:bg-amber-500 rounded-md shadow-2xs"
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              onValueChange={(id) => {
                if (id) setPlatformFilter(id);
              }}
            >
              {PLATFORMS.map((p) => {
                const isSelected = platformFilter === p.id;
                return (
                  <button
                    key={p.id}
                    data-id={p.id}
                    type="button"
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      isSelected
                        ? 'text-white dark:text-slate-950 font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </AnimatedBackground>
          </div>

          {/* Brand Pills */}
          <div className="flex items-center p-0.5 bg-slate-100 dark:bg-[#0B0D14] border border-slate-200/50 dark:border-white/[0.08] rounded-lg overflow-x-auto no-scrollbar">
            <AnimatedBackground
              defaultValue={brandFilter}
              className="bg-slate-900 dark:bg-amber-500 rounded-md shadow-2xs"
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              onValueChange={(id) => {
                if (id) setBrandFilter(id);
              }}
            >
              {BRANDS.map((brand) => {
                const isSelected = brandFilter === brand;
                return (
                  <button
                    key={brand}
                    data-id={brand}
                    type="button"
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      isSelected
                        ? 'text-white dark:text-slate-950 font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {brand === 'All' ? 'All Brands' : brand}
                  </button>
                );
              })}
            </AnimatedBackground>
          </div>
        </div>
      </div>

      {/* Leaderboard Table with Clickable Sorting Headers */}
      <div className="border border-slate-200/90 dark:border-white/[0.08] rounded-2xl overflow-hidden bg-white dark:bg-[#0E1118] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#F1F5F9] dark:bg-[#0B0D14] border-b border-slate-200/90 dark:border-white/[0.08] text-slate-500 dark:text-slate-400 font-extrabold uppercase text-[11px] tracking-wider select-none">
              <tr>
                <th className="py-3.5 px-4 w-16 text-center">Rank</th>
                <th
                  onClick={() => handleHeaderSort('device_name')}
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Smartphone Model</span>
                    {sortKey === 'device_name' && (
                      <span className="text-[#D97706] dark:text-amber-400">{sortAsc ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleHeaderSort('pulse_throttle_index')}
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>PulseThrottle Index (0–100)</span>
                    {sortKey === 'pulse_throttle_index' && (
                      <span className="text-[#D97706] dark:text-amber-400">{sortAsc ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleHeaderSort('antutu_v10_score')}
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors hidden md:table-cell"
                >
                  <div className="flex items-center gap-1">
                    <span>AnTuTu v10 Total</span>
                    {sortKey === 'antutu_v10_score' && (
                      <span className="text-[#D97706] dark:text-amber-400">{sortAsc ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleHeaderSort('geekbench_6_multi')}
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors hidden lg:table-cell"
                >
                  <div className="flex items-center gap-1">
                    <span>GB6 Multi-Core</span>
                    {sortKey === 'geekbench_6_multi' && (
                      <span className="text-[#D97706] dark:text-amber-400">{sortAsc ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleHeaderSort('wildlife_stability_pct')}
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors hidden sm:table-cell"
                >
                  <div className="flex items-center gap-1">
                    <span>3DMark Loop Stability</span>
                    {sortKey === 'wildlife_stability_pct' && (
                      <span className="text-[#D97706] dark:text-amber-400">{sortAsc ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleHeaderSort('peak_temp_celsius')}
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Peak Temp (°C)</span>
                    {sortKey === 'peak_temp_celsius' && (
                      <span className="text-[#D97706] dark:text-amber-400">{sortAsc ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="py-3.5 px-4 text-right">Inspect</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
              {filteredDevices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-[#0B0D14] flex items-center justify-center mx-auto mb-3">
                      <Sparkles className="w-5 h-5 text-slate-400 dark:text-slate-400" />
                    </div>
                    <p className="text-slate-800 dark:text-white font-extrabold text-sm">
                      {catalog.length === 0 ? 'Leaderboard is Clean & Empty' : 'No smartphones match the current filters or search query.'}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-1 max-w-md mx-auto">
                      {catalog.length === 0
                        ? 'All database and cached benchmark records have been cleared. Run an analysis on the Hardware Telemetry tab to benchmark devices and populate the leaderboard.'
                        : 'Try clearing your search term, resetting brand filters, or switching to the Full Phone Database.'}
                    </p>
                    {catalog.length === 0 && (
                      <button
                        type="button"
                        onClick={restoreDefaultCatalog}
                        className="mt-4 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-amber-400 transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restore Default Benchmarks</span>
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredDevices.map((device, index) => {
                  const rank = index + 1;
                  return (
                    <tr
                      key={device.id}
                      onClick={() => onSelectDevice(device.id)}
                      className="hover:bg-amber-50/40 dark:hover:bg-white/[0.03] transition-colors cursor-pointer group"
                    >
                      {/* Rank Column */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block w-7 h-7 leading-7 rounded-lg text-xs font-black font-mono tabular-nums ${
                            rank === 1
                              ? 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white shadow-sm font-black'
                              : rank === 2
                              ? 'bg-slate-200 dark:bg-slate-700/80 text-slate-900 dark:text-slate-200 border dark:border-white/10'
                              : rank === 3
                              ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border dark:border-amber-600/30'
                              : 'bg-slate-100 dark:bg-[#141824] text-slate-600 dark:text-slate-400 border dark:border-white/[0.06]'
                          }`}
                        >
                          {rank}
                        </span>
                      </td>

                      {/* Smartphone Model & Image Thumbnail */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-[#141824] border border-slate-200/90 dark:border-white/10 flex-shrink-0 flex items-center justify-center shadow-2xs">
                            <DeviceThumbnail
                              src={device.image_url}
                              alt={device.device_name}
                              brand={device.brand}
                              iconSize="w-5 h-5"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-slate-900 dark:text-white group-hover:text-[#D97706] dark:group-hover:text-amber-400 transition-colors truncate">
                                {device.device_name}
                              </span>
                              {device.is_past_search && (
                                <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-700/50 px-1.5 py-0.2 rounded flex-shrink-0">
                                  Synced Run
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400 block truncate font-medium">
                              {device.soc_chipset}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* PulseThrottle Index */}
                      <td className="py-3 px-4">
                        <div className="flex items-baseline gap-1">
                          <span className="font-mono font-extrabold text-sm sm:text-base text-slate-900 dark:text-white tabular-nums">
                            {device.pulse_throttle_index}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">/100</span>
                        </div>
                      </td>

                      {/* AnTuTu v10 */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums hidden md:table-cell">
                        {device.antutu_v10_score ? device.antutu_v10_score.toLocaleString() : 'N/A'}
                      </td>

                      {/* Geekbench 6 Multi */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums hidden lg:table-cell">
                        {device.geekbench_6_multi ? device.geekbench_6_multi.toLocaleString() : 'N/A'}
                      </td>

                      {/* 3DMark Stability */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums hidden sm:table-cell">
                        {device.wildlife_stability_pct ? `${device.wildlife_stability_pct}%` : 'N/A'}
                      </td>

                      {/* Peak Temp */}
                      <td className="py-3 px-4">
                        {getTempBadge(device.peak_temp_celsius)}
                      </td>

                      {/* Action Button */}
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#F1F5F9] dark:bg-[#141824] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 group-hover:bg-gradient-to-r group-hover:from-[#F59E0B] group-hover:to-[#D97706] group-hover:text-white group-hover:border-transparent transition-all shadow-sm cursor-pointer"
                        >
                          Compare →
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
