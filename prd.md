# GoutCare AI: Product Requirements Document (PRD)

**Version:** 1.0 (As of current build)
**Status:** In Development

---

## 1. Introduction

GoutCare AI is a personalized AI assistant designed to help gout patients better understand and manage their condition. It provides reliable information based on medical guidelines, systematic symptom tracking, and a personalized conversational experience, all integrated into a single application. All conversation history and symptom data are stored exclusively on the user's device to ensure complete privacy.

## 2. Product Goals & Vision

-   **Provide Reliable Information:** Reduce confusion from misinformation by offering accurate and safe information based on verified gout management guidelines and the latest web search results.
-   **Systematic Symptom Management:** Help users with long-term management by enabling them to easily log their daily pain levels and symptoms and visually track patterns through a calendar.
-   **Deliver a Personalized Experience:** Provide tailored responses and interactions, like a personal health assistant, by remembering past conversations and symptom logs.
-   **Empower Users:** Empower users to actively manage their condition and share more specific information during doctor consultations.

## 3. Target Audience

-   **Newly Diagnosed Patients:** Users who are confused about their condition and need basic information on how to manage it.
-   **Chronic Gout Sufferers:** Users who require long-term management of diet, medication, and lifestyle, and want to consistently track symptom changes.
-   **Family and Caregivers:** Users seeking accurate information and management methods to care for a gout patient.

## 4. Key Features

### 4.1. Conversational AI Agent
-   **Guideline-Based Responses:** Answers questions about diet, lifestyle, and medications based on a synthesis of internationally recognized medical guidelines, specifically the **2020 American College of Rheumatology (ACR) Guideline**, **EULAR recommendations**, and the **Korean College of Rheumatology (KCR) Guideline**. The guidelines are available in English and Korean. The AI's knowledge also includes an understanding of the complex relationship between gout and major chronic diseases (comorbidities) like Chronic Kidney Disease (CKD), Cardiovascular Disease (CVD), and Metabolic Syndrome, based on recent medical reviews. This knowledge base also covers the critical role of lifestyle factors, such as the direct link between obesity, lack of exercise, and their impact on uric acid levels and gout management. The AI's knowledge now includes a detailed list of common foods categorized by their purine content (mg per 100g), allowing it to offer more specific dietary advice.
-   **Intelligent Web Search:** When a user asks a question not covered by the guidelines, it performs a Google Search to provide a summarized answer with reliable sources.
-   **Natural Conversation Flow:** Remembers the context of past conversations and avoids redundant citations to maintain a natural dialogue.
-   **Markdown Rendering:** Renders bold text, lists, and other formatting in the AI's responses as clean HTML for improved readability.
-   **Safety-First Design:** Does not provide medical diagnoses or prescriptions and includes a disclaimer advising consultation with a professional in every response.
-   **Empathetic & Safe Interaction Logic:** The AI is programmed with sophisticated, multi-step response protocols for sensitive user queries. For atypical symptoms, it validates the user's concern, presents alternative causes, compares with typical symptoms, and suggests next steps. For medication questions, it responds with empathy while safely guiding the user toward professional consultation. It also handles requests to "learn" new material by transparently explaining its real-time search capabilities.

### 4.2. Health Dashboard
-   **Symptom Calendar:**
    -   **Monthly/Weekly View:** Displays a monthly calendar on desktop and a weekly view on mobile for an at-a-glance look at symptom history.
    -   **Pain Level Visualization:** Marks logged dates with a color-coded dot (green/yellow/orange/red) corresponding to the pain level, making severity easy to grasp.
    -   **Detailed Tooltips:** Hovering over a date reveals a tooltip with a summary of the symptoms logged on that day.
-   **Tip of the Day:** A widget that randomly displays useful daily tips (e.g., stay hydrated, recommended foods) to motivate the user.

### 4.3. Symptom Logging
-   **Intuitive Input Modal:** A modal window allows for quick and easy symptom entry.
-   **Detailed Fields:** Users can log the pain location, pain level (via a slider), other symptoms (swelling, redness), and additional notes.
-   **Automatic Chat Integration:** Upon completion, the log is formatted into a standardized text summary and sent to the chat, allowing the AI to acknowledge and use this information in the conversation.

### 4.4. Data Management & Privacy
-   **Local-Only Storage:** All conversation history and symptom data are stored exclusively in the user's web browser `LocalStorage`.
-   **No Server-Side Data:** Sensitive health information is never sent to or stored on an external server, ensuring complete privacy.
-   **AI-Powered Health Summary:** A feature that allows users to generate an on-device summary of key health information shared during the conversation, without data leaving their browser.
-   **Conversation History Import/Export:** Features to download the complete chat history as a text file for backup and to import a history file, overwriting the current session.
-   **Chat Reset:** A feature allows users to clear all their data and start fresh at any time.

## 5. UI/UX Design

-   **Design Philosophy:** A calm and intuitive design that helps users comfortably access information and focus on their health.
-   **Brand Identity:** The application title is consistently displayed as "GoutCare AI" across all languages to maintain a strong and recognizable brand identity.
-   **Layout:** A responsive two-panel design that provides an optimal experience on all devices, showing the dashboard and chat side-by-side on desktops and a stacked view on mobile.
-   **Color Palette:** A dark mode theme (based on Zinc/Slate colors) to reduce eye strain, with Teal and Sky Blue as accent colors to build a sense of trust and clarity.
-   **Accessibility:** Designed with accessibility in mind, using clear icons, ARIA labels, and a logical layout.

## 6. Technical Stack

-   **Frontend:** React, TypeScript, Tailwind CSS
-   **AI Model:** Google Gemini API (`gemini-2.5-flash` model)
-   **AI SDK:** `@google/genai`
-   **Core AI Feature:** Gemini `googleSearch` Tool
-   **Data Storage:** Browser LocalStorage

## 7. Future Roadmap

-   **Data Visualization:** Add charts and graphs to visualize trends in pain levels and symptom frequency over time.
-   **Data Export:** Allow users to export their symptom logs as a PDF or CSV file to share with their doctor.
-   **Medication Tracking:** A feature to log medications and set reminders for dosages.
-   **Push Notifications:** Implement notifications for symptom logging reminders and medication alerts.
