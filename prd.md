# GoutCare AI: Product Requirements Document (PRD)

**Version:** 1.1 (As of current build)
**Status:** In Development

---

## 1. Introduction

GoutCare AI is a personalized AI assistant designed to help gout patients better understand and manage their condition. It provides reliable information based on medical guidelines, systematic health tracking (symptoms, medication, and diet), and a personalized conversational experience, all integrated into a single application. All conversation history and health data are stored exclusively on the user's device to ensure complete privacy.

## 2. Product Goals & Vision

-   **Provide Reliable Information:** Reduce confusion from misinformation by offering accurate and safe information based on verified gout management guidelines and the latest web search results.
-   **Systematic Health Management:** Help users with long-term management by enabling them to easily log their daily symptoms, medication intake, and meals, and visually track patterns through a unified calendar.
-   **Deliver a Personalized Experience:** Provide tailored responses and interactions, like a personal health assistant, by remembering past conversations and health logs.
-   **Empower Users:** Empower users to actively manage their condition and share more specific information during doctor consultations.

## 3. Target Audience

-   **Newly Diagnosed Patients:** Users who are confused about their condition and need basic information on how to manage it.
-   **Chronic Gout Sufferers:** Users who require long-term management of diet, medication, and lifestyle, and want to consistently track health data.
-   **Family and Caregivers:** Users seeking accurate information and management methods to care for a gout patient.

## 4. Key Features

### 4.1. Conversational AI Agent
-   **Guideline-Based Responses:** Answers questions about diet, lifestyle, and medications based on a synthesis of internationally recognized medical guidelines. The AI's knowledge now includes a detailed list of common foods categorized by their purine content (mg per 100g), allowing it to offer more specific dietary advice.
-   **Multimodal Log Analysis:** The AI analyzes user-submitted health logs for symptoms, medication, and diet. It can interpret text and user-uploaded images (e.g., photos of meals or pills) to provide relevant feedback based on its guidelines, such as assessing the purine content of a meal from a picture.
-   **Intelligent Web Search:** When a user asks a question not covered by the guidelines, it performs a Google Search to provide a summarized answer with reliable sources.
-   **Natural Conversation Flow:** Remembers the context of past conversations and avoids redundant citations to maintain a natural dialogue.
-   **Markdown Rendering:** Renders bold text, lists, and other formatting in the AI's responses as clean HTML for improved readability.
-   **Safety-First Design:** Does not provide medical diagnoses or prescriptions and includes a disclaimer advising consultation with a professional in every response.
-   **Empathetic & Safe Interaction Logic:** The AI is programmed with sophisticated, multi-step response protocols for sensitive user queries, such as atypical symptoms or medication questions.

### 4.2. Health Dashboard
-   **Unified Log Calendar:**
    -   A central calendar displays a comprehensive view of the user's health history.
    -   **Multi-Icon Display:** Logged dates are marked with distinct icons for symptoms (❤️), medication (💊), and diet (🍴), making it easy to see daily activity at a glance.
    -   **Detailed Tooltips:** Hovering over a date reveals a tooltip with a summary of all logs for that day.
-   **Tabbed Interface:** The dashboard is organized into three tabs—Symptoms, Medication, and Diet—allowing for focused and intuitive log entry.
-   **Personalized Gout Forecast:** The AI generates a 7-day forecast that combines weather data with the user's personal health profile (summarized from conversation history, including recent diet and medication adherence). This provides a more accurate, personalized gout risk assessment and actionable alerts.
-   **Tip of the Day:** A widget that randomly displays useful daily tips (e.g., stay hydrated, recommended foods) to motivate the user.

### 4.3. Health Logging
-   **Intuitive Input Modals:** Separate, easy-to-use modals for logging symptoms, medication, and diet.
-   **Symptom Logging:** Users can log the pain location, pain level (via a slider), other symptoms (swelling, redness), and additional notes.
-   **Medication Logging:** Users can record the medication name, time of day (morning, lunch, dinner, bedtime), intake time, notes, and an optional photo of the medication.
-   **Diet Logging:** Users can log meals with a description, time of day (breakfast, lunch, dinner, after dinner), notes, and an optional photo of the food for AI analysis.
-   **Automatic Chat Integration:** Upon completion, each log is formatted into a standardized text summary (with image if applicable) and sent to the chat, allowing the AI to acknowledge and use this information in the conversation.

### 4.4. Data Management & Privacy
-   **Local-Only Storage:** All conversation history and health data are stored exclusively in the user's web browser `LocalStorage`.
-   **No Server-Side Data:** Sensitive health information is never sent to or stored on an external server, ensuring complete privacy.
-   **AI-Powered Health Summary:** A feature that allows users to generate an on-device summary of key health information shared during the conversation, without data leaving their browser.
-   **Conversation History Import/Export:** Features to download the complete chat history (including images) as a `.json` file for backup and to import a history file, overwriting the current session.
-   **Chat Reset:** A feature allows users to clear all their data and start fresh at any time.

## 5. UI/UX Design

-   **Design Philosophy:** A calm and intuitive design that helps users comfortably access information and focus on their health.
-   **Layout:** A responsive two-panel design that provides an optimal experience on all devices, showing the dashboard and chat side-by-side on desktops and a stacked view on mobile. The dashboard features a clean, tab-based navigation system for different log types.
-   **Color Palette:** A dark mode theme (based on Zinc/Slate colors) to reduce eye strain, with Teal, Sky, and Amber as accent colors to build a sense of trust and clarity, and to differentiate between logging functions.
-   **Accessibility:** Designed with accessibility in mind, using clear icons, ARIA labels, and a logical layout.

## 6. Technical Stack

-   **Frontend:** React, TypeScript, Tailwind CSS
-   **AI Model:** Google Gemini API (`gemini-2.5-flash` model)
-   **AI SDK:** `@google/genai`
-   **Core AI Feature:** Gemini `googleSearch` Tool
-   **Data Storage:** Browser LocalStorage

## 7. Future Roadmap

-   **Data Visualization:** Add charts and graphs to visualize trends in pain levels, symptom frequency, and potential correlations with diet/medication logs.
-   **Advanced Medication Tracking:** Enhance the medication feature to include dosage tracking and set reminders for intake.
-   **Data Export:** Allow users to export their health logs as a PDF or CSV file to share with their doctor.
-   **Push Notifications:** Implement notifications for logging reminders and medication alerts.
