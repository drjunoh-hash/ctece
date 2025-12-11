import { StoredAssessmentResult } from '../types';

// Google Sheets API Scope
export const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

// Helper to create a new sheet
const createSheet = async (token: string, title: string): Promise<string> => {
  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: { 
        'Authorization': `Bearer ${token}`, 
        'Content-Type': 'application/json' 
    },
    body: JSON.stringify({ 
        properties: { title } 
    })
  });
  
  if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'Failed to create sheet');
  }

  const data = await response.json();
  return data.spreadsheetId;
};

// Helper to add header row
const addHeaderRow = async (token: string, spreadsheetId: string) => {
    const headers = ['검사일시', '이름', '나이', '성별', '기관', '점수', '총문항', '정답률'];
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:append?valueInputOption=USER_ENTERED`, {
        method: 'POST',
        headers: { 
            'Authorization': `Bearer ${token}`, 
            'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
            values: [headers] 
        })
    });
};

export const appendAssessmentResult = async (token: string, record: StoredAssessmentResult) => {
    // 1. Get or Create Sheet ID from localStorage
    let sheetId = localStorage.getItem('google_sheet_id');
    
    // If we don't have a sheet ID, or if the previous append failed (maybe file deleted), we might need to handle creation.
    // For simplicity, if ID is missing, we create one.
    if (!sheetId) {
        try {
            // Updated Title to be generic
            sheetId = await createSheet(token, '유아 컴퓨팅 사고력 검사 결과 (CT Assessment)');
            localStorage.setItem('google_sheet_id', sheetId);
            await addHeaderRow(token, sheetId);
        } catch (e) {
            console.error("Error creating sheet:", e);
            throw e;
        }
    }

    // 2. Prepare Row Data
    const accuracy = Math.round((record.totalScore / record.totalQuestions) * 100) + '%';
    const row = [
        record.date,
        record.childName,
        record.childAge,
        record.childGender === 'male' ? '남' : '여',
        record.institution,
        record.totalScore,
        record.totalQuestions,
        accuracy
    ];

    // 3. Append Data
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1!A1:append?valueInputOption=USER_ENTERED`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 
            'Authorization': `Bearer ${token}`, 
            'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
            values: [row] 
        })
    });

    if (!response.ok) {
        // If error is 404 (Not Found), maybe the sheet was deleted. Clear ID and retry once?
        if (response.status === 404) {
            localStorage.removeItem('google_sheet_id');
            // Recursive retry once could be dangerous without limit, so we just throw for now.
             throw new Error("Spreadsheet not found. It might have been deleted. Please try again (a new sheet will be created).");
        }
        const err = await response.json();
        throw new Error(err.error?.message || 'Failed to append row');
    }
    
    return sheetId;
};