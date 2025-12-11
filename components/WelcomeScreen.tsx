import React, { useState, useEffect } from 'react';
import { UserProfile, StoredAssessmentResult } from '../types';

interface WelcomeScreenProps {
  onStart: (profile: UserProfile) => void;
  onEnterBuilder: () => void;
  hasCustomQuestions: boolean;
  questionCount: number;
  initialProfile?: UserProfile | null;
  assessmentHistory: StoredAssessmentResult[];
  onConnectGoogle?: () => void; // New prop for auto-backup login
  isGoogleConnected?: boolean;  // New prop to show status
}

type ScreenStep = 'LANDING' | 'EXAMINER_INFO' | 'EXAMINEE_INFO' | 'ADMIN_SETTINGS';
type AdminView = 'DASHBOARD' | 'RESULTS' | 'PASSWORD' | 'HOMEPAGE';

// Google Identity Services global object
declare const google: any;

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ 
  onStart, 
  onEnterBuilder, 
  hasCustomQuestions, 
  questionCount,
  initialProfile,
  assessmentHistory,
  onConnectGoogle,
  isGoogleConnected
}) => {
  const [step, setStep] = useState<ScreenStep>('LANDING');

  // Test Metadata (Managed in Admin)
  const [testTitle, setTestTitle] = useState(initialProfile?.testTitle || '웹기반 유아 컴퓨팅 사고력 검사');
  const [testDescription, setTestDescription] = useState(initialProfile?.testDescription || '유아 컴퓨팅 사고력 검사를 실시합니다.');
  
  // Custom Images State
  const [homeBgImage, setHomeBgImage] = useState<string>('');
  const [homeMainImage, setHomeMainImage] = useState<string>('');

  // Examiner Info State (Pre-fill if available)
  const [examinerName, setExaminerName] = useState(initialProfile?.examinerName || '');
  const [examinerGender, setExaminerGender] = useState<'male' | 'female' | null>(initialProfile?.examinerGender || null);
  const [examinerAge, setExaminerAge] = useState(initialProfile?.examinerAge || '');

  // Examinee (Child) Info State (Always fresh)
  const [childName, setChildName] = useState('');
  const [childGender, setChildGender] = useState<'male' | 'female' | null>(null);
  const [childAge, setChildAge] = useState<number>(5); 
  const [institution, setInstitution] = useState('');

  // Admin Login State
  const [isAdminLoginVisible, setIsAdminLoginVisible] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [currentAdminPassword, setCurrentAdminPassword] = useState('1234');

  // Admin Dashboard State
  const [adminView, setAdminView] = useState<AdminView>('DASHBOARD');
  
  // Selected result for detail view
  const [selectedResult, setSelectedResult] = useState<StoredAssessmentResult | null>(null);

  // Google Drive Upload State (Manual)
  const [isUploading, setIsUploading] = useState(false);

  const INSTITUTIONS = [
    "국공립유치원", "사립유치원", 
    "국공립어린이집", "직장 및 법인 어린이집", 
    "민간어린이집", "가정어린이집"
  ];

  // Load custom images from localStorage on mount
  useEffect(() => {
    const savedBg = localStorage.getItem('home_bg_image');
    if (savedBg) setHomeBgImage(savedBg);

    const savedMain = localStorage.getItem('home_main_image');
    if (savedMain) setHomeMainImage(savedMain);

    const savedTitle = localStorage.getItem('test_title');
    if (savedTitle) setTestTitle(savedTitle);

    const savedDesc = localStorage.getItem('test_desc');
    if (savedDesc) setTestDescription(savedDesc);
  }, []);

  // Helper for image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        alert("이미지 크기가 너무 큽니다. (2MB 이하 권장)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveHomepageSettings = () => {
    try {
        localStorage.setItem('test_title', testTitle);
        localStorage.setItem('test_desc', testDescription);
        localStorage.setItem('home_bg_image', homeBgImage);
        localStorage.setItem('home_main_image', homeMainImage);
        alert('설정이 저장되었습니다.');
        setAdminView('DASHBOARD');
    } catch (e) {
        alert('저장 용량이 부족하여 이미지를 저장하지 못했습니다. 이미지 크기를 줄여주세요.');
    }
  };

  const hasValidExaminerInfo = () => {
    return examinerName.trim().length > 0 && examinerGender !== null && examinerAge.trim().length > 0;
  };

  const handleLandingStart = () => {
    if (questionCount === 0) {
        alert("등록된 문제가 없습니다. 관리자 메뉴에서 문제를 먼저 등록해주세요.");
        return;
    }
    // If examiner info is already filled (from previous session), skip to examinee info
    if (hasValidExaminerInfo()) {
      setStep('EXAMINEE_INFO');
    } else {
      setStep('EXAMINER_INFO');
    }
  };

  const handleExaminerNext = () => {
    if (hasValidExaminerInfo()) {
      setStep('EXAMINEE_INFO');
    } else {
      alert("검사자 정보(이름, 성별, 나이)를 모두 입력해주세요.");
    }
  };

  const handleStartClick = () => {
    if (!childName.trim()) return alert("유아 이름을 입력해주세요.");
    if (!childGender) return alert("유아 성별을 선택해주세요.");
    if (!institution) return alert("기관을 선택해주세요.");

    onStart({
      name: childName,
      age: childAge,
      gender: childGender,
      institution,
      examinerName,
      examinerAge,
      examinerGender: examinerGender || undefined,
      testTitle,
      testDescription
    });
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPasswordInput === currentAdminPassword) {
      setStep('ADMIN_SETTINGS');
      setAdminView('DASHBOARD');
      setIsAdminLoginVisible(false);
      setAdminPasswordInput('');
    } else {
      alert('비밀번호가 올바르지 않습니다.');
    }
  };

  const handleChangePassword = (newPass: string) => {
    if (newPass.trim().length < 4) {
      alert("비밀번호는 4자 이상이어야 합니다.");
      return;
    }
    setCurrentAdminPassword(newPass);
    alert("비밀번호가 변경되었습니다.");
    setAdminView('DASHBOARD');
  };

  const goHome = () => setStep('LANDING');
  const logout = () => {
    setStep('LANDING');
    setIsAdminLoginVisible(false);
  };

  // --- Backup Functions ---
  const exportToCSV = () => {
    if (assessmentHistory.length === 0) {
        alert("저장된 데이터가 없습니다.");
        return;
    }

    // CSV Header
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID,이름,성별,나이,기관,총점,총문항,날짜,문항내용,선택한답,정답여부,배점\n";

    assessmentHistory.forEach((record) => {
        // Flat map for CSV (One row per question per student)
        if (record.details && record.details.length > 0) {
            record.details.forEach(detail => {
                const row = [
                    record.id,
                    record.childName,
                    record.childGender,
                    record.childAge,
                    record.institution,
                    record.totalScore,
                    record.totalQuestions,
                    record.date,
                    `"${detail.questionText.replace(/"/g, '""')}"`, // Escape quotes
                    `"${detail.selectedOptionText.replace(/"/g, '""')}"`,
                    detail.isCorrect ? "O" : "X",
                    detail.score
                ].join(",");
                csvContent += row + "\n";
            });
        } else {
             // Fallback for records without details
            const row = [
                record.id,
                record.childName,
                record.childGender,
                record.childAge,
                record.institution,
                record.totalScore,
                record.totalQuestions,
                record.date,
                "-", "-", "-", "-"
            ].join(",");
            csvContent += row + "\n";
        }
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `assessment_backup_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Google Drive Upload Logic
  const handleGoogleDriveUpload = async () => {
    if (assessmentHistory.length === 0) {
        alert("업로드할 데이터가 없습니다.");
        return;
    }

    if (typeof google === 'undefined') {
        alert("Google API 스크립트가 로드되지 않았습니다. 인터넷 연결을 확인하거나 페이지를 새로고침해주세요.");
        return;
    }

    // 1. Get Client ID
    let clientId = localStorage.getItem('google_client_id');
    // Validate ID
    if (clientId && !clientId.includes('apps.googleusercontent.com')) {
         localStorage.removeItem('google_client_id');
         clientId = null;
    }

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
        alert("✅ ID가 저장되었습니다.\n\n보안을 위해 [구글 드라이브 저장] 버튼을 '한 번 더' 눌러 로그인을 완료해주세요.");
        return;
    }

    setIsUploading(true);

    try {
        const tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: 'https://www.googleapis.com/auth/drive.file',
            callback: async (tokenResponse: any) => {
                if (tokenResponse && tokenResponse.access_token) {
                    await uploadFileToDrive(tokenResponse.access_token);
                } else {
                    setIsUploading(false);
                    console.warn("No access token in response");
                }
            },
            error_callback: (error: any) => {
                console.error("Token Client Error:", error);
                if (error.type === 'popup_closed') {
                     setIsUploading(false);
                     return;
                }
                alert("로그인 중 오류가 발생했습니다. (팝업 차단 여부를 확인하세요)");
                setIsUploading(false);
            }
        });

        tokenClient.requestAccessToken();

    } catch (error) {
        console.error("Google Auth Error", error);
        alert("구글 로그인 초기화 실패. Client ID를 확인해주세요.");
        localStorage.removeItem('google_client_id'); // Clear potentially invalid ID
        setIsUploading(false);
    }
  };

  const uploadFileToDrive = async (accessToken: string) => {
    const fileContent = JSON.stringify(assessmentHistory, null, 2);
    const fileName = `CT_Assessment_Backup_${new Date().toISOString().slice(0,10)}.json`;

    // Multipart upload body
    const metadata = {
        name: fileName,
        mimeType: 'application/json',
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([fileContent], { type: 'application/json' }));

    try {
        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + accessToken,
            },
            body: form,
        });

        if (response.ok) {
            alert(`✅ 구글 드라이브에 저장되었습니다!\n파일명: ${fileName}`);
        } else {
            const errorData = await response.json();
            console.error("Drive Upload Error:", errorData);
            throw new Error(errorData.error?.message || "Upload failed");
        }
    } catch (error) {
        console.error("Upload Error:", error);
        alert(`업로드 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`);
    } finally {
        setIsUploading(false);
    }
  };

  // --- Handlers for Google Sheet Connection ---
  const handleResetId = () => {
    console.log("ID Reset Clicked");
    if (window.confirm("저장된 Client ID를 삭제하시겠습니까?")) {
        localStorage.removeItem('google_client_id');
        window.alert("ID가 삭제되었습니다. [연동하기] 버튼을 눌러 새 ID를 입력해주세요.");
    }
  };

  const handleConnectClick = () => {
    console.log("Connect Clicked");
    if (onConnectGoogle) {
        onConnectGoogle();
    } else {
        console.error("onConnectGoogle prop is missing");
        alert("연동 기능이 연결되지 않았습니다.");
    }
  };

  // --- VIEW: LANDING ---
  if (step === 'LANDING') {
    return (
      <div className="relative w-full min-h-[calc(100vh-80px)] flex flex-col items-center justify-center">
        
        {/* Background Image Layer */}
        {homeBgImage && (
            <div 
                className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-500"
                style={{ backgroundImage: `url(${homeBgImage})` }}
            />
        )}
        
        {/* Overlay for readability if BG exists */}
        {homeBgImage && (
            <div className="absolute inset-0 z-0 bg-white/60 backdrop-blur-sm" />
        )}

        <div className="relative z-10 w-full max-w-2xl mx-auto px-4 flex flex-col items-center animate-fade-in py-10">
            <div className="text-center mb-8 md:mb-10 space-y-2">
            <h1 className="text-3xl md:text-5xl font-bold text-slate-800 tracking-tight text-center break-keep leading-tight drop-shadow-sm">
                {testTitle}
            </h1>
            <p className="text-slate-600 text-base md:text-lg px-2 font-medium">
                {testDescription}
            </p>
            </div>

            <div className="bg-white/90 backdrop-blur rounded-[2rem] md:rounded-[2.5rem] shadow-xl border border-white/50 p-6 md:p-10 w-full text-center hover:shadow-2xl transition-all duration-300">
            {homeMainImage ? (
                <div className="w-24 h-24 md:w-32 md:h-32 mx-auto mb-6 flex items-center justify-center">
                    <img src={homeMainImage} alt="Main Icon" className="w-full h-full object-contain drop-shadow-md" />
                </div>
            ) : (
                <div className="w-20 h-20 md:w-24 md:h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-500 shadow-inner">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 md:w-12 md:h-12 ml-1">
                    <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                    </svg>
                </div>
            )}

            <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-2">
                검사 시작하기
            </h2>
            
            <div className="text-slate-500 mb-6 md:mb-8 font-medium text-sm md:text-base">
                {questionCount > 0 ? (
                    <>
                        새로운 검사를 시작합니다 (총 {questionCount}문항)
                        <span className="block text-xs text-green-600 mt-1">✅ 문제가 준비되었습니다</span>
                    </>
                ) : (
                    <div className="bg-red-50 text-red-500 p-3 rounded-xl border border-red-100 text-xs md:text-sm">
                        ⚠️ 등록된 문제가 없습니다.<br/>
                        아래 <b>관리자 로그인</b> 후 문제를 등록해주세요.
                    </div>
                )}
            </div>

            <button 
                onClick={handleLandingStart}
                disabled={questionCount === 0}
                className={`w-full font-bold text-lg py-3 md:py-4 px-6 rounded-2xl transition-all transform active:scale-[0.98] shadow-lg
                    ${questionCount > 0 
                        ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-200' 
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'}`}
            >
                시작하기
            </button>
            </div>

            <div className="mt-8">
            {!isAdminLoginVisible ? (
                <button 
                onClick={() => setIsAdminLoginVisible(true)}
                className="text-slate-500 text-sm font-bold hover:text-slate-800 transition-colors bg-white/50 px-4 py-1 rounded-full backdrop-blur-sm"
                >
                관리자 로그인
                </button>
            ) : (
                <form onSubmit={handleAdminLogin} className="flex flex-col items-center gap-2 animate-fade-in bg-white p-4 rounded-xl shadow-lg border border-slate-200">
                <label className="text-xs font-bold text-slate-500">관리자 비밀번호 입력</label>
                <input 
                    type="password" 
                    placeholder="비밀번호"
                    className="px-4 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-blue-500 w-48 text-center"
                    value={adminPasswordInput}
                    onChange={(e) => setAdminPasswordInput(e.target.value)}
                    autoFocus
                />
                <div className="flex gap-2 w-full">
                    <button 
                    type="button"
                    onClick={() => { setIsAdminLoginVisible(false); setAdminPasswordInput(''); }}
                    className="flex-1 px-3 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-200"
                    >
                    취소
                    </button>
                    <button 
                    type="submit"
                    className="flex-1 px-3 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-700"
                    >
                    확인
                    </button>
                </div>
                </form>
            )}
            </div>
        </div>
      </div>
    );
  }

  // --- VIEW: EXAMINER INFO ---
  if (step === 'EXAMINER_INFO') {
    return (
      <div className="w-full max-w-lg mx-auto animate-fade-in">
        <div className="bg-white rounded-[2rem] shadow-xl p-6 md:p-8 border border-slate-100">
          <div className="text-center mb-6 md:mb-8">
            <h2 className="text-xl md:text-2xl font-bold text-slate-800">검사자 정보 입력</h2>
            <p className="text-slate-500 text-xs md:text-sm mt-1">검사를 진행하는 분의 정보를 입력해주세요</p>
          </div>
          
          <div className="space-y-4 md:space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">이름</label>
              <input
                type="text"
                placeholder="검사자 이름을 입력하세요"
                className="w-full p-3 md:p-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none text-base"
                value={examinerName}
                onChange={(e) => setExaminerName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">성별</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setExaminerGender('male')}
                  className={`flex-1 py-3 rounded-xl border font-bold transition-all ${
                    examinerGender === 'male' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  남자
                </button>
                <button
                  onClick={() => setExaminerGender('female')}
                  className={`flex-1 py-3 rounded-xl border font-bold transition-all ${
                    examinerGender === 'female' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  여자
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">나이</label>
              <input
                type="number"
                placeholder="나이를 입력하세요"
                className="w-full p-3 md:p-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none text-base"
                value={examinerAge}
                onChange={(e) => setExaminerAge(e.target.value)}
              />
            </div>

            <div className="flex gap-3 mt-6 md:mt-8">
              <button 
                onClick={goHome}
                className="p-3 md:p-4 rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
              </button>
              <button
                onClick={handleExaminerNext}
                className="flex-1 bg-blue-400 hover:bg-blue-500 text-white rounded-xl font-bold text-lg shadow-lg transition-all"
              >
                다음 단계로
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- VIEW: EXAMINEE INFO ---
  if (step === 'EXAMINEE_INFO') {
    return (
      <div className="w-full max-w-lg mx-auto animate-fade-in">
        <div className="bg-white rounded-[2rem] shadow-xl p-6 md:p-8 border border-slate-100">
          <div className="text-center mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-slate-800">유아 정보 입력</h2>
            <p className="text-slate-500 text-xs md:text-sm mt-1">검사받을 유아의 정보를 입력해주세요</p>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 md:p-4 mb-6 flex items-center justify-between border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="overflow-hidden">
                <div className="text-xs text-slate-500 font-bold">검사자</div>
                <div className="text-sm font-bold text-slate-800 truncate">
                  {examinerName}
                </div>
              </div>
            </div>
            <button 
              onClick={() => setStep('EXAMINER_INFO')} 
              className="text-xs font-bold text-slate-400 hover:text-blue-500 flex items-center gap-1 shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
              </svg>
              변경
            </button>
          </div>
          
          <div className="space-y-4 md:space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">이름</label>
              <input
                type="text"
                placeholder="유아 이름을 입력하세요"
                className="w-full p-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">성별</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setChildGender('male')}
                  className={`flex-1 py-3 rounded-lg border font-bold text-sm transition-all ${
                    childGender === 'male' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  남자
                </button>
                <button
                  onClick={() => setChildGender('female')}
                  className={`flex-1 py-3 rounded-lg border font-bold text-sm transition-all ${
                    childGender === 'female' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  여자
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">연령</label>
              <div className="flex gap-2 flex-wrap">
                {[3, 4, 5, 6, 7].map(age => (
                  <button
                    key={age}
                    onClick={() => setChildAge(age)}
                    className={`flex-1 py-2 px-1 rounded-lg border font-bold text-sm transition-all whitespace-nowrap ${
                      childAge === age ? 'bg-blue-500 text-white border-blue-500' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    만{age}세
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">기관</label>
              <div className="grid grid-cols-2 gap-2">
                {INSTITUTIONS.map((inst) => (
                  <button
                    key={inst}
                    onClick={() => setInstitution(inst)}
                    className={`py-3 px-2 rounded-lg border text-xs font-bold transition-all ${
                      institution === inst ? 'bg-blue-500 text-white border-blue-500' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {inst}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                onClick={goHome}
                className="p-3 md:p-4 rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
              </button>
              <button
                onClick={handleStartClick}
                className="flex-1 bg-blue-400 hover:bg-blue-500 text-white rounded-xl font-bold text-lg shadow-lg transition-all"
              >
                검사 시작하기
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- VIEW: ADMIN SETTINGS (DASHBOARD) ---
  if (step === 'ADMIN_SETTINGS') {
    return (
      <div className="w-full max-w-5xl mx-auto animate-fade-in p-2 md:p-4">
        
        {/* Admin Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">관리자 페이지</h2>
            <p className="text-slate-500 text-sm md:text-base">문제 관리 및 결과 조회</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button 
              onClick={goHome} 
              className="flex-1 md:flex-none flex items-center justify-center gap-1 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              나가기
            </button>
            <button 
              onClick={logout} 
              className="flex-1 md:flex-none flex items-center justify-center gap-1 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:text-red-500 hover:border-red-100 transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>
        
        {/* Google Sheet Connection Status Banner */}
        {isGoogleConnected ? (
             <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between animate-fade-in">
                 <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                            <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                         </svg>
                     </div>
                     <div>
                         <h4 className="font-bold text-green-800 text-sm">Google 시트 자동 저장 활성화됨</h4>
                         <p className="text-xs text-green-600">검사 완료 시 결과가 자동으로 스프레드시트에 기록됩니다.</p>
                     </div>
                 </div>
                 <span className="text-xs font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full">연동 중</span>
             </div>
        ) : (
             <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                 <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400">
                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                            <path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625Z" />
                            <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
                         </svg>
                     </div>
                     <div>
                         <h4 className="font-bold text-slate-700 text-sm">Google 시트 연동 필요</h4>
                         <p className="text-xs text-slate-500">자동 백업을 위해 Google 계정을 연결해주세요.</p>
                     </div>
                 </div>
                 {onConnectGoogle && (
                     <div className="flex gap-2">
                        <button 
                            type="button"
                            onClick={handleResetId}
                            className="text-xs font-bold text-slate-400 hover:text-red-500 underline px-2 cursor-pointer"
                        >
                            ID 초기화
                        </button>
                        <button 
                            type="button"
                            onClick={handleConnectClick}
                            className="text-xs font-bold text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors shadow-sm cursor-pointer"
                        >
                            연동하기
                        </button>
                     </div>
                 )}
             </div>
        )}

        {/* Dashboard Grid */}
        {adminView === 'DASHBOARD' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            
            {/* 1. Question Management */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8 flex flex-col items-center text-center hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-yellow-100 rounded-full flex items-center justify-center text-2xl md:text-3xl mb-4 text-yellow-600">
                ⚙️
              </div>
              <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-2">문제 관리</h3>
              <p className="text-slate-500 text-sm mb-6">문제와 자료를 관리합니다</p>
              <button 
                onClick={onEnterBuilder}
                className="w-full py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all"
              >
                관리하기
              </button>
            </div>

            {/* 2. Result Inquiry */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8 flex flex-col items-center text-center hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-green-100 rounded-full flex items-center justify-center text-2xl md:text-3xl mb-4 text-green-600">
                📄
              </div>
              <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-2">결과 조회</h3>
              <p className="text-slate-500 text-sm mb-6">검사 결과를 확인합니다</p>
              <button 
                onClick={() => setAdminView('RESULTS')}
                className="w-full py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all"
              >
                조회하기
              </button>
            </div>

            {/* 3. Password Change */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8 flex flex-col items-center text-center hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl md:text-3xl mb-4 text-blue-600">
                🗝️
              </div>
              <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-2">비밀번호 변경</h3>
              <p className="text-slate-500 text-sm mb-6">관리자 비밀번호를 변경합니다</p>
              <button 
                onClick={() => setAdminView('PASSWORD')}
                className="w-full py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all"
              >
                변경하기
              </button>
            </div>

            {/* 4. Homepage Settings */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8 flex flex-col items-center text-center hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-slate-100 rounded-full flex items-center justify-center text-2xl md:text-3xl mb-4 text-slate-600">
                🪟
              </div>
              <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-2">홈페이지 설정</h3>
              <p className="text-slate-500 text-sm mb-6">첫 화면을 수정합니다</p>
              <button 
                onClick={() => setAdminView('HOMEPAGE')}
                className="w-full py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all"
              >
                설정하기
              </button>
            </div>
          </div>
        )}

        {/* --- Sub Views --- */}

        {/* Result Inquiry View */}
        {adminView === 'RESULTS' && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-4 md:p-8 animate-fade-in">
             <div className="flex flex-col gap-4 mb-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg md:text-xl font-bold text-slate-800">📄 검사 결과 조회</h3>
                    <button onClick={() => setAdminView('DASHBOARD')} className="px-3 py-1 text-xs md:text-sm font-bold text-slate-500 hover:text-slate-800 bg-slate-100 rounded-lg hover:bg-slate-200 md:hidden">← 뒤로</button>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 w-full">
                    {/* CSV Backup Button */}
                    <button 
                        onClick={exportToCSV}
                        className="flex-1 px-4 py-3 md:py-2 bg-green-500 text-white rounded-xl md:rounded-lg text-sm font-bold hover:bg-green-600 flex items-center justify-center gap-1 shadow-sm transition-all"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        CSV 저장
                    </button>
                    
                    {/* Google Drive Upload Button */}
                    <button 
                        onClick={handleGoogleDriveUpload}
                        disabled={isUploading}
                        className={`flex-1 px-4 py-3 md:py-2 rounded-xl md:rounded-lg text-sm font-bold flex items-center justify-center gap-1 shadow-sm transition-all
                          ${isUploading 
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                            : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                    >
                        {isUploading ? (
                          <>
                            <svg className="animate-spin h-4 w-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            업로드 중...
                          </>
                        ) : (
                          <>
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                             </svg>
                             구글 드라이브 저장
                          </>
                        )}
                    </button>

                    <button onClick={() => setAdminView('DASHBOARD')} className="hidden md:block px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-800 bg-slate-100 rounded-lg hover:bg-slate-200">← 돌아가기</button>
                </div>
             </div>
             
             {/* Detail Modal */}
             {selectedResult && (
                 <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setSelectedResult(null)}>
                     <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                         <div className="flex justify-between items-center mb-4">
                             <h4 className="text-lg font-bold text-slate-800">{selectedResult.childName} 어린이 상세 결과</h4>
                             <button onClick={() => setSelectedResult(null)} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
                         </div>
                         <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-slate-500 border-collapse min-w-[400px]">
                                <thead>
                                    <tr className="bg-slate-50 text-xs text-slate-700 uppercase">
                                        <th className="px-4 py-2 border-b">문항</th>
                                        <th className="px-4 py-2 border-b">선택한 답</th>
                                        <th className="px-4 py-2 border-b">정답여부</th>
                                        <th className="px-4 py-2 border-b">배점</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedResult.details?.map((detail, idx) => (
                                        <tr key={idx} className="border-b last:border-0">
                                            <td className="px-4 py-3 font-medium text-slate-800">{idx + 1}. {detail.questionText}</td>
                                            <td className="px-4 py-3">{detail.selectedOptionText}</td>
                                            <td className="px-4 py-3">
                                                {detail.isCorrect ? (
                                                    <span className="text-green-600 font-bold">O</span>
                                                ) : (
                                                    <span className="text-red-500 font-bold">X</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">{detail.score}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                         </div>
                         <div className="mt-4 text-right">
                             <span className="font-bold text-lg text-blue-600">총점: {selectedResult.totalScore} / {selectedResult.totalQuestions}</span>
                         </div>
                     </div>
                 </div>
             )}

             <div className="overflow-x-auto rounded-xl border border-slate-100">
                {assessmentHistory.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">
                        아직 저장된 검사 결과가 없습니다.
                    </div>
                ) : (
                    <table className="w-full text-sm text-left text-slate-500 min-w-[600px]">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 md:px-6">이름</th>
                                <th className="px-4 py-3 md:px-6">성별</th>
                                <th className="px-4 py-3 md:px-6">나이</th>
                                <th className="px-4 py-3 md:px-6">점수</th>
                                <th className="px-4 py-3 md:px-6">검사일</th>
                                <th className="px-4 py-3 md:px-6">상세</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assessmentHistory.map((result) => (
                                <tr key={result.id} className="bg-white border-b hover:bg-slate-50">
                                    <td className="px-4 py-4 md:px-6 font-bold text-slate-800">{result.childName}</td>
                                    <td className="px-4 py-4 md:px-6">{result.childGender === 'male' ? '남' : '여'}</td>
                                    <td className="px-4 py-4 md:px-6">{result.childAge}세</td>
                                    <td className="px-4 py-4 md:px-6 font-bold text-blue-600">
                                        {result.totalScore} / {result.totalQuestions}
                                    </td>
                                    <td className="px-4 py-4 md:px-6 text-xs md:text-sm">{result.date}</td>
                                    <td className="px-4 py-4 md:px-6">
                                        <button 
                                            onClick={() => setSelectedResult(result)}
                                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold"
                                        >
                                            상세보기
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
             </div>
          </div>
        )}

        {/* Password Change View */}
        {adminView === 'PASSWORD' && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8 animate-fade-in max-w-lg mx-auto">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">🗝️ 비밀번호 변경</h3>
                <button onClick={() => setAdminView('DASHBOARD')} className="text-sm font-bold text-slate-500 hover:text-slate-800">← 돌아가기</button>
             </div>
             <form onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const newPass = (form.elements.namedItem('newPass') as HTMLInputElement).value;
                handleChangePassword(newPass);
             }}>
                <div className="mb-4">
                    <label className="block text-sm font-bold text-slate-700 mb-2">새 비밀번호</label>
                    <input name="newPass" type="password" placeholder="새 비밀번호 입력" className="w-full p-3 rounded-lg border border-slate-300 focus:border-blue-500 outline-none" />
                </div>
                <button type="submit" className="w-full py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-all">변경 완료</button>
             </form>
          </div>
        )}

        {/* Homepage Settings View */}
        {adminView === 'HOMEPAGE' && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8 animate-fade-in max-w-lg mx-auto">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">🪟 홈페이지 설정</h3>
                <button onClick={() => setAdminView('DASHBOARD')} className="text-sm font-bold text-slate-500 hover:text-slate-800">← 돌아가기</button>
             </div>
             <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">검사명 (메인 타이틀)</label>
                  <input
                    type="text"
                    className="w-full p-3 rounded-lg border border-slate-300 focus:border-slate-500 outline-none"
                    value={testTitle}
                    onChange={(e) => setTestTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">검사 설명 (서브 타이틀)</label>
                  <input
                    type="text"
                    className="w-full p-3 rounded-lg border border-slate-300 focus:border-slate-500 outline-none"
                    value={testDescription}
                    onChange={(e) => setTestDescription(e.target.value)}
                  />
                </div>
                
                {/* Image Settings */}
                <div className="pt-4 border-t border-slate-100">
                    <label className="block text-xs font-bold text-slate-500 mb-2">배경 이미지 (전체 화면)</label>
                    <div className="flex items-center gap-3">
                        <input 
                            type="file" 
                            accept="image/*"
                            id="bg-upload"
                            className="hidden"
                            onChange={(e) => handleImageUpload(e, setHomeBgImage)}
                        />
                        <label htmlFor="bg-upload" className="px-4 py-2 bg-slate-100 border border-slate-300 rounded-lg text-sm font-bold cursor-pointer hover:bg-slate-200">
                            파일 선택
                        </label>
                        {homeBgImage ? (
                            <div className="flex items-center gap-2">
                                <span className="text-green-600 text-xs font-bold">✓ 업로드됨</span>
                                <button onClick={() => setHomeBgImage('')} className="text-red-400 text-xs underline">삭제</button>
                            </div>
                        ) : <span className="text-slate-400 text-xs">설정된 이미지 없음</span>}
                    </div>
                    {homeBgImage && (
                        <div className="mt-2 w-full h-24 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 relative">
                             <img src={homeBgImage} alt="Background Preview" className="w-full h-full object-cover opacity-50" />
                             <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-600">미리보기</span>
                        </div>
                    )}
                </div>

                <div className="pt-2">
                    <label className="block text-xs font-bold text-slate-500 mb-2">메인 아이콘/이미지 (중앙 카드)</label>
                    <div className="flex items-center gap-3">
                        <input 
                            type="file" 
                            accept="image/*"
                            id="main-upload"
                            className="hidden"
                            onChange={(e) => handleImageUpload(e, setHomeMainImage)}
                        />
                        <label htmlFor="main-upload" className="px-4 py-2 bg-slate-100 border border-slate-300 rounded-lg text-sm font-bold cursor-pointer hover:bg-slate-200">
                            파일 선택
                        </label>
                         {homeMainImage ? (
                            <div className="flex items-center gap-2">
                                <span className="text-green-600 text-xs font-bold">✓ 업로드됨</span>
                                <button onClick={() => setHomeMainImage('')} className="text-red-400 text-xs underline">삭제</button>
                            </div>
                        ) : <span className="text-slate-400 text-xs">기본 아이콘 사용 중</span>}
                    </div>
                     {homeMainImage && (
                        <div className="mt-2 w-24 h-24 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 mx-auto">
                             <img src={homeMainImage} alt="Main Preview" className="w-full h-full object-contain" />
                        </div>
                    )}
                </div>

                <button 
                    onClick={saveHomepageSettings}
                    className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-all mt-4 shadow-lg"
                >
                    설정 저장하기
                </button>
             </div>
          </div>
        )}

      </div>
    );
  }

  return null;
};

export default WelcomeScreen;