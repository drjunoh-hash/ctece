import React, { useState, useRef, useEffect } from 'react';
import { Question, CTCategory, QuestionOption } from '../types';

interface QuestionBuilderProps {
  onSave: (questions: Question[]) => void;
  onCancel: () => void;
  existingQuestions?: Question[];
}

const QuestionBuilder: React.FC<QuestionBuilderProps> = ({ onSave, onCancel, existingQuestions = [] }) => {
  const [questions, setQuestions] = useState<Question[]>(existingQuestions);
  
  // Edit Mode State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Form State
  const [category, setCategory] = useState<CTCategory>(CTCategory.Logic); 
  const [questionText, setQuestionText] = useState('');
  const [questionImageUrl, setQuestionImageUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [explanation, setExplanation] = useState('');
  
  const [options, setOptions] = useState<{ text: string; imageUrl: string }[]>([
    { text: '', imageUrl: '' },
    { text: '', imageUrl: '' },
    { text: '', imageUrl: '' }
  ]);
  const [correctOptionIndex, setCorrectOptionIndex] = useState(0);

  // Refs for file inputs to clear them after submission
  const qImageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const optionImageInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-save to localStorage whenever questions change
  useEffect(() => {
    try {
      localStorage.setItem('my_questions', JSON.stringify(questions));
      setSaveError(null);
    } catch (e) {
      console.error("Auto-save failed:", e);
      setSaveError("⚠️ 브라우저 저장 용량이 부족하여 자동 저장이 실패했습니다. 이미지를 줄이거나 오래된 데이터를 정리해주세요.");
    }
  }, [questions]);

  // Helper to convert file to Base64
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (result: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (limit to ~500KB to prevent storage issues)
      if (file.size > 500 * 1024) {
        alert("파일 크기가 너무 큽니다 (500KB 이하 권장). 저장 용량 부족의 원인이 될 수 있습니다.");
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        callback(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddOption = () => {
    if (options.length < 4) {
      setOptions([...options, { text: '', imageUrl: '' }]);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
      if (correctOptionIndex >= newOptions.length) {
        setCorrectOptionIndex(0);
      }
    }
  };

  const handleOptionChange = (index: number, field: 'text' | 'imageUrl', value: string) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setOptions(newOptions);
  };

  const resetForm = () => {
    setEditingId(null); // Exit edit mode
    setQuestionText('');
    setQuestionImageUrl('');
    setAudioUrl('');
    setExplanation('');
    setOptions([
      { text: '', imageUrl: '' },
      { text: '', imageUrl: '' },
      { text: '', imageUrl: '' }
    ]);
    setCorrectOptionIndex(0);
    setCategory(CTCategory.Logic);
    
    // Reset file inputs
    if (qImageInputRef.current) qImageInputRef.current.value = '';
    if (audioInputRef.current) audioInputRef.current.value = '';
    optionImageInputRefs.current.forEach(ref => {
      if (ref) ref.value = '';
    });
  };

  // Load a question into the form for editing
  const handleEditQuestion = (id: number) => {
    const qToEdit = questions.find(q => q.id === id);
    if (!qToEdit) return;

    setEditingId(id);
    setCategory(qToEdit.category);
    setQuestionText(qToEdit.questionText);
    setQuestionImageUrl(qToEdit.questionImageUrl || '');
    setAudioUrl(qToEdit.audioUrl || '');
    setExplanation(qToEdit.explanation);
    setCorrectOptionIndex(qToEdit.correctOptionId);

    // Map options back to form format
    const formOptions = qToEdit.options.map(o => ({
        text: o.text,
        imageUrl: o.imageUrl || ''
    }));
    setOptions(formOptions);
  };

  const handleSaveQuestion = () => {
    if (!questionText.trim()) return alert("문항 이름을 입력해주세요.");
    if (options.some(o => !o.text.trim())) return alert("모든 보기 설명(텍스트)을 입력해주세요.");

    const questionData: Question = {
      id: editingId ? editingId : Date.now(),
      category,
      questionText,
      questionImageUrl: questionImageUrl || undefined,
      audioUrl: audioUrl || undefined,
      options: options.map((o, idx) => ({
        id: idx,
        text: o.text,
        imageUrl: o.imageUrl || undefined
      })),
      correctOptionId: correctOptionIndex,
      difficulty: 1,
      explanation: explanation || "정답입니다!"
    };

    if (editingId) {
        // Update existing
        setQuestions(questions.map(q => q.id === editingId ? questionData : q));
        alert("문제가 수정되었습니다.");
    } else {
        // Add new
        setQuestions([...questions, questionData]);
        alert("문제가 추가되었습니다.");
    }
    
    resetForm();
  };

  const handleDeleteQuestion = (id: number) => {
    if (window.confirm("정말 이 문제를 삭제하시겠습니까?")) {
        setQuestions(questions.filter(q => q.id !== id));
        if (editingId === id) {
            resetForm();
        }
    }
  };

  return (
    <div className="max-w-6xl mx-auto w-full p-2 md:p-4 animate-fade-in">
      
      {/* Save Error Notification */}
      {saveError && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 border border-red-200 rounded-xl flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 shrink-0">
                <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-bold">{saveError}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col lg:flex-row min-h-[85vh] lg:h-[85vh]">
        
        {/* Left: Question List */}
        <div className="w-full lg:w-1/4 bg-slate-50 border-b lg:border-b-0 lg:border-r border-slate-200 p-4 flex flex-col order-2 lg:order-1 h-auto lg:h-full">
          <h3 className="text-lg md:text-xl font-bold text-slate-700 mb-4 fun-font flex justify-between items-center">
            <span>📋 문제 목록</span>
            <span className="bg-indigo-100 text-indigo-600 text-xs px-2 py-1 rounded-full">{questions.length}</span>
          </h3>
          <div className="flex-grow overflow-y-auto space-y-3 pr-2 max-h-48 lg:max-h-full">
            {questions.length === 0 && (
              <div className="text-center text-slate-400 py-6 text-sm">
                아직 문제가 없어요.<br/>오른쪽(아래)에서 추가해주세요!
              </div>
            )}
            {questions.map((q, idx) => (
              <div 
                key={q.id} 
                className={`p-3 rounded-xl shadow-sm border relative group transition-all
                    ${editingId === q.id ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-100' : 'bg-white border-slate-200'}
                `}
              >
                <div className="flex justify-end gap-2 mb-2 absolute top-2 right-2">
                    <button 
                        onClick={() => handleEditQuestion(q.id)}
                        className="text-slate-400 hover:text-blue-500 p-1"
                        title="수정"
                    >
                        ✏️
                    </button>
                    <button 
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="text-slate-400 hover:text-red-500 p-1"
                        title="삭제"
                    >
                        🗑️
                    </button>
                </div>
                
                <div className="flex items-center gap-2 mb-1 pr-14">
                    {q.audioUrl && <span className="text-xs" title="오디오 있음">🔊</span>}
                    {q.questionImageUrl && <span className="text-xs" title="이미지 있음">🖼️</span>}
                    {editingId === q.id && <span className="text-xs font-bold text-indigo-600 animate-pulse">수정 중...</span>}
                </div>
                <div className="text-sm font-medium text-slate-800 line-clamp-2">{idx + 1}. {q.questionText}</div>
              </div>
            ))}
          </div>
          <div className="pt-4 border-t border-slate-200 space-y-2 mt-auto">
             <button
              onClick={() => onSave(questions)}
              disabled={questions.length === 0}
              className={`w-full py-3 rounded-xl font-bold text-white transition-all
                ${questions.length > 0 ? 'bg-indigo-600 hover:bg-indigo-700 shadow-md' : 'bg-slate-300 cursor-not-allowed'}`}
            >
              저장 및 나가기
            </button>
            <button
              onClick={onCancel}
              className="w-full py-3 bg-white border-2 border-slate-200 text-slate-500 rounded-xl font-bold hover:bg-slate-50"
            >
              취소하기
            </button>
          </div>
        </div>

        {/* Right: Form */}
        <div className="w-full lg:w-3/4 p-4 md:p-6 lg:p-8 overflow-y-auto bg-white order-1 lg:order-2 h-auto lg:h-full">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl md:text-2xl font-bold text-slate-800 fun-font flex items-center gap-2">
                {editingId ? '✏️ 문제 수정하기' : '✨ 새 문제 만들기'}
            </h3>
            {editingId && (
                <button 
                    onClick={resetForm}
                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-200"
                >
                    수정 취소 (새 문제 만들기)
                </button>
            )}
          </div>

          <div className="space-y-6">
            
            {/* Question Text & Media */}
            <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-2">문항 이름 (질문 내용)</label>
                    <textarea
                        value={questionText}
                        onChange={(e) => setQuestionText(e.target.value)}
                        placeholder="예: 다음 중 빨간색 과일은 무엇인가요?"
                        className="w-full p-4 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:outline-none transition-colors h-24 resize-none"
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">문항 그림 (선택)</label>
                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors relative">
                        <input 
                            type="file" 
                            accept="image/*" 
                            ref={qImageInputRef}
                            onChange={(e) => handleFileUpload(e, setQuestionImageUrl)}
                            className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                        {questionImageUrl && (
                            <div className="mt-2 relative inline-block">
                                <img src={questionImageUrl} alt="Preview" className="h-24 object-contain mx-auto rounded-lg shadow-sm" />
                                <button 
                                    onClick={() => { setQuestionImageUrl(''); if(qImageInputRef.current) qImageInputRef.current.value = ''; }}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center text-xs"
                                >
                                    ×
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">오디오 파일 (선택)</label>
                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors relative">
                        <input 
                            type="file" 
                            accept="audio/*" 
                            ref={audioInputRef}
                            onChange={(e) => handleFileUpload(e, setAudioUrl)}
                            className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
                        />
                        {audioUrl && (
                            <div className="mt-2">
                                <audio controls src={audioUrl} className="w-full h-8" />
                                <button 
                                    onClick={() => { setAudioUrl(''); if(audioInputRef.current) audioInputRef.current.value = ''; }}
                                    className="text-red-500 text-xs mt-1 font-bold underline"
                                >
                                    오디오 삭제
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Options */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                보기 설정 (정답을 클릭해서 선택하세요)
              </label>
              <div className="space-y-4">
                {options.map((option, idx) => (
                  <div key={idx} className="flex flex-col md:flex-row gap-3 items-start bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <button
                      onClick={() => setCorrectOptionIndex(idx)}
                      className={`mt-1 md:mt-4 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all shadow-sm
                        ${correctOptionIndex === idx ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-slate-300 text-slate-300 hover:border-green-300'}`}
                      title="이 보기를 정답으로 설정"
                    >
                      {correctOptionIndex === idx ? '✓' : idx + 1}
                    </button>
                    
                    <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                       <div>
                          <label className="text-xs font-bold text-slate-400 mb-1 block">보기 설명</label>
                          <input
                            type="text"
                            value={option.text}
                            onChange={(e) => handleOptionChange(idx, 'text', e.target.value)}
                            placeholder={`선택지 ${idx + 1} 텍스트`}
                            className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none bg-white"
                          />
                       </div>
                       
                       <div>
                          <label className="text-xs font-bold text-slate-400 mb-1 block">보기 그림 (업로드 또는 키워드)</label>
                          <div className="flex gap-2">
                             <input 
                                type="file"
                                accept="image/*"
                                ref={(el) => { optionImageInputRefs.current[idx] = el; }}
                                onChange={(e) => handleFileUpload(e, (res) => handleOptionChange(idx, 'imageUrl', res))}
                                className="hidden" 
                                id={`opt-img-${idx}`}
                             />
                             <label 
                                htmlFor={`opt-img-${idx}`}
                                className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs cursor-pointer hover:bg-slate-100 flex items-center gap-1 whitespace-nowrap"
                             >
                                📂 업로드
                             </label>
                             <input
                                type="text"
                                value={option.imageUrl.startsWith('data:') ? '(이미지 파일 업로드됨)' : option.imageUrl}
                                onChange={(e) => handleOptionChange(idx, 'imageUrl', e.target.value)}
                                placeholder="키워드 (예: cat)"
                                className="w-full p-2.5 text-sm rounded-lg border border-slate-200 bg-white focus:border-indigo-300 focus:outline-none text-slate-600 min-w-0"
                                disabled={option.imageUrl.startsWith('data:')}
                             />
                             {option.imageUrl && (
                                <div className="w-10 h-10 rounded-md overflow-hidden bg-slate-200 border border-slate-300 flex-shrink-0">
                                   <img 
                                     src={option.imageUrl.startsWith('data:') ? option.imageUrl : `https://picsum.photos/seed/${option.imageUrl}/100/100`} 
                                     alt="preview" 
                                     className="w-full h-full object-cover"
                                   />
                                </div>
                             )}
                              {option.imageUrl.startsWith('data:') && (
                                <button 
                                  onClick={() => {
                                      handleOptionChange(idx, 'imageUrl', '');
                                      if(optionImageInputRefs.current[idx]) optionImageInputRefs.current[idx]!.value = '';
                                  }}
                                  className="text-red-400 hover:text-red-600 text-xs whitespace-nowrap"
                                >
                                  삭제
                                </button>
                              )}
                          </div>
                       </div>
                    </div>

                    {options.length > 2 && (
                      <button onClick={() => handleRemoveOption(idx)} className="self-end md:self-center text-slate-400 hover:text-red-500 p-2">
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {options.length < 4 && (
                <button
                  onClick={handleAddOption}
                  className="mt-3 text-sm font-bold text-indigo-500 hover:text-indigo-600 py-2 px-3 rounded-lg border border-dashed border-indigo-300 hover:bg-indigo-50 w-full"
                >
                  + 선택지 추가하기
                </button>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">해설 (피드백)</label>
              <input
                type="text"
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="예: 사과는 빨간색 과일이에요."
                className="w-full p-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <button
              onClick={handleSaveQuestion}
              className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transform active:scale-95 transition-all
                ${editingId 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200' 
                    : 'bg-slate-800 hover:bg-slate-700 text-white shadow-slate-300'}`}
            >
              {editingId ? '수정 완료' : '문제 목록에 추가하기 ⬇️'}
            </button>

          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionBuilder;