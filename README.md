# GoutCare AI ✨

**Your Personal AI Assistant for Gout Management, Powered by Google Gemini**

GoutCare AI is a privacy-first, browser-based application designed to help individuals manage gout. It combines a knowledgeable AI assistant, grounded in medical guidelines and powered by the Google Gemini API, with a comprehensive health dashboard for tracking symptoms, medication, and diet. All user data is stored exclusively on the user's device, ensuring complete privacy.

![GoutCare AI Screenshot](https://storage.googleapis.com/aip-dev-user-uploads/user-46549a75-1025-4591-95fd-2e70b22a2c17/57a75225-b467-4389-8b01-b5866162153c.png)

*The user interface features a health dashboard (left) with a personalized forecast and daily tips, a central calendar panel for logging and viewing pain trends, and a conversational AI chat window (right).*

---

## 🚀 Key Features

- **Intelligent & Multimodal AI Assistant:**
  - **Powered by Google Gemini (`gemini-2.5-flash`):** Provides intelligent, context-aware answers.
  - **Guideline-Based Knowledge:** Core knowledge is based on established gout management guidelines.
  - **Image Analysis:** The AI can analyze user-uploaded images of meals to assess purine content and provide dietary feedback, or identify medications.
  - **Live Web Search:** Uses the Gemini `googleSearch` tool to find up-to-date information, complete with source citations.
  - **Multilingual:** Fully supports both English and Korean.

- **Dual Layout System (Updated 2025-01-19):**
  - **2-Panel Mode (Default):** Optimized layout for efficiency
    - **Unified Health Dashboard:** Consolidated view with 3 modes (Summary/Tracking/Analysis)
    - **Integrated Chat & Calendar Panel:** Combined interface with flexible layout options (vertical/tabs)
  - **3-Panel Mode (Advanced):** Traditional detailed layout for power users
    - **Optimized Dashboard:** Advanced analytics and visualizations
    - **Dedicated Calendar Panel:** Full-featured calendar with pain trend chart
    - **Separate Chat Window:** Focused AI conversation interface

- **Seamless Health Logging:**
  - **Symptom Logging:** Log pain location, pain level (0-10), associated symptoms (swelling, redness), and notes.
  - **Medication Logging:** Record medication name, time of day, intake time, notes, and an optional photo for AI analysis.
  - **Diet Logging:** Log meals through a streamlined two-step process: first, describe the meal or add a photo; second, select the time of day and add any relevant notes.
  - **Automatic Chat Integration:** All logs are automatically formatted and sent to the chat, creating a continuous record that the AI can reference.

- **Privacy-First Data Management:**
  - **100% Client-Side:** All conversation history and health data are stored directly in the browser's `localStorage`.
  - **No Data Collection:** The application does not send any personal health data to a server.
  - **AI-Powered Health Summary:** Generates a concise summary of key health information from your conversation history, running entirely on your device.
  - **Full Data Control:** Provides robust tools for data management:
    - **Import:** Restore a conversation from a previously exported `.json` file.
    - **Export:** Save your entire chat history, including images, as a `.json` file for backup.
    - **Reset:** Permanently clear all conversation data to start fresh.

## 🛠️ Tech Stack

- **Frontend:** [React](https://reactjs.org/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/)
- **AI Model:** [Google Gemini API](https://ai.google.dev/)
- **AI SDK:** [`@google/genai`](https://www.npmjs.com/package/@google/genai) for Node.js & Web
- **Markdown Rendering:** `react-markdown` with `remark-gfm`

## ⚙️ Getting Started

### Prerequisites

- A modern web browser.
- A Google Gemini API Key.

### Running the Application

This project is a static web application and can be run using any simple local server.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/goutcare-ai.git
    cd goutcare-ai
    ```

2.  **Set up the API Key:**
    The application is configured to use an environment variable `process.env.API_KEY`. This is typically set by the deployment environment. For local development, you can create a simple script to replace this placeholder.

3.  **Serve the files:**
    You can use a simple static server to run the application locally. If you have Node.js installed, you can use the `serve` package.

    ```bash
    # Install serve globally if you haven't already
    npm install -g serve

    # Run the server from the project's root directory
    serve .
    ```
    The application will then be available at `http://localhost:3000` (or another port specified by the server).

## 🎨 UX/UI Improvements (January 2025)

### Major Interface Overhaul

GoutCare AI now features a completely redesigned interface focused on user experience and efficiency:

#### Dual Layout System
- **Smart Layout Switching:** Toggle between simplified 2-panel and advanced 3-panel layouts based on your needs
- **Default 2-Panel Mode:** Optimized for most users with consolidated information and minimal duplication
- **Advanced 3-Panel Mode:** For power users who want detailed, separated views

#### New Components
- **UnifiedDashboard:** Eliminates duplicate information with 3 distinct modes:
  - 🏥 **Health Summary:** Key metrics at a glance with risk assessment
  - 📝 **Daily Tracking:** Today's progress and logging status  
  - 📊 **Deep Analysis:** Trends, predictions, and advanced insights

- **ChatCalendarPanel:** Revolutionary combined interface:
  - **Flexible Layouts:** Switch between vertical (calendar-top) and tabbed interfaces
  - **Space Optimization:** Calendar sized at 220px with expandable chat area (400px+)
  - **Seamless Integration:** Calendar interactions don't interfere with chat scrolling

- **CompactCalendar:** Purpose-built for efficiency:
  - **Micro-sized Cells:** 5x5 grid cells maximize information density
  - **Activity Indicators:** Tiny colored dots show logged data (symptoms/meds/diet)
  - **Safe Interactions:** Proper event handling prevents UI conflicts

#### Enhanced User Experience
- **Visual Hierarchy:** Health risks clearly prioritized with color-coded indicators
- **Intuitive Navigation:** Emoji-based icons with descriptive tooltips
- **Responsive Design:** Consistent experience across all screen sizes
- **Interaction Safety:** All buttons include proper event handling to prevent display glitches

## 📁 Project Structure

```
.
├── App.tsx                       # Main application component
├── index.html                    # Entry HTML file
├── index.tsx                     # React root entry point
├── metadata.json                 # Application metadata for the platform
├── prd.md                        # Product Requirements Document
├── README.md                     # This file
├── translations.ts               # i18n translations for EN/KO
├── types.ts                      # TypeScript type definitions
├── components/                   # Reusable React components
│   ├── CalendarPanel.tsx         # Dedicated calendar with trends
│   ├── ChatCalendarPanel.tsx     # NEW: Integrated chat+calendar panel
│   ├── ChatWindow.tsx            # AI conversation interface
│   ├── CompactCalendar.tsx       # NEW: Space-optimized calendar
│   ├── ComprehensiveDashboard.tsx
│   ├── DashboardPanel.tsx        # Legacy dashboard component
│   ├── DietLogModal.tsx
│   ├── GoutForecast.tsx
│   ├── HealthSummaryModal.tsx
│   ├── IconComponents.tsx
│   ├── LogSelectionModal.tsx
│   ├── MedicationLogModal.tsx
│   ├── OptimizedDashboard.tsx    # Advanced 3-panel dashboard
│   ├── PainTrendChart.tsx
│   ├── SettingsModal.tsx
│   ├── SymptomCheckinModal.tsx
│   ├── UnifiedDashboard.tsx      # NEW: Consolidated 2-panel dashboard
│   └── [Additional health trackers...]
├── hooks/                        # Custom React hooks
│   └── useDebounce.ts
├── services/                     # Services for external APIs
│   └── geminiOptimized.ts        # Updated AI service with cost optimization
└── utils/                        # Utility functions
    ├── imageUtils.ts
    └── parsers.ts
```

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.