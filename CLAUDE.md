# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GoutCare AI is a privacy-first, browser-based React application for gout management. It runs entirely client-side with no server dependencies, storing data in localStorage.

## Essential Commands

```bash
# Development
npm run dev        # Start Vite dev server on localhost:5173

# Build & Preview
npm run build      # Build for production (outputs to dist/)
npm run preview    # Preview production build

# Environment Setup
export GEMINI_API_KEY="your-api-key"  # Required for AI features
```

## Architecture & Key Concepts

### Core Architecture Pattern
The app follows a three-panel layout architecture:
- **State Management**: Centralized in `App.tsx` using React hooks
- **Data Flow**: Unidirectional from App → Components → Services
- **Storage**: All user data in localStorage with import/export capabilities
- **AI Integration**: Google Gemini API via `services/geminiService.ts`

### Critical Files for Understanding the System

1. **App.tsx**: Central state management and component orchestration. All major state (logs, chat history, language) lives here.

2. **types.ts**: Complete type definitions for the entire application. Essential for understanding data structures.

3. **services/geminiService.ts**: AI integration layer. Handles streaming responses, web search, and bilingual support.

4. **translations.ts**: Bilingual system (EN/KR). All UI text flows through this translation layer.

### Component Communication Pattern
Components communicate through props and callbacks passed from App.tsx:
```typescript
// Example: Modal components receive state and update functions
<SymptomCheckinModal 
  isOpen={state} 
  onClose={handleClose}
  onSave={(data) => updateLogs(data)}
/>
```

### AI Assistant Context
The AI assistant has access to:
- Complete conversation history with images
- All health logs (symptoms, medications, diet)
- Medical guidelines (ACR, EULAR, KCR)
- Purine content database

When modifying AI responses, ensure medical safety protocols in `geminiService.ts` remain intact.

## Development Guidelines

### When Adding Features
1. Define types in `types.ts` first
2. Add translations to `translations.ts` for both languages
3. Update localStorage schema if storing new data
4. Test import/export functionality if modifying data structures

### When Modifying AI Behavior
- System instructions are in `geminiService.ts`
- Maintain medical safety guidelines
- Preserve bilingual response capability
- Keep web search integration functional

### Component Creation Pattern
New components should follow existing patterns:
```typescript
interface ComponentProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSave?: (data: Type) => void;
  // ... other props
}

export function Component({ props }: ComponentProps) {
  // Component logic
}
```

### Testing Considerations
- No test framework configured yet
- Manual testing via dev server
- Browser localStorage can be cleared via Settings modal
- Test bilingual functionality by switching languages

## Important Constraints

1. **Privacy First**: Never add external data transmission without explicit user consent
2. **Client-Side Only**: All processing must work in browser without server
3. **Medical Safety**: Maintain disclaimer about not replacing professional medical advice
4. **Bilingual Support**: All new UI text must support both English and Korean