import React from 'react';
import Navbar from './Navbar';
import BottomNav from './BottomNav';
import { useTheme } from '../../theme/ThemeContext';
import { Sun, Moon } from 'lucide-react';

const Layout = ({ children, activeTab, onNavigate }) => {
  const { darkMode, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen animated-bg flex flex-col pb-24 md:pb-0">
      <Navbar activeTab={activeTab} onNavigate={onNavigate} />
      
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between px-6 py-6 sticky top-0 z-40 bg-nature-earth/80 dark:bg-dark-bg/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="bg-nature-leaf p-2 rounded-xl text-white">
            <span className="font-bold text-lg">K</span>
          </div>
          <span className="text-xl font-bold text-nature-leaf dark:text-nature-sky">KrushiAI</span>
        </div>
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-nature-fog/50 dark:bg-white/5 text-nature-soil dark:text-nature-sky active:scale-95 transition-transform"
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10 overflow-x-hidden">
        {children}
      </main>

      <BottomNav activeTab={activeTab} onNavigate={onNavigate} />
    </div>
  );
};

export default Layout;
