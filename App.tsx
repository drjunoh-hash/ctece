import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import WelcomeScreen from './components/WelcomeScreen';
import QuizScreen from './components/QuizScreen';
import ResultScreen from './components/ResultScreen';
import QuestionBuilder from './components/QuestionBuilder';
// Removed AI service import
import { AppState, UserProfile, Question, CTCategory, StoredAssessmentResult, QuizResponse, AssessmentDetail } from './types';
import { appendAssessmentResult, SHEETS_SCOPE } from './services/googleSheetService';

// Global Google Object
declare const google: any;

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('WELCOME');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [customQuestions, setCustomQuestions] = useState<Question[]>([]);
  const [results, setResults] = useState<QuizResponse[]>([]);
  const [assessmentHistory, setAssessmentHistory] = useState<StoredAssessmentResult[]>([]);
  
  // Google Auth State
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);

  // Load custom questions and assessment history from localStorage on mount
  useEffect(() => {
    const savedQuestions = localStorage.getItem('my_questions');
    if (savedQuestions) {
      try {
        const parsed = JSON.parse(savedQuestions);
        if (Array.isArray(parsed)) {
          setCustomQuestions(parsed);
        }
      } catch (e) {
        console.error("Failed to parse saved questions", e);
      }
    }

    const savedHistory = localStorage.getItem('assessment_results');
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        if (Array.isArray(parsedHistory)) {
          setAssessmentHistory(parsedHistory);
        }
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Google Login Handler
  const handleGoogleLogin = () => {
    console.log("Starting Google Login Flow...");
    
    // 1. Check if Google Script is loaded safely
    const g = (window as any).google;
    if (!g || !g.accounts || !g.accounts.oauth2) {
        console.error("Google script not found on window object");
        alert("⚠️ 구글 연결 프로그램이 준비되지 않았습니다.\n\n잠시 후 다시 시도하거나, 페이지를 새로고침(F5) 해주세요.");
        return;
    }

    // 2. Check/Get Client ID
    let clientId = localStorage.getItem('google_client_id');

    // Validate existing Client ID format
    if (clientId && !clientId.includes('apps.googleusercontent.com')) {
        console.warn("Invalid Client ID format detected. Clearing.");
        localStorage.removeItem('google_client_id');
        clientId = null;
    }
    
    // If missing, ask for it
    if (!clientId) {
         const input = window.prompt("구글 클라우드 플랫폼(GCP)에서 발급받은 [Client ID]를 입력해주세요.\n\n예: 12345...apps.googleusercontent.com");
         
         if (input === null) return; // Cancelled
         
         const trimmedInput = input.trim();
         if (!trimmedInput) {
             alert("ID가 입력되지 않았습니다.");
             return;
         }

         if (!trimmedInput.includes('apps.googleusercontent.com')) {
             alert("⚠️ 올바른 Client ID 형식이 아닙니다.\n'.apps.googleusercontent.com'으로 끝나는 ID여야 합니다.");
             return;
         }

         localStorage.setItem('google_client_id', trimmedInput);
         
         // CRITICAL: Stop here. Using prompt() breaks the "user gesture" needed for the popup.
         // Asking the user to click again ensures the popup won't be blocked.
         alert("✅ ID가 저장되었습니다.\n\n보안을 위해 [연동하기] 버튼을 '한 번 더' 눌러 로그인을 완료해주세요.");
         return;
    }

    // 3. Initialize & Request Token
    try {
        const client = g.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: SHEETS_SCOPE,
            callback: (tokenResponse: any) => {
                if (tokenResponse && tokenResponse.access_token) {
                    console.log("Access Token Received");
                    setGoogleToken(tokenResponse.access_token);
                    setIsGoogleConnected(true);
                    alert("✅ 구글 계정이 연결되었습니다!\n이제 검사 결과가 자동으로 백업됩니다.");
                }
            },
            error_callback: (err: any) => {
                 console.error("GSI Error Callback:", err);
                 if (err.type === 'popup_closed') return; // User closed popup
                 
                 let msg = "로그인 중 오류가 발생했습니다.";
                 if (String(err.message).includes('origin_mismatch')) {
                     msg += "\n\n[원인] 이 웹사이트 주소가 구글 설정에 등록되지 않았습니다.\n구글 클라우드 콘솔 > 승인된 자바스크립트 원본에 현재 주소를 추가하세요.";
                 } else {
                     msg += "\n(팝업 차단 해제 후 다시 시도해보세요)";
                 }
                 alert(msg);
                 
                 // If error persists, allow reset
                 if (confirm("Client ID를 잘못 입력하셨나요? 저장된 ID를 삭제하고 다시 입력하시겠습니까?")) {
                     localStorage.removeItem('google_client_id');
                 }
            }
        });
        
        // Trigger Popup
        client.requestAccessToken();

    } catch (e: any) {
        console.error("Init Error:", e);
        alert(`연결 초기화 실패. Client ID를 확인해주세요.\n(${e.message || e})`);
        if (confirm("저장된 ID를 삭제하고 다시 입력하시겠습니까?")) {
             localStorage.removeItem('google_client_id');
        }
    }
  };

  const handleStart = async (profile: UserProfile) => {
    setUserProfile(profile);
    
    // Strictly use custom questions created by the user
    if (customQuestions.length === 0) {
      alert("등록된 문제가 없습니다.\n[관리자 로그인 > 문제 관리]에서 문제를 먼저 출제해주세요.");
      return;
    }

    setQuestions(customQuestions);
    setAppState('QUIZ');
  };

  const handleQuizComplete = async (quizResults: QuizResponse[]) => {
    setResults(quizResults);
    
    // Construct Detailed Result History
    if (userProfile) {
        const correctCount = quizResults.filter(r => r.correct).length;
        
        // Map detailed answers
        const details: AssessmentDetail[] = quizResults.map(r => {
            const question = questions.find(q => q.id === r.questionId);
            const selectedOption = question?.options.find(o => o.id === r.selectedOptionId);
            return {
                questionId: r.questionId,
                questionText: question ? question.questionText : "삭제된 문제",
                selectedOptionText: selectedOption ? selectedOption.text : "알 수 없음",
                isCorrect: r.correct,
                score: r.correct ? 1 : 0 // 1 point per question
            };
        });

        const newRecord: StoredAssessmentResult = {
            id: Date.now(),
            childName: userProfile.name,
            childAge: userProfile.age,
            childGender: userProfile.gender,
            institution: userProfile.institution,
            totalScore: correctCount,
            totalQuestions: questions.length,
            date: new Date().toLocaleString(),
            details: details
        };

        const updatedHistory = [newRecord, ...assessmentHistory];
        setAssessmentHistory(updatedHistory);
        try {
            localStorage.setItem('assessment_results', JSON.stringify(updatedHistory));
        } catch (e) {
            console.error("History Save Error:", e);
            alert("저장 용량이 부족하여 검사 결과를 브라우저에 저장하지 못했습니다.");
        }

        // --- Auto Backup to Google Sheets ---
        if (isGoogleConnected && googleToken) {
            try {
                await appendAssessmentResult(googleToken, newRecord);
                console.log("Auto-backup successful");
            } catch (e) {
                console.error("Auto-backup failed", e);
                alert("⚠️ 구글 시트 자동 저장 실패\n연결이 끊어졌거나 권한이 없습니다. 관리자 페이지에서 [연동하기]를 다시 눌러주세요.");
                setIsGoogleConnected(false); // Reset status
            }
        }
    }

    setAppState('RESULTS');
  };

  const handleRestart = () => {
    setResults([]);
    // Return to welcome screen. Persist userProfile for examiner data.
    setAppState('WELCOME');
  };

  const handleEnterBuilder = () => {
    setAppState('BUILDER');
  };

  const handleSaveCustomQuiz = (newQuestions: Question[]) => {
    setCustomQuestions(newQuestions);
    // Persist to localStorage with error handling
    try {
        localStorage.setItem('my_questions', JSON.stringify(newQuestions));
    } catch (e) {
        console.error("Quiz Save Error:", e);
        alert("저장 용량이 부족하여 문제 목록을 브라우저에 저장하지 못했습니다.");
    }
    setAppState('WELCOME');
  };

  const handleCancelBuilder = () => {
    setAppState('WELCOME');
  };

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col font-sans">
      <Header />
      
      <main className="flex-grow p-3 md:p-8 flex items-center justify-center w-full">
        
        {appState === 'WELCOME' && (
          <WelcomeScreen 
            onStart={handleStart} 
            onEnterBuilder={handleEnterBuilder}
            hasCustomQuestions={customQuestions.length > 0}
            questionCount={customQuestions.length} 
            initialProfile={userProfile}
            assessmentHistory={assessmentHistory}
            onConnectGoogle={handleGoogleLogin}
            isGoogleConnected={isGoogleConnected}
          />
        )}

        {appState === 'BUILDER' && (
          <QuestionBuilder
            onSave={handleSaveCustomQuiz}
            onCancel={handleCancelBuilder}
            existingQuestions={customQuestions}
          />
        )}

        {appState === 'QUIZ' && questions.length > 0 && (
          <QuizScreen 
            questions={questions} 
            onComplete={handleQuizComplete} 
          />
        )}

        {appState === 'RESULTS' && userProfile && (
          <ResultScreen 
            results={results} 
            user={userProfile} 
            totalQuestions={questions.length}
            onAssessNewChild={handleRestart}
            onHome={handleRestart}
          />
        )}

      </main>

      <footer className="p-4 text-center text-slate-400 text-sm">
        <p>&copy; {new Date().getFullYear()} Computational Thinking Assessment.</p>
      </footer>
    </div>
  );
};

export default App;