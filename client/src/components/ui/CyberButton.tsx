import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface CyberButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  children?: React.ReactNode;
}

export const CyberButton = React.forwardRef<HTMLButtonElement, CyberButtonProps>(
  ({ children, variant = 'primary', size = 'md', className = '', isLoading, disabled, ...props }, ref) => {
    
    const baseClasses = "relative font-mono font-bold uppercase tracking-wider transition-all duration-200 flex items-center justify-center overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed group";
    
    const variants = {
      primary: "bg-primary/20 text-primary border border-primary hover:bg-primary/40 hover:shadow-[0_0_15px_rgba(0,255,65,0.6)]",
      secondary: "bg-secondary/20 text-secondary border border-secondary hover:bg-secondary/40 hover:shadow-[0_0_15px_rgba(0,184,255,0.6)]",
      destructive: "bg-destructive/20 text-destructive border border-destructive hover:bg-destructive/40 hover:shadow-[0_0_15px_rgba(255,0,60,0.6)]",
      outline: "bg-transparent text-primary border border-primary/50 hover:border-primary hover:bg-primary/10",
      ghost: "bg-transparent text-muted-foreground hover:text-primary hover:bg-primary/10 border border-transparent hover:border-primary/30"
    };

    const sizes = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-5 py-2 text-sm",
      lg: "px-8 py-3 text-base",
      icon: "w-10 h-10 p-2"
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
        className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        <span className="absolute inset-0 w-full h-full -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent z-0"></span>
        
        {/* Cyberpunk corner cuts via pseudo elements */}
        <span className="absolute top-0 left-0 w-2 h-[1px] bg-current"></span>
        <span className="absolute top-0 left-0 w-[1px] h-2 bg-current"></span>
        <span className="absolute bottom-0 right-0 w-2 h-[1px] bg-current"></span>
        <span className="absolute bottom-0 right-0 w-[1px] h-2 bg-current"></span>

        <span className="relative z-10 flex items-center gap-2">
          {isLoading ? (
            <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
          ) : null}
          {children}
        </span>
      </motion.button>
    );
  }
);
CyberButton.displayName = 'CyberButton';
