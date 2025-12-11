export enum CTCategory {
  Pattern = 'Pattern', // 패턴 인식
  Sequencing = 'Sequencing', // 순서 정하기 (알고리즘)
  Abstraction = 'Abstraction', // 단순화/분류
  Debugging = 'Debugging', // 오류 수정
  Logic = 'Logic' // 논리적 추론
}

export interface QuestionOption {
  id: number;
  text: string;
  imageUrl?: string; // URL, Base64, or Keyword
}

export interface Question {
  id: number;
  category: CTCategory;
  questionText: string;
  questionImageUrl?: string; // New: Image for the main question
  audioUrl?: string; // New: Audio file for the question
  options: QuestionOption[];
  correctOptionId: number;
  difficulty: number; // 1-5
  explanation: string;
}

// 퀴즈 진행 중 발생하는 단일 응답 데이터
export interface QuizResponse {
  questionId: number;
  selectedOptionId: number;
  correct: boolean;
  category: CTCategory;
}

export interface AssessmentResult {
  category: CTCategory;
  score: number;
  total: number;
}

export interface UserProfile {
  // Examinee (Child)
  name: string; 
  age: number;
  gender: 'male' | 'female';
  institution: string;

  // Examiner
  examinerName: string;
  examinerAge?: string;
  examinerGender?: 'male' | 'female';
  
  // Test Metadata
  testTitle: string;
  testDescription: string;
}

// 저장될 상세 문항별 결과
export interface AssessmentDetail {
  questionId: number;
  questionText: string;
  selectedOptionText: string; // 선택한 보기 텍스트
  isCorrect: boolean;
  score: number; // 문항당 배점 (예: 1점)
}

// 최종 저장되는 검사 레코드
export interface StoredAssessmentResult {
  id: number; // Timestamp
  childName: string;
  childAge: number;
  childGender: 'male' | 'female';
  institution: string;
  totalScore: number;
  totalQuestions: number;
  date: string;
  details: AssessmentDetail[]; // 상세 결과 배열
}

export type AppState = 'WELCOME' | 'LOADING' | 'QUIZ' | 'RESULTS' | 'BUILDER';