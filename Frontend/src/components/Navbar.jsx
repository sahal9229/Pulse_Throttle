import { motion } from 'framer-motion';
import { Zap, BarChart3, Trophy, Github, Cpu, Database } from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Hardware Telemetry', icon: BarChart3 },
  { id: 'leaderboard', label: 'Database & Leaderboard', icon: Trophy },
];

export default function Navbar({ activeTab, setActiveTab }) {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="sticky top-0 z-50 bg-[#140C22] border-b border-white/10 shadow-lg text-white"
    >
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <motion.div
            className="flex items-center gap-3 cursor-pointer select-none"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab('dashboard')}
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F59E0B] to-[#D97706] flex items-center justify-center shadow-md">
                <Zap className="w-5 h-5 text-white" strokeWidth={2.8} />
              </div>
              <motion.div
                className="absolute inset-0 rounded-xl bg-amber-500/25"
                animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
            <div className="flex flex-col">
              <span className="text-[#FFFFFF] font-extrabold text-lg leading-tight tracking-tight">
                Pulse<span className="text-[#F59E0B]">Throttle</span>
              </span>
              <span className="text-slate-400 text-[10px] font-mono tracking-wider uppercase font-semibold leading-none">
                Hardware Telemetry Lab
              </span>
            </div>
          </motion.div>

          {/* Navigation Tabs with High-Contrast Marigold-Orange Active Pill */}
          <div className="flex items-center gap-1.5 p-1 bg-white/[0.08] border border-white/10 rounded-xl">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <motion.button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-2 ${
                    isActive
                      ? 'btn-gradient-marigold text-white shadow-md'
                      : 'text-slate-300 hover:text-white hover:bg-white/[0.08]'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="hidden sm:inline font-bold">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeNavPill"
                      className="w-1.5 h-1.5 rounded-full bg-white ml-1"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Right Status / Links */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/12">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
              <span className="text-emerald-400 text-xs font-mono font-bold tracking-tight">
                ● Lab Engine Active
              </span>
            </div>
            <motion.a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.16] border border-white/10 text-slate-300 hover:text-white transition-colors"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              title="PulseThrottle Engine"
            >
              <Github className="w-4 h-4" />
            </motion.a>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
