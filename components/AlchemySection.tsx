import React from 'react';
import { AlchemyInsight } from '../types';

interface AlchemySectionProps {
  insights: AlchemyInsight[];
  isVisible: boolean;
}

export const AlchemySection: React.FC<AlchemySectionProps> = ({ insights, isVisible }) => {
  if (!isVisible) return null;

  return (
    <section className="py-24 px-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row items-baseline justify-between mb-12 border-b border-white/10 pb-6">
        <h2 className="font-serif text-5xl md:text-6xl text-white">alchemy.</h2>
        <p className="text-gray-500 uppercase tracking-widest mt-4 md:mt-0">The science of your aesthetic</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {insights.map((insight, index) => (
          <div 
            key={index} 
            className="glass-panel p-8 min-h-[280px] flex flex-col justify-between hover:bg-white/5 transition-colors duration-500 group"
          >
            <div>
              <span className="text-xs font-bold text-gray-600 mb-4 block">0{index + 1}</span>
              <h3 className="font-serif text-2xl text-white mb-4 group-hover:translate-x-2 transition-transform duration-300">{insight.title}</h3>
              <p className="text-gray-400 font-light leading-relaxed">{insight.description}</p>
            </div>
            
            <div className="mt-8 pt-6 border-t border-white/10">
              <span className="text-xs text-white uppercase tracking-widest block mb-2 opacity-50">The Nudge</span>
              <p className="text-sm text-white italic">{insight.suggestion}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};