import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  theme?: 'default' | 'ethnic';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  theme = 'default',
  isLoading, 
  className = '', 
  ...props 
}) => {
  const isEthnic = theme === 'ethnic';
  
  const baseStyles = "w-full py-5 text-lg font-serif transition-all duration-300 disabled:opacity-50 flex items-center justify-center relative overflow-hidden group tracking-wide";
  
  // Theme-based variants
  const variants = {
    default: {
      primary: "bg-black text-white hover:bg-gray-800",
      secondary: "bg-gray-100 text-black hover:bg-gray-200",
      outline: "bg-transparent border border-gray-300 text-black hover:border-black hover:bg-gray-50",
    },
    ethnic: {
      primary: "bg-ethnic-accent text-ethnic-bg hover:bg-stone-800",
      secondary: "bg-ethnic-accent/10 text-ethnic-accent hover:bg-ethnic-accent/20",
      outline: "bg-transparent border border-ethnic-accent/30 text-ethnic-accent hover:border-ethnic-accent hover:bg-ethnic-accent/5",
    }
  };

  const selectedVariant = variants[isEthnic ? 'ethnic' : 'default'][variant];

  return (
    <button 
      className={`${baseStyles} ${selectedVariant} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      <span className="relative z-10 flex items-center gap-3">
        {isLoading ? (
          <>
             <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="font-sans text-sm tracking-widest uppercase">Processing</span>
          </>
        ) : children}
      </span>
    </button>
  );
};