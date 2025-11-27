# SQL Editor Project Documentation

## 1. Project Overview
This project is a modern, serverless SQL Editor built with **Next.js 14 (App Router)**. It allows users to connect to any MySQL-compatible database (TiDB, AWS RDS, PlanetScale, etc.), run queries, visualize results, and use AI to generate SQL.

## 2. Architecture & Tech Stack
- **Framework**: Next.js 14 (React, TypeScript)
- **Styling**: Tailwind CSS
- **Database Client**: `mysql2` (Promise-based)
- **AI Integration**: Google Gemini API (`@google/generative-ai`)
- **Icons**: Lucide React
- **Deployment**: Vercel (Serverless Functions)

## 3. Directory Structure
```
src/
├── app/                 # Next.js App Router pages and API routes
│   ├── api/             # Backend API endpoints
│   │   ├── ai/          # AI SQL generation
│   │   ├── connect/     # Database connection testing
│   │   ├── import/      # SQL file import
│   │   ├── query/       # SQL query execution
│   │   └── schema/      # Database schema fetching
│   ├── layout.tsx       # Main app layout (providers, global styles)
│   └── page.tsx         # Main dashboard page
├── components/          # React UI components
│   ├── ChatSidebar.tsx  # AI Chat interface
│   ├── ConnectionModal.tsx # Database connection form
│   ├── DataVisualizer.tsx # Charts and graphs
│   ├── ResultTable.tsx  # Query results table
│   ├── SQLEditor.tsx    # Monaco-based SQL code editor
│   └── VisualQueryBuilder.tsx # Drag-and-drop query builder
├── hooks/               # Custom React hooks
│   └── useSqlExecutor.ts # Logic for running queries
└── lib/                 # Utility functions
    └── utils.ts         # Helper functions (class names, etc.)
```

## 4. Core Features & Components

### SQL Editor (`SQLEditor.tsx`)
- Provides a code editor interface with syntax highlighting.
- Supports running selected code or the full script.
- "Explain" feature uses AI to explain complex queries.

### AI Chat (`ChatSidebar.tsx`)
- Integrated with Google Gemini.
- Context-aware: Knows the current database schema.
- Users can ask natural language questions (e.g., "Show me top 5 users") and get SQL code.

### Visual Query Builder (`VisualQueryBuilder.tsx`)
- No-code interface for building queries.
- Users select tables, columns, and filters visually.
- Generates valid SQL automatically.

### Data Visualization (`DataVisualizer.tsx`)
- Automatically detects data types in query results.
- Suggests appropriate charts (Bar, Line, Pie, Scatter).
- Interactive charts using `recharts`.

## 5. API Reference

### `POST /api/connect`
- **Purpose**: Test a database connection.
- **Body**: `{ host, user, password, port, database }`
- **Returns**: `{ success: true, message: "Connected" }` or error details.

### `POST /api/query`
- **Purpose**: Execute SQL queries.
- **Body**: `{ connection, query }`
- **Returns**: `{ results, fields, executionTime }`
- **Notes**: Supports multiple statements.

### `POST /api/ai`
- **Purpose**: Generate SQL or explain queries using AI.
- **Body**: `{ prompt, schema, type }` (type: 'generate' or 'explain')
- **Returns**: `{ sql, explanation }`

### `POST /api/import`
- **Purpose**: Import a `.sql` file into the database.
- **Body**: `{ connection, sqlContent }`
- **Returns**: `{ success, statementCount }`

### `POST /api/schema`
- **Purpose**: Fetch database tables and columns for the sidebar.
- **Body**: `{ connection }`
- **Returns**: `{ tables: { [tableName]: [columns] } }`

## 6. Environment Variables
| Variable | Description | Required? |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Google AI Studio API Key | **Yes** |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary Cloud Name | No (for future media) |
| `NEXT_PUBLIC_CLOUDINARY_API_KEY` | Cloudinary API Key | No |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret | No |

## 7. Troubleshooting

### `ENOTFOUND` Error
- **Cause**: Incorrect Hostname or trailing slash.
- **Fix**: Ensure Host is correct (e.g., `gateway01...tidbcloud.com`) and has no `http://` or `/` at the end.

### `Access Denied` Error
- **Cause**: Wrong Username/Password or missing permissions.
- **Fix**: Check credentials. For TiDB Serverless, ensure username includes the prefix (e.g., `ABuAHqwviSXGzDa.root`).

### `ECONNREFUSED 127.0.0.1`
- **Cause**: Trying to use `localhost` on a deployed Vercel app.
- **Fix**: Use a cloud database (TiDB, AWS) instead of localhost.
