
# GoutCare AI ✨

**Your Personal AI Assistant for Gout Management, Powered by Google Gemini**

GoutCare AI is a privacy-first, browser-based application designed to help individuals manage gout. It combines a knowledgeable AI assistant, grounded in medical guidelines and powered by the Google Gemini API, with a comprehensive health dashboard for symptom tracking. All user data is stored exclusively on the user's device, ensuring complete privacy.

![GoutCare AI Screenshot](https://storage.googleapis.com/aip-dev-user-uploads/user-46549a75-1025-4591-95fd-2e70b22a2c17/57a75225-b467-4389-8b01-b5866162153c.png)

*The user interface features a Health Dashboard on the left for symptom tracking and a conversational AI chat window on the right.*

---

## 🚀 Key Features

- **Intelligent & Empathetic AI Assistant:**
  - **Powered by Google Gemini (`gemini-2.5-flash`):** Provides intelligent, context-aware answers.
  - **Guideline-Based Knowledge:** Core knowledge is based on established gout management guidelines.
  - **Sophisticated Dialogue:** Employs advanced, multi-step logic to handle sensitive topics like atypical symptoms and medication questions with empathy and caution.
  - **Live Web Search:** Uses the Gemini `googleSearch` tool to find up-to-date information, complete with source citations.
  - **Multilingual:** Fully supports both English and Korean.

- **Comprehensive Health Dashboard:**
  - **Interactive Symptom Calendar:** A responsive calendar that displays a monthly view on desktops and a weekly view on mobile devices.
  - **Visual Pain Tracking:** Logged symptoms are marked on the calendar with a color-coded dot representing the pain level, making it easy to spot patterns.
  - **Detailed Tooltips:** Hover over a date to see a detailed summary of the logged symptoms.
  - **Today's Tip:** A motivational widget that displays daily tips for gout management.

- **Seamless Symptom Logging:**
  - **Intuitive Modal:** A simple and clean interface to log pain location, pain level (0-10), associated symptoms (swelling, redness, etc.), and personal notes.
  - **Automatic Chat Integration:** Logged symptoms are automatically formatted and sent to the chat, creating a continuous record that the AI can reference.

- **Privacy-First Data Management:**
  - **100% Client-Side:** All conversation history and symptom data are stored directly in the browser's `localStorage`.
  - **AI-Powered Health Summary:** Generates a concise summary of key health information from your conversation history, running entirely on your device.
  - **Conversation Export:** Allows you to export your entire chat history as a `.txt` file.
  - **No Data Collection:** The application does not send any personal health data to a server.

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

## 📁 Project Structure

```
.
├── components/         # Reusable React components
│   ├── ChatWindow.tsx
│   ├── DashboardPanel.tsx
│   ├── HealthSummaryModal.tsx
│   ├── IconComponents.tsx
│   └── SymptomCheckinModal.tsx
├── services/           # Services for external APIs
│   └── geminiService.ts
├── translations.ts     # i18n translations for EN/KO
├── types.ts            # TypeScript type definitions
├── App.tsx             # Main application component
├── index.html          # Entry HTML file
├── index.tsx           # React root entry point
└── README.md           # This file
```

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.