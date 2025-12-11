import React, { useState, useEffect, useRef } from 'react';
import { Question, CTCategory, QuizResponse } from '../types';

interface QuizScreenProps {
  questions: Question[];
  onComplete: (answers: QuizResponse[]) => void;
}

const QuizScreen: React.FC<QuizScreenProps> = ({ questions, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answers, setAnswers] = useState<QuizResponse[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    setSelectedOption(null);
  }, [currentIndex]);

  // Auto-play audio with 1 second delay when question changes
  useEffect(() => {
    if (audioRef.current) {
        // Stop previous audio
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
    }

    if (currentQuestion.audioUrl) {
        const timer = setTimeout(() => {
            if (audioRef.current) {
                audioRef.current.play().catch((e) => {
                    console.log("Auto-play prevented by browser policy:", e);
                });
            }
        }, 1000);

        return () => clearTimeout(timer);
    }
  }, [currentIndex, currentQuestion.audioUrl]);

  const handleOptionClick = (optionId: number) => {
    setSelectedOption(optionId);
  };

  const handleNext = () => {
    if (selectedOption === null) return;

    const isCorrect = selectedOption === currentQuestion.correctOptionId;
    const newAnswer: QuizResponse = { 
        questionId: currentQuestion.id, 
        selectedOptionId: selectedOption,
        correct: isCorrect, 
        category: currentQuestion.category 
    };

    const newAnswers = [...answers, newAnswer];
    setAnswers(newAnswers);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onComplete(newAnswers);
    }
  };

  const playAudio = () => {
    if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center animate-fade-in pb-4 md:pb-10 px-2 md:px-0">
        
        {/* Header Title */}
        <h2 className="text-2xl md:text-4xl font-bold text-slate-800 mb-4 md:mb-8 text-center fun-font tracking-tight leading-snug break-keep">
            {currentQuestion.questionText}
        </h2>

        {/* Main Image Container */}
        <div className="bg-white p-2 md:p-3 rounded-[2rem] border-2 border-blue-200 shadow-sm mb-4 md:mb-6 max-w-3xl w-full">
            <div className="rounded-[1.5rem] overflow-hidden bg-slate-50 relative flex items-center justify-center min-h-[200px] md:min-h-[400px]">
                {currentQuestion.questionImageUrl ? (
                    <img 
                        src={currentQuestion.questionImageUrl} 
                        alt="Question Visual" 
                        className="w-full h-full object-contain max-h-[300px] md:max-h-[500px]"
                    />
                ) : (
                    <div className="text-slate-300 text-4xl md:text-6xl">🖼️</div>
                )}
            </div>
        </div>

        {/* Audio Button */}
        {currentQuestion.audioUrl && (
            <div className="mb-6 md:mb-12">
                <audio ref={audioRef} src={currentQuestion.audioUrl} className="hidden" />
                <button 
                    onClick={playAudio}
                    className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-yellow-950 px-6 py-2 md:px-8 md:py-3 rounded-2xl font-bold text-base md:text-lg shadow-md transition-transform active:scale-95 border-b-4 border-yellow-500 active:border-b-0 active:translate-y-1"
                >
                    <span className="text-lg md:text-xl">🔊</span>
                    다시 듣기
                </button>
            </div>
        )}

        {/* Options Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 w-full mb-8 md:mb-12">
            {currentQuestion.options.map((option) => (
                <button
                    key={option.id}
                    onClick={() => handleOptionClick(option.id)}
                    className={`
                        group flex flex-col items-center p-3 md:p-4 rounded-3xl border-2 transition-all duration-200 bg-white shadow-sm active:scale-95
                        ${selectedOption === option.id 
                            ? 'border-blue-500 ring-2 md:ring-4 ring-blue-100 transform -translate-y-1 shadow-lg' 
                            : 'border-slate-100 hover:border-blue-200 hover:shadow-md'}
                    `}
                >
                    <div className="w-full aspect-square rounded-2xl bg-slate-50 mb-3 md:mb-4 overflow-hidden border border-slate-100 relative">
                        {option.imageUrl ? (
                             <img 
                                src={option.imageUrl.startsWith('http') || option.imageUrl.startsWith('data:') 
                                    ? option.imageUrl 
                                    : `https://picsum.photos/seed/${option.imageUrl}/400/400`} 
                                alt={option.text}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                             />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl md:text-5xl text-slate-300">
                                {['A', 'B', 'C', 'D'][option.id % 4]}
                            </div>
                        )}
                        {/* Checkmark overlay for selection */}
                        {selectedOption === option.id && (
                            <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center backdrop-blur-[1px]">
                                <div className="bg-blue-500 text-white rounded-full p-1 md:p-2 shadow-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 md:w-8 md:h-8">
                                        <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                        )}
                    </div>
                    <span className={`text-base md:text-xl font-bold text-center break-keep leading-tight transition-colors ${selectedOption === option.id ? 'text-blue-600' : 'text-slate-700'}`}>
                        {option.text}
                    </span>
                </button>
            ))}
        </div>

        {/* Next Button */}
        <div className="w-full">
            <button
                onClick={handleNext}
                disabled={selectedOption === null}
                className={`
                    w-full py-4 md:py-5 rounded-2xl font-bold text-xl md:text-2xl transition-all shadow-lg flex items-center justify-center gap-2
                    ${selectedOption !== null 
                        ? 'bg-blue-400 hover:bg-blue-500 text-white transform hover:-translate-y-1 shadow-blue-200' 
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'}
                `}
            >
                다음 <span className="text-2xl md:text-3xl pb-1">›</span>
            </button>
        </div>

    </div>
  );
};

export default QuizScreen;