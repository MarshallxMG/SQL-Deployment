# 📘 SQL Editor - The Ultimate Guide

Welcome to the **SQL Editor**! This document is designed to help you understand exactly what this tool is, how to use it, and how it works under the hood.

---

## 🌟 Part 1: User Guide (For Everyone)

### 1. What is this tool?
Think of this application as a **"Web Browser for your Database"**.
Just like Chrome lets you browse the internet, this SQL Editor lets you browse, search, and modify your database.

**Key Features:**
*   **Connect Anywhere:** Works with MySQL, TiDB, AWS RDS, PlanetScale, and more.
*   **AI Assistant:** Don't know SQL? Just ask plain English questions like *"Show me the newest users"*.
*   **Visual Builder:** Drag and drop to build queries without writing code.
*   **Charts:** Instantly turn your data into Bar, Line, or Pie charts.

### 2. How to Connect
When you first open the app, you will see a **Connection Screen**. You need "Keys" to enter the "House" (Database).

#### Option A: Use the Demo (Try it out!)
If you just want to play around, use these credentials:
*   **Host:** `gateway01.ap-northeast-1.prod.aws.tidbcloud.com`
*   **Port:** `4000`
*   **User:** `ABuAHqwviSXGzDa.guest`
*   **Password:** `guest123`
*   **Database:** `demo1`

#### Option B: Connect Your Own Database
If you have your own database (e.g., from TiDB Cloud or AWS), enter your own details:
*   **Host:** The address of your server (e.g., `xxx.tidbcloud.com`).
*   **User/Password:** Your personal login.
*   **Database:** The specific database you want to open.

### 3. The Interface Explained

#### 🏠 The Sidebar (Left)
*   **SQL Editor:** The main screen where you write code.
*   **Data:** Browse your tables and see raw data.
*   **History:** See queries you ran in the past.
*   **Saved Queries:** Your favorite snippets.

#### 📝 The Editor (Center)
*   **Code Box:** Type your SQL here (e.g., `SELECT * FROM users`).
*   **Run Button (▶):** Executes the code.
*   **Explain Button:** Uses AI to explain what your complex query does.

#### 🤖 AI Chat (Right Sidebar)
*   Click the **"Ask AI"** button.
*   Type a question: *"Who spent the most money in 2024?"*
*   The AI will write the SQL code for you! Click "Insert" to put it in the editor.

#### 📊 Visual Builder (Tab)
*   Don't like code? Click the **"Visual Builder"** tab.
*   Select a **Table** from the dropdown.
*   Select **Columns** you want to see.
*   Add **Filters** (e.g., `Age > 18`).
*   It builds the query for you automatically!

### 4. Common Tasks

**How to create a new table?**
1.  Type this in the editor:
    ```sql
    CREATE TABLE my_table (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255)
    );
    ```
2.  Click **Run**.

**How to import data?**
1.  Click the **Import Icon** (📁) in the toolbar.
2.  Select a `.sql` file from your computer.
3.  The app will run all the commands in that file.

**How to export data?**
1.  Run a query to get results.
2.  Click the **Download CSV** or **Download JSON** buttons above the result table.

---

## 🛠️ Part 2: Developer Guide (For Coders)

### 1. Architecture
This project uses a **Serverless Architecture** powered by Next.js.
*   **Frontend:** React, Tailwind CSS, Lucide Icons.
*   **Backend:** Next.js API Routes (Serverless Functions).
*   **Database Client:** `mysql2` library (Connection pooling not used due to serverless nature).
*   **AI:** Google Gemini API.

### 2. Project Structure
```
src/
├── app/                 # Next.js App Router
│   ├── api/             # Backend Endpoints
│   │   ├── connect/     # Validates connection details
│   │   ├── query/       # Executes SQL (The engine)
│   │   ├── ai/          # Generates SQL from text
│   │   └── import/      # Handles file uploads
│   └── page.tsx         # The main Single Page Application (SPA)
├── components/          # UI Building Blocks
│   ├── SQLEditor.tsx    # The code editor (Monaco)
│   ├── ResultTable.tsx  # The data grid
│   └── ChatSidebar.tsx  # The AI interface
└── hooks/               # Logic
    └── useSqlExecutor.ts # Central hook for running queries
```

### 3. Key Technical Decisions
*   **No Server-Side Session:** We do NOT store database passwords on the server. They are stored in the user's browser (`localStorage`) and sent with every request. This ensures privacy and statelessness.
*   **Streaming AI:** The AI chat does not stream yet (future improvement), but uses a robust prompt engineering approach to understand database schema.
*   **Security:** Inputs are sanitized to prevent basic injection, but the tool is intended for authenticated users who *own* the database.

### 4. Setup for Local Development
1.  **Clone:** `git clone https://github.com/MarshallxMG/SQL-Deployment.git`
2.  **Install:** `npm install`
3.  **Env:** Create `.env.local` with `GEMINI_API_KEY=...`
4.  **Run:** `npm run dev`

---

## ❓ FAQ

**Q: Is my data safe?**
A: Yes. Your database credentials are saved in your browser, not on our servers. The app talks directly to your database.

**Q: Can I use this on my phone?**
A: Yes! The UI is responsive, but it works best on a tablet or desktop for complex queries.

**Q: Why do I get "Access Denied"?**
A: You might be trying to access a database your user doesn't have permission for. Check your username and database name.

**Q: Is it free?**
A: The app itself is free and open source. You may pay for your own database hosting (e.g., AWS, TiDB) depending on their pricing.
