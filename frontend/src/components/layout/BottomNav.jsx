import React from 'react';
import { Home, Bug, Droplets, TrendingUp, Sprout } from 'lucide-react';
import { motion } from 'framer-motion';

const BottomNav = ({ activeTab, onNavigate }) => {
  const navItems = [
    { id: 'Home', icon: Home, label: 'Home' },
    { id: 'Crop', icon: Sprout, label: 'Crop' },
    { id: 'Pest', icon: Bug, label: 'Pest' },
    { id: 'Water', icon: Droplets, label: 'Water' },
    { id: 'Market', icon: TrendingUp, label: 'Market' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-nav px-6 py-3 pb-8 shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
      <div className="flex items-center justify-between">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="relative flex flex-col items-center gap-1 min-w-[64px]"
            >
              <div className={`
                p-2 rounded-2xl transition-all duration-300
                ${isActive ? 'text-nature-leaf dark:text-nature-sky' : 'text-nature-soil/40 dark:text-dark-text/40'}
              `}>
                <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`
                text-[10px] font-bold uppercase tracking-wider transition-all duration-300
                ${isActive ? 'text-nature-leaf dark:text-nature-sky opacity-100' : 'text-nature-soil/40 dark:text-dark-text/40 opacity-70'}
              `}>
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-1 w-1 h-1 rounded-full bg-nature-leaf dark:bg-nature-sky"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
