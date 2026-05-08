import React from 'react';
import { motion } from 'framer-motion';

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, type = 'button', icon: Icon }) => {
  const baseStyles = 'flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 min-h-[48px]';
  
  const variants = {
    primary: 'bg-nature-leaf text-white shadow-lg shadow-nature-leaf/20 hover:bg-nature-leaf/90',
    secondary: 'bg-nature-wheat text-nature-soil shadow-lg shadow-nature-wheat/20 hover:bg-nature-wheat/90',
    outline: 'border-2 border-nature-leaf text-nature-leaf hover:bg-nature-leaf/5 dark:text-nature-sky dark:border-nature-sky',
    ghost: 'text-nature-leaf hover:bg-nature-leaf/10 dark:text-nature-sky',
    danger: 'bg-red-500 text-white hover:bg-red-600',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {Icon && <Icon size={20} />}
      {children}
    </motion.button>
  );
};

export default Button;
