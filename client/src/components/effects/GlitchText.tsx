import React from 'react';
import { motion } from 'framer-motion';

interface GlitchTextProps {
  text: string;
  className?: string;
  as?: React.ElementType;
}

export function GlitchText({ text, className = '', as: Component = 'span' }: GlitchTextProps) {
  return (
    <Component className={`relative inline-block ${className}`}>
      <span className="relative z-10">{text}</span>
      <motion.span 
        className="absolute top-0 left-[2px] -z-10 text-secondary opacity-70"
        animate={{
          x: [0, -2, 2, -1, 0],
          y: [0, 1, -1, 2, 0],
        }}
        transition={{
          duration: 0.2,
          repeat: Infinity,
          repeatType: "reverse",
          repeatDelay: Math.random() * 5 + 2
        }}
        aria-hidden="true"
      >
        {text}
      </motion.span>
      <motion.span 
        className="absolute top-0 left-[-2px] -z-10 text-destructive opacity-70"
        animate={{
          x: [0, 2, -2, 1, 0],
          y: [0, -1, 1, -2, 0],
        }}
        transition={{
          duration: 0.2,
          repeat: Infinity,
          repeatType: "reverse",
          repeatDelay: Math.random() * 5 + 2.5
        }}
        aria-hidden="true"
      >
        {text}
      </motion.span>
    </Component>
  );
}
