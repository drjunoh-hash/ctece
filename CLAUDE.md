# CLAUDE.md

## Project Overview

**ct-assessment-platform** (ctece) is a web-based platform for assessing computational thinking (CT) skills in young children (kindergarten/preschool age). The interface is in Korean, targeting Korean educational contexts.

Key capabilities:
- AI-generated assessment questions via Google Gemini API
- Multi-choice questions with image and audio support
- Google Sheets integration for data backup
- Assessment result tracking and history with localStorage persistence
- Admin interface for custom question creation

## Tech Stack

- **Language**: TypeScript 5.2
- **Framework**: React 18.2 (functional components, hooks)
- **Build Tool**: Vite 5.2
- **CSS**: Tailwind CSS 3.4
- **Charts**: Recharts 2.12
- **AI**: Google Gemini AI (`@google/genai` 1.32)
- **Module System**: ES Modules

## Project Structure

```
/
├── index.html               # HTML template
├── index.tsx                # React entry point (mounts App to #root)
├── App.tsx                  # Main app component, state management, routing
├── types.ts                 # Shared TypeScript interfaces and enums
├── components/
│   ├── Header.tsx           # Application header bar
│   ├── WelcomeScreen.tsx    # Landing page, admin dashboard, settings
│   ├── QuizScreen.tsx       # Quiz display and interaction logic
│   ├── ResultScreen.tsx     # Assessment results display
│   └── QuestionBuilder.tsx  # Admin question creation/editing interface
├── services/
│   ├── geminiService.ts     # Google Gemini API integration
│   └── googleSheetService.ts # Google Sheets API integration
├── package.json
├── tsconfig.json
├── vite.config.ts
└── metadata.json            # AI Studio project metadata
```

## Commands

### Development

```bash
npm install          # Install dependencies (required before first run)
npm run dev          # Start Vite dev server with hot reload
npm run build        # TypeScript compile (tsc) + Vite production build
npm run preview      # Preview the production build locally
```

### Environment Setup

Create a `.env.local` file in the project root:

```
GEMINI_API_KEY=your_api_key_here
```

The Vite config maps this to `process.env.API_KEY` at build time.

## Architecture

### State Management

- **No global state library** — all state lives in `App.tsx` using React `useState`/`useEffect`
- `App.tsx` manages the top-level `AppState` union type: `'WELCOME' | 'QUIZ' | 'RESULTS' | 'BUILDER'`
- `localStorage` is used for persisting assessment results, custom questions, and settings
- Google OAuth tokens are managed in component state for authenticated API calls

### Data Flow

- Unidirectional: `App.tsx` → child components via props
- Components communicate upward via callback props
- Services (`geminiService`, `googleSheetService`) are called directly from components

### Key Data Types (from `types.ts`)

- `CTCategory` enum: `Pattern`, `Sequencing`, `Abstraction`, `Debugging`, `Logic`
- `Question`: Full question structure with options and metadata
- `UserProfile`: Examiner/examinee info
- `QuizResponse`: User answer tracking
- `StoredAssessmentResult`: Complete assessment record
- `AppState`: Screen navigation union type

### API Integrations

- **Google Gemini**: Generates CT assessment questions; includes offline fallback data
- **Google Sheets**: Backs up assessment results via OAuth2-authenticated writes
- **Google Identity Services**: OAuth2 flow for Sheets access

## Code Conventions

### TypeScript

- Strict mode enabled in `tsconfig.json`
- All components use typed prop interfaces
- Shared types defined in `types.ts`
- Target: ES2020, JSX: react-jsx (automatic transform)

### React

- Functional components only (no class components)
- `React.FC` type annotations on components
- Hooks: `useState`, `useEffect`, `useRef`, `useCallback`
- No HOCs or render props patterns

### Naming

- **PascalCase**: Components, interfaces, types, enums (`WelcomeScreen`, `CTCategory`)
- **camelCase**: Variables, functions, state setters (`handleGoogleLogin`, `appendAssessmentResult`)
- **UPPERCASE**: Constants and enum values (`SHEETS_SCOPE`)
- **Boolean prefixes**: `is` / `has` (`isLoading`, `hasError`)

### Styling

- Tailwind CSS utility classes exclusively (no CSS modules or styled-components)
- Responsive breakpoints: `md:`, `lg:`
- Color scheme: blue-50 background, indigo/blue accents, green/red for feedback
- Google Fonts: Jua, Noto Sans KR (Korean typography)

## Testing

No test framework is currently configured. There are no test files, test runners, or testing libraries in the project.

## Linting / Formatting

No linting or formatting tools are currently configured (no ESLint, Prettier, or pre-commit hooks).

## CI/CD

No CI/CD pipeline is configured.

## Important Notes

- The application UI is entirely in Korean
- `WelcomeScreen.tsx` is the largest component (~1100 lines) — it handles landing, admin dashboard, and settings
- The Gemini service includes hardcoded fallback questions for offline/error scenarios
- Google OAuth2 is used only for Sheets backup, not for user authentication
- `noUnusedLocals` and `noUnusedParameters` are disabled in `tsconfig.json`
