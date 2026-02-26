import React from 'react';

interface CyberInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  wrapperClassName?: string;
}

export const CyberInput = React.forwardRef<HTMLInputElement, CyberInputProps>(
  ({ label, error, className = '', wrapperClassName = '', ...props }, ref) => {
    return (
      <div className={`flex flex-col gap-1.5 ${wrapperClassName}`}>
        {label && (
          <label className="text-xs font-mono text-primary/80 uppercase tracking-widest">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            className={`
              w-full bg-background border border-border text-foreground 
              px-4 py-2 font-mono text-sm
              focus:outline-none focus:border-primary focus:shadow-[0_0_10px_rgba(0,255,65,0.2)]
              placeholder:text-muted-foreground/50
              transition-all duration-300
              ${error ? 'border-destructive focus:border-destructive focus:shadow-[0_0_10px_rgba(255,0,60,0.2)]' : ''}
              ${className}
            `}
            {...props}
          />
          {/* Subtle tech accent */}
          <div className={`absolute right-0 bottom-0 w-2 h-2 ${error ? 'bg-destructive' : 'bg-primary'} opacity-50`}></div>
        </div>
        {error && (
          <span className="text-xs font-mono text-destructive animate-pulse">
            ERR: {error}
          </span>
        )}
      </div>
    );
  }
);
CyberInput.displayName = 'CyberInput';
