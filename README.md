# GoutCare AI ✨

**Your Personal AI Assistant for Gout Management, Powered by Google Gemini**

GoutCare AI is a privacy-first, browser-based application designed to help individuals manage gout through intelligent AI assistance and comprehensive health tracking. Featuring a completely reimagined interface with smart risk prediction, the app combines advanced AI insights with an intuitive 4-section navigation system. All user data is stored exclusively on the user's device, ensuring complete privacy.

![GoutCare AI Screenshot](https://storage.googleapis.com/aip-dev-user-uploads/user-46549a75-1025-4591-95fd-2e70b22a2c17/57a75225-b467-4389-8b01-b5866162153c.png)

*The user interface features a health dashboard (left) with a personalized forecast and daily tips, a central calendar panel for logging and viewing pain trends, and a conversational AI chat window (right).*

---

## 🚀 Key Features

- **Revolutionary 4-Section Interface (Updated August 20, 2025):**
  - **🏠 Smart Home Dashboard:** 2x2 grid layout featuring today/tomorrow risk scores, weekly predictions, personalized daily tips, and quick action buttons
  - **💬 AI Chat Assistant:** Powered by Google Gemini 1.5 Flash with medical guidelines, web search, and image analysis
  - **📅 Health Records:** Integrated calendar with comprehensive tracking and trend visualization
  - **⚙️ Advanced Settings:** Complete data management, import/export, and health profile insights

- **Intelligent Risk Assessment System:**
  - **Data-Driven Predictions:** 5-factor gout risk calculation (0-100 scale) based on symptoms, uric acid levels, hydration, medication adherence, and diet
  - **Weekly Trend Analysis:** Machine learning-powered 7-day risk forecasting using historical patterns
  - **Personalized Insights:** Daily tips and recommendations tailored to individual risk factors
  - **Real-Time Monitoring:** Instant risk updates as new health data is logged

- **Comprehensive Health Tracking:**
  - **Symptom Logging:** Pain location, intensity (0-10), associated symptoms, and detailed notes
  - **Medication Management:** Drug names, schedules, photos, and adherence tracking
  - **Diet Monitoring:** Meal descriptions, photos, purine content analysis, and timing
  - **Water Intake Tracking:** Daily hydration goals with multiple beverage types
  - **Uric Acid Monitoring:** Lab results, trends, and target management
  - **Medical Records:** Complete healthcare documentation with file attachments

- **Advanced AI Assistant:**
  - **Guideline-Based Knowledge:** Grounded in ACR, EULAR, and KCR medical standards
  - **Multimodal Analysis:** Image recognition for food and medication identification
  - **Live Web Search:** Real-time medical research with source citations
  - **Bilingual Support:** Full English and Korean language capabilities
  - **Cost Optimization:** Smart token usage with daily/monthly limits and monitoring

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

- **Node.js 18+** and **npm**
- **Modern web browser** (Chrome, Firefox, Safari, Edge)
- **Google Gemini API Key** (free: 1.5M tokens/month)

### Quick Setup

1. **Clone and Install:**
   ```bash
   git clone https://github.com/your-username/goutcare-ai.git
   cd goutcare-ai
   npm install
   ```

2. **Get Your API Key:**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a free Gemini API key (1.5M tokens/month included)

3. **Configure Environment:**
   ```bash
   # Create .env file
   echo "VITE_GEMINI_API_KEY=your-actual-api-key-here" > .env
   ```

4. **Start Development Server:**
   ```bash
   npm run dev
   # Open http://localhost:5173/
   ```

5. **Build for Production:**
   ```bash
   npm run build
   npm run preview
   ```

### ✅ Verification

After setup, you should see:
- 🏠 Smart dashboard with risk scores
- 💬 AI chat responding to questions  
- 📅 Interactive health calendar
- ⚙️ Settings with data management options

## 🎨 Revolutionary UI/UX (August 20, 2025)

### Complete Interface Transformation

GoutCare AI has been completely redesigned with a focus on simplicity, intelligence, and user empowerment:

#### 4-Section Navigation Revolution
- **🏠 Home:** Smart dashboard with risk prediction and quick actions
- **💬 Chat:** Focused AI conversation with medical expertise  
- **📅 Records:** Integrated calendar with comprehensive health tracking
- **⚙️ Settings:** Advanced data management and personalization

#### Smart Home Dashboard (2x2 Grid)
- **Today/Tomorrow Risk Scores:** Real-time gout attack probability (0-100)
- **Weekly Risk Prediction:** 7-day trend analysis based on personal data
- **Personalized Daily Tips:** AI-generated recommendations for optimal health
- **Quick Action Buttons:** One-tap access to symptom, medication, and diet logging

#### Intelligent Risk Assessment
- **5-Factor Analysis:** Symptoms (30%), Uric Acid (25%), Hydration (20%), Medication (15%), Diet (10%)
- **Machine Learning Predictions:** Historical pattern recognition for accurate forecasting
- **Dynamic Updates:** Risk scores adjust in real-time as new data is logged
- **Actionable Insights:** Specific recommendations to reduce identified risk factors

#### Enhanced Health Tracking
- **6 Tracking Categories:** Symptoms, medications, diet, water intake, uric acid levels, medical records
- **Visual Timeline:** Integrated calendar showing all health events with color coding
- **Trend Analysis:** Automatic pattern detection and correlation insights
- **File Attachments:** Support for photos and medical documents

## 📁 Project Structure

```
goutcare-ai/
├── App.tsx                          # 🔄 Main app with 4-section navigation
├── index.html                       # Entry HTML file
├── types.ts                         # 🔄 Extended TypeScript definitions
├── translations.ts                  # i18n support (EN/KO)
├── components/                      # React components
│   ├── MainNavigation.tsx           # 🆕 4-section navigation system
│   ├── SmartHomeDashboard.tsx       # 🆕 Intelligent 2x2 home dashboard
│   ├── AdvancedSettings.tsx         # 🆕 Comprehensive settings page
│   ├── ChatWindow.tsx               # AI conversation interface
│   ├── CalendarPanel.tsx            # Health records calendar
│   ├── WaterIntakeTracker.tsx       # 🆕 Hydration tracking
│   ├── UricAcidTracker.tsx          # 🆕 Uric acid monitoring
│   ├── MedicalRecordManager.tsx     # 🆕 Medical records with attachments
│   ├── SymptomCheckinModal.tsx      # Symptom logging
│   ├── MedicationLogModal.tsx       # Medication tracking
│   ├── DietLogModal.tsx             # Diet and nutrition logging
│   ├── SettingsModal.tsx            # Data management
│   ├── IconComponents.tsx           # 🔄 Professional SVG icon system
│   └── UsageMonitor.tsx             # AI cost tracking
├── services/                        # AI and external services
│   ├── geminiService.ts             # Original Gemini integration
│   ├── geminiOptimized.ts           # 🔄 Cost-optimized AI service
│   └── ai/                          # Extensible AI architecture
├── utils/                           # Utility functions
│   ├── riskCalculator.ts            # 🆕 Gout risk assessment engine
│   ├── parsers.ts                   # Data parsing utilities
│   └── imageUtils.ts                # Image processing
├── hooks/                           # Custom React hooks
│   └── useDebounce.ts
├── docs/                            # Documentation
│   ├── PROJECT_SUMMARY.md           # 🔄 Complete project overview
│   ├── DEVELOPMENT_SESSION_SUMMARY.md # 🆕 Latest development session
│   ├── prd.md                       # Product requirements
│   └── README.md                    # This file
└── deployment/                      # Build and deployment configs
```

### 🆕 New Components (August 20, 2025)
- **MainNavigation.tsx**: Clean 4-section navigation
- **SmartHomeDashboard.tsx**: Risk prediction dashboard
- **WaterIntakeTracker.tsx**: Daily hydration goals
- **UricAcidTracker.tsx**: Lab result monitoring
- **MedicalRecordManager.tsx**: Complete medical history
- **AdvancedSettings.tsx**: Unified settings interface

### 🔄 Enhanced Components
- **App.tsx**: Simplified navigation logic
- **IconComponents.tsx**: Professional SVG icons
- **types.ts**: Extended health tracking types

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.