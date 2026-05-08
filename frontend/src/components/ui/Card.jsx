import React from 'react';
import { motion } from 'framer-motion';

const Card = ({ children, className = '', animate = true }) => {
  const content = (
    <div className={`premium-card p-6 ${className}`}>
      {children}
    </div>
  );

  if (!animate) return content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {content}
    </motion.div>
  );
};

export default Card;
