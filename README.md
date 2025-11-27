# SQL Editor Web App

A modern, serverless SQL Editor built with Next.js, Tailwind CSS, and Gemini AI. Ported from [MarshallxMG/SQL-Editor](https://github.com/MarshallxMG/SQL-Editor).

## Features
- 🚀 **Serverless Architecture**: Built on Next.js App Router.
- 💅 **Modern UI**: Styled with Tailwind CSS and Lucide icons.
- 🤖 **AI-Powered**: Generate SQL queries from natural language using Google Gemini.
- 📊 **Data Visualization**: View results in a clean, responsive table.
- 🔌 **Universal Connection**: Connect to any accessible MySQL database.

## Getting Started

### Prerequisites
- Node.js 18+
- A MySQL database
- Google Gemini API Key

### Installation

1.  Install dependencies:
    ```bash
    npm install
    ```

2.  Create `.env.local`:
    ```bash
    GEMINI_API_KEY=your_api_key
    ```

3.  Run locally:
    ```bash
    npm run dev
    ```

## Deployment

Deploy easily on [Vercel](https://vercel.com):

1.  Push to GitHub.
2.  Import into Vercel.
3.  Add `GEMINI_API_KEY` to Environment Variables.
4.  Deploy.

## License
MIT
