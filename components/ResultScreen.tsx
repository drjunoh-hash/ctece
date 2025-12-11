import React from 'react';
import { CTCategory, UserProfile } from '../types';

interface ResultScreenProps {
  results: { questionId: number; correct: boolean; category: CTCategory }[];
  user: UserProfile;
  totalQuestions: number;
  onAssessNewChild: () => void;
  onHome: () => void;
}

const ResultScreen: React.FC<ResultScreenProps> = ({ results, user, totalQuestions, onAssessNewChild, onHome }) => {
  const correctCount = results.filter(r => r.correct).length;

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[60vh] animate-fade-in px-4">
      
      <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 p-8 md:p-12 max-w-lg w-full text-center">
        
        {/* Success Icon */}
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 text-green-500">
            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
          </svg>
        </div>

        {/* Title & Subtitle */}
        <h2 className="text-3xl font-bold text-slate-800 mb-2 fun-font tracking-tight">
          검사를 완료했습니다!
        </h2>
        <p className="text-slate-500 mb-8 font-medium">
          수고하셨습니다. 모든 문제를 풀었어요.
        </p>

        {/* Score Card */}
        <div className="bg-slate-50 rounded-2xl p-8 mb-8">
          <div className="text-slate-500 font-bold mb-2">원점수</div>
          <div className="text-5xl font-bold text-blue-500 fun-font">
            {correctCount} / {totalQuestions}
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={onAssessNewChild}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold text-lg py-4 rounded-xl transition-all shadow-lg shadow-blue-200"
          >
            🧸 다른 유아 검사하기
          </button>
          
          <button
            onClick={onHome}
            className="w-full bg-white border border-slate-200 text-slate-600 font-bold text-lg py-4 rounded-xl hover:bg-slate-50 transition-colors"
          >
            처음으로 돌아가기
          </button>
        </div>

      </div>

    </div>
  );
};

export default ResultScreen;