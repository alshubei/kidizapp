import React from 'react';
import { MathProblem } from '@/types/game';

interface ChalkboardProps {
  problem: MathProblem;
}

export const Chalkboard: React.FC<ChalkboardProps> = ({ problem }) => {
  return (
    <div className="wood-frame p-3 sm:p-4 rounded-2xl">
      <div className="chalkboard-bg rounded-xl p-6 sm:p-8 min-h-[160px] sm:min-h-[200px] flex items-center justify-center relative overflow-hidden">
        {/* Chalk dust effect */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 left-8 w-2 h-2 bg-chalk rounded-full" />
          <div className="absolute top-12 right-12 w-1 h-1 bg-chalk rounded-full" />
          <div className="absolute bottom-8 left-16 w-1.5 h-1.5 bg-chalk rounded-full" />
          <div className="absolute bottom-4 right-8 w-1 h-1 bg-chalk rounded-full" />
        </div>

        {/* Math problem */}
        <div className="font-chalk chalk-text text-4xl sm:text-6xl md:text-7xl tracking-wide select-none">
          <span className="inline-block animate-float" style={{ animationDelay: '0s' }}>
            {problem.num1}
          </span>
          <span className="inline-block mx-3 sm:mx-4 text-btn-yellow" style={{ animationDelay: '0.1s' }}>
            {problem.operator}
          </span>
          <span className="inline-block animate-float" style={{ animationDelay: '0.2s' }}>
            {problem.num2}
          </span>
          <span className="inline-block mx-3 sm:mx-4">
            =
          </span>
          <span className="inline-block text-btn-pink animate-pulse">
            ?
          </span>
        </div>

        {/* Chalk tray */}
        <div className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-t from-amber-900/50 to-transparent" />
      </div>
    </div>
  );
};
