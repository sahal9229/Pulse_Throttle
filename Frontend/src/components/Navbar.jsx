import { motion, AnimatePresence } from 'framer-motion';
import { Zap, BarChart3, Trophy, Github, Sun, Moon } from 'lucide-react';
import { AnimatedBackground } from './motion/index.js';

const navItems = [
  { id: 'dashboard', label: 'Hardware Telemetry', icon: BarChart3 },
  { id: 'leaderboard', label: 'Database & Leaderboard', icon: Trophy },
];

export default function Navbar({ activeTab, setActiveTab, isDark, toggleTheme }) {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="sticky top-0 z-50 bg-[#08090E]/95 backdrop-blur-xl border-b border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.5)] text-white"
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

          {/* Navigation Tabs with AnimatedBackground from motion-primitives */}
          <div className="flex items-center p-1 bg-white/[0.08] border border-white/10 rounded-xl">
            <AnimatedBackground
              defaultValue={activeTab}
              className="btn-gradient-marigold rounded-lg shadow-md"
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 32,
              }}
              onValueChange={(id) => {
                if (id) setActiveTab(id);
              }}
            >
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    data-id={item.id}
                    type="button"
                    className={`relative px-4 py-2 rounded-lg text-xs font-bold transition-colors duration-200 flex items-center gap-2 cursor-pointer ${
                      isActive
                        ? 'text-white'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="hidden sm:inline font-bold">{item.label}</span>
                  </button>
                );
              })}
            </AnimatedBackground>
          </div>

          {/* Right Status / Links */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/12">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
              <span className="text-emerald-400 text-xs font-mono font-bold tracking-tight">
                ● Lab Engine Active
              </span>
            </div>

            {/* Dark / Light Mode Switch */}
            <motion.button
              type="button"
              onClick={toggleTheme}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.16] border border-white/10 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer relative"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              <AnimatePresence mode="wait" initial={false}>
                {isDark ? (
                  <motion.div
                    key="sun"
                    initial={{ rotate: -90, opacity: 0, scale: 0.7 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: 90, opacity: 0, scale: 0.7 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Sun className="w-4 h-4 text-amber-400" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="moon"
                    initial={{ rotate: 90, opacity: 0, scale: 0.7 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: -90, opacity: 0, scale: 0.7 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Moon className="w-4 h-4 text-amber-300" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

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
