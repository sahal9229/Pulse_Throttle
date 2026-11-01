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
} from 'lucide-react';
import { BRANDS, getAllDevices, subscribeCatalog } from '../data/deviceData.js';
import DeviceThumbnail from './DeviceThumbnail.jsx';

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
  if (!temp) return <span className="text-slate-500 font-mono">N/A</span>;
  if (temp < 43.0) {
    return <span className="font-mono font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">{temp}°C</span>;
  }
  if (temp <= 44.5) {
    return <span className="font-mono font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">{temp}°C</span>;
  }
  return <span className="font-mono font-extrabold text-rose-800 bg-rose-100 px-2 py-0.5 rounded border border-rose-300">{temp}°C</span>;
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
      list = list.filter((d) => d.brand?.toLowerCase() === brandFilter.toLowerCase());
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
    <div className="tactile-card p-6 sm:p-7 space-y-6">
      {/* Top Header & View Mode Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" />
            Hardware Benchmark Leaderboard
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-semibold mt-1">
            Precision sustained performance rankings, thermal retention & efficiency metrics
          </p>
        </div>

        {/* Toggle Mode: Past Searches Toppers vs Complete Hardware Database */}
        <div className="flex items-center p-1 bg-slate-100 border border-slate-300 rounded-xl self-start sm:self-auto shadow-inner">
          <button
            type="button"
            onClick={() => setActiveCatalogMode('past_searches')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeCatalogMode === 'past_searches'
                ? 'bg-amber-500 text-white shadow-md font-extrabold'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>🔥 Past Searches Toppers</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/25">
              {pastSearchesCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveCatalogMode('all')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeCatalogMode === 'all'
                ? 'bg-slate-900 text-white shadow-md font-extrabold'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>📚 Complete Hardware Database</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
              {catalog.length}
            </span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="space-y-4">
        {/* Row 1: Search Input & Sort Dropdown */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search phone name, chipset, or GPU architecture..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-9 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 placeholder-slate-400 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 whitespace-nowrap">Sort By:</span>
            <select
              value={SORT_OPTIONS.find((o) => o.key === sortKey && o.asc === sortAsc)?.label || ''}
              onChange={(e) => {
                const opt = SORT_OPTIONS.find((o) => o.label === e.target.value);
                if (opt) handleSortOptionSelect(opt);
              }}
              className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none shadow-sm cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.label} value={opt.label}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Platform Pills & Brand Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {/* Platform Pills */}
          <div className="flex items-center gap-1.5">
            {PLATFORMS.map((p) => {
              const isSelected = platformFilter === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlatformFilter(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Brand Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {BRANDS.map((brand) => {
              const isSelected = brandFilter === brand;
              return (
                <button
                  key={brand}
                  type="button"
                  onClick={() => setBrandFilter(brand)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${
                    isSelected
                      ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {brand === 'All' ? 'All Brands' : brand}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Leaderboard Table with Clickable Sorting Headers */}
      <div className="border border-slate-300 rounded-2xl overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-extrabold uppercase text-[11px] tracking-wider select-none">
              <tr>
                <th className="py-3.5 px-4 w-16 text-center">Rank</th>
                <th
                  onClick={() => handleHeaderSort('device_name')}
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-900 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Smartphone Model</span>
                    {sortKey === 'device_name' && (
                      <span>{sortAsc ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleHeaderSort('pulse_throttle_index')}
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-900 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>PulseThrottle Index</span>
                    {sortKey === 'pulse_throttle_index' && (
                      <span>{sortAsc ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleHeaderSort('antutu_v10_score')}
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-900 transition-colors hidden md:table-cell"
                >
                  <div className="flex items-center gap-1">
                    <span>AnTuTu v10</span>
                    {sortKey === 'antutu_v10_score' && (
                      <span>{sortAsc ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleHeaderSort('geekbench_6_multi')}
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-900 transition-colors hidden lg:table-cell"
                >
                  <div className="flex items-center gap-1">
                    <span>GB6 Multi</span>
                    {sortKey === 'geekbench_6_multi' && (
                      <span>{sortAsc ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleHeaderSort('wildlife_stability_pct')}
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-900 transition-colors hidden sm:table-cell"
                >
                  <div className="flex items-center gap-1">
                    <span>3DMark Stability</span>
                    {sortKey === 'wildlife_stability_pct' && (
                      <span>{sortAsc ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleHeaderSort('peak_temp_celsius')}
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-900 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Peak Temp</span>
                    {sortKey === 'peak_temp_celsius' && (
                      <span>{sortAsc ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="py-3.5 px-4 text-right">Inspect</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {filteredDevices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 font-bold">
                    No smartphones match the active criteria.
                  </td>
                </tr>
              ) : (
                filteredDevices.map((device, index) => {
                  const rank = index + 1;
                  return (
                    <tr
                      key={device.id}
                      onClick={() => onSelectDevice(device.id)}
                      className="hover:bg-amber-50/60 transition-colors cursor-pointer group"
                    >
                      {/* Rank Column */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block w-7 h-7 leading-7 rounded-lg text-xs font-black font-mono ${
                            rank === 1
                              ? 'bg-amber-500 text-white shadow-sm'
                              : rank === 2
                              ? 'bg-slate-300 text-slate-900'
                              : rank === 3
                              ? 'bg-amber-200 text-amber-900'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {rank}
                        </span>
                      </td>

                      {/* Smartphone Model & Image Thumbnail */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center">
                            <DeviceThumbnail
                              src={device.image_url}
                              alt={device.device_name}
                              brand={device.brand}
                              iconSize="w-5 h-5"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-slate-900 group-hover:text-amber-700 transition-colors truncate">
                                {device.device_name}
                              </span>
                              {device.is_past_search && (
                                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-300 flex-shrink-0">
                                  Past Search
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-600 block truncate font-medium">
                              {device.soc_chipset}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* PulseThrottle Index */}
                      <td className="py-3 px-4">
                        <div className="flex items-baseline gap-1">
                          <span className="font-mono font-black text-sm sm:text-base text-slate-900">
                            {device.pulse_throttle_index}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500">/100</span>
                        </div>
                      </td>

                      {/* AnTuTu v10 */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-800 hidden md:table-cell">
                        {device.antutu_v10_score ? device.antutu_v10_score.toLocaleString() : 'N/A'}
                      </td>

                      {/* Geekbench 6 Multi */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-800 hidden lg:table-cell">
                        {device.geekbench_6_multi ? device.geekbench_6_multi.toLocaleString() : 'N/A'}
                      </td>

                      {/* 3DMark Stability */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-800 hidden sm:table-cell">
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
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 group-hover:bg-amber-500 group-hover:text-white text-slate-800 transition-all border border-slate-300 group-hover:border-amber-600 shadow-sm"
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
