# Credify.ai 🚀

Credify.ai is an AI-powered financial technology application built with React, Vite, and TypeScript. It leverages advanced Gemini AI models via Google AI Studio to evaluate, analyze, and streamline credit assessment and loan eligibility checks.

## ✨ Features

- **AI-Driven Assessment:** Leverages Google's Gemini models for intelligent financial analysis.
- **Instant Insights:** Provides users with real-time feedback on their credit profiles and eligibility.
- **Modern Tech Stack:** Fast, responsive frontend powered by React, Vite, and TypeScript.

## 🛠️ Tech Stack

- **Frontend:** React, TypeScript
- **Build Tool:** Vite
- **AI Integration:** Google AI Studio (Gemini API)

## 📋 Prerequisites

Before running this project locally, ensure you have the following installed:
- [Node.js](https://nodejs.org) (v18.0.0 or higher recommended)
- `npm` or `yarn` package manager

## 🚀 Getting Started

Follow these steps to set up and run the project locally on your machine.

### 1. Clone the Repository
```bash
git clone https://github.com
cd Credify.ai
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory of your project (copying the layout from `.env.example`) and add your Google AI Studio API key:

```env
VITE_GEMINI_API_KEY=your_actual_api_key_here
```

> ⚠️ **Important Security Note:** Never commit your actual `.env` file containing the secret API key to GitHub. The project's `.gitignore` file is configured to protect this data.

### 4. Run the Development Server
```bash
npm run dev
```
Open your browser and navigate to the local URL provided in the terminal (usually `http://localhost:5173`) to see the app in action.

### 5. Build for Production
To create a production-ready optimized build bundle:
```bash
npm run build
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
