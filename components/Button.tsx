import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  icon,
  ...props 
}) => {
  const baseStyles = "relative group flex items-center justify-center gap-2 px-6 py-3 font-mono text-sm uppercase tracking-wider transition-all duration-300 border focus:outline-none focus:ring-1 focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden";
  
  const variants = {
    primary: "bg-white text-black border-white hover:bg-black hover:text-white hover:border-white",
    secondary: "bg-transparent text-white border-zinc-700 hover:border-white hover:bg-zinc-900",
    danger: "bg-transparent text-red-500 border-red-900 hover:border-red-500 hover:bg-red-950/30"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`} 
      {...props}
    >
      {/* Hover Glitch Effect Overlay */}
      <span className="absolute inset-0 w-full h-full bg-white/10 -translate-x-full group-hover:translate-x-full transition-transform duration-500 ease-out skew-x-12" />
      
      {icon && <span className="relative z-10">{icon}</span>}
      <span className="relative z-10">{children}</span>
    </button>
  );
};