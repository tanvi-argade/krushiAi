import React from 'react';
import { Sprout, Sun, Moon, Home, Bug, Droplets, TrendingUp, Search } from 'lucide-react';
import { useTheme } from '../../theme/ThemeContext';

const Navbar = ({ activeTab, onNavigate }) => {
  const { darkMode, toggleTheme } = useTheme();

  const navItems = [
    { id: 'Home', icon: Home, label: 'Home' },
    { id: 'Crop', icon: Sprout, label: 'Crop' },
    { id: 'Pest', icon: Bug, label: 'Pest' },
    { id: 'Water', icon: Droplets, label: 'Water' },
    { id: 'Market', icon: TrendingUp, label: 'Market' },
  ];

  return (
    <nav className="hidden md:flex items-center justify-between px-8 py-4 sticky top-0 z-50 bg-white/80 dark:bg-dark-card/80 backdrop-blur-lg border-b border-nature-fog dark:border-white/5">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('Home')}>
        <div className="bg-nature-leaf p-2 rounded-xl text-white">
          <Sprout size={24} />
        </div>
        <span className="text-xl font-bold text-nature-leaf dark:text-nature-sky">KrushiAI</span>
      </div>

      <div className="flex items-center gap-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200
              ${activeTab === item.id
                ? 'bg-nature-leaf text-white shadow-lg shadow-nature-leaf/20'
                : 'text-nature-soil/60 dark:text-dark-text/60 hover:bg-nature-leaf/5 hover:text-nature-leaf dark:hover:text-nature-sky'}
            `}
          >
            <item.icon size={18} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </div>

      <button
        onClick={toggleTheme}
        className="p-3 rounded-xl bg-nature-fog/50 dark:bg-white/5 text-nature-soil dark:text-nature-sky hover:scale-110 transition-transform active:scale-95"
      >
        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>
    </nav>
  );
};

export default Navbar;
