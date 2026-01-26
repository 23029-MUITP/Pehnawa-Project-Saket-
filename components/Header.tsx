import React from 'react';

export const Header: React.FC<{ theme?: 'dark' | 'light' | 'ethnic' }> = ({ theme = 'light' }) => {
  const isEthnic = theme === 'ethnic';
  
  return (
    <header className={`py-12 md:py-20 text-center transition-colors duration-700 ${isEthnic ? 'text-ethnic-accent' : 'text-black'}`}>
      <h1 className={`text-6xl md:text-8xl font-serif font-bold tracking-tighter transition-all duration-700 ${isEthnic ? 'italic' : ''}`}>
        Pehanawa
      </h1>
      <div className={`h-px w-12 mx-auto mt-6 transition-colors duration-700 ${isEthnic ? 'bg-ethnic-accent/30' : 'bg-black/20'}`}></div>
      <p className={`text-xs uppercase tracking-[0.2em] mt-4 font-sans font-medium transition-colors duration-700 ${isEthnic ? 'text-ethnic-accent/60' : 'text-gray-400'}`}>
        Virtual Atelier
      </p>
    </header>
  );
};