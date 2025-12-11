import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="w-full bg-white shadow-md py-3 px-4 md:py-4 md:px-6 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-2 md:gap-3">
        <div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-lg md:text-xl shrink-0">
          CT
        </div>
        <h1 className="text-xl md:text-2xl font-bold text-indigo-600 tracking-tight fun-font">
          컴퓨팅 사고력 검사
        </h1>
      </div>
      <div className="text-xs md:text-sm font-medium text-slate-500 bg-slate-100 px-2 py-1 md:px-3 rounded-full">
        Beta
      </div>
    </header>
  );
};

export default Header;