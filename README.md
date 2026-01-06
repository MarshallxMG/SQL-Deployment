# SQL Editor Web App

<p align="center">
  <img src="https://readme-typing-svg.herokuapp.com?font=Fira+Code&pause=1000&color=36BCF7&background=00000000&center=true&vCenter=true&width=500&lines=Modern+Serverless+SQL+Editor;Connect+to+TiDB;AI-Powered+Query+Generation;Visual+Data+Exploration;Built+with+Next.js+%2B+Tailwind" alt="Typing SVG" />
</p>

A modern, serverless SQL Editor built with Next.js, Tailwind CSS, and Gemini AI.

## 🎮 Try it Live

**[Open the App](https://sql-deployment-zeta.vercel.app/)**

### 🔑 Guest Credentials
Want to create your own tables and explore? Use these credentials to access the **Demo Database**.
You have **FULL ACCESS** to this database (Create, Read, Update, Delete).

| Field | Value |
| :--- | :--- |
| **Host** | `gateway01.ap-northeast-1.prod.aws.tidbcloud.com` |
| **Port** | `4000` |
| **User** | `ABuAHqwviSXGzDa.guest` |
| **Password** | `guest123` |
| **Database** | `demo1` |

> **Note:** This is a shared demo environment. You can create tables and insert data freely in the `demo1` database!

## ✨ Features
- 🚀 **Serverless Architecture**: Fast and lightweight.
- 💅 **Modern UI**: Beautiful dark mode with Tailwind CSS.
- 🤖 **AI-Powered**: Ask questions in plain English to generate SQL.
- 📊 **Data Visualization**: Automatically graph your query results.
- 🔌 **Universal Connection**: Connect to your own TiDB, MySQL.

📖 **[Read Full Documentation](PROJECT_DOCS.md)**

---

### 🛠️ For Developers
If you want to run this project locally:

1.  **Clone the repo**
2.  **Install dependencies**: `npm install`
3.  **Set up Environment**: Create `.env.local` with `GEMINI_API_KEY`
4.  **Run**: `npm run dev`
