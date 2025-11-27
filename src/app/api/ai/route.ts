import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt, schemaContext, mode = 'generate' } = body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: 'GEMINI_API_KEY not found in environment variables' },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    let systemPrompt = '';

    if (mode === 'explain') {
      systemPrompt = `
        You are a friendly and expert Senior Database Engineer. Imagine you are explaining this to a junior colleague or a product manager.
        
        Tone: Warm, encouraging, clear, and concise. Avoid overly robotic language. Use "we" and "you" to make it personal.
        
        Task: Analyze the following SQL query and provide a comprehensive explanation and optimization report.
        
        Query to Analyze: "${prompt}"
        
        Schema Context:
        ${JSON.stringify(schemaContext, null, 2)}
        
        Please provide the response in the following Markdown format:
        
        # 👋 Query Explanation
        [Explain what the query does in simple, clear English. Start with a friendly opening.]
        
        # 🧩 Logic Breakdown
        [Step-by-step breakdown of the query logic, e.g., joins, filters, aggregations]
        
        # ⚡ Performance Analysis
        [Analyze potential performance bottlenecks. Be honest but constructive.]
        
        # 🚀 Optimization Suggestions
        [Provide concrete suggestions to improve performance or readability]
        
        # ✨ Optimized Query
        \`\`\`sql
        [The optimized SQL query, if applicable]
        \`\`\`
        
        Return ONLY the Markdown text. Do NOT wrap it in JSON.
      `;
    } else if (mode === 'explain_schema') {
      systemPrompt = `
        You are an expert Database Architect.
        
        Task: Analyze the provided database schema and provide a comprehensive technical overview.
        
        Schema Context:
        ${JSON.stringify(schemaContext, null, 2)}
        
        User Request: "${prompt}"
        
        Please provide the response in the following Markdown format:
        
        # 🏗️ Database Overview
        [High-level summary of the database's purpose and domain]
        
        # 🔑 Key Tables & Entities
        [List main tables and explain their roles]
        
        # 🔗 Relationships & Schema Structure
        [Explain how tables are connected (foreign keys, logical relationships)]
        
        # 💡 Potential Use Cases
        [What kind of applications could be built with this?]
        
        Return ONLY the Markdown text. Do NOT wrap it in JSON.
      `;
    } else {
      systemPrompt = `
        You are a helpful and intelligent SQL Assistant. Your goal is to help the user get the data they need quickly and accurately.
        
        Tone: Friendly, professional, and efficient.
        
        Given the following database schema:
        ${JSON.stringify(schemaContext, null, 2)}
        
        User Request: "${prompt}"
  
        Respond with a JSON object containing:
        - "sql": The valid MySQL query (if applicable, otherwise empty string).
        - "message": A friendly, helpful conversational response. If generating SQL, briefly mention it (e.g., "Here is the query..."). If the user just says "Hi" or asks a question, answer them naturally.
        - "action": One of "VIEW_VISUALIZER", "VIEW_EER", or null. Set this if the user explicitly asks to see a visualization or diagram.
        - "visualization": (Optional) Object containing "type" ("bar", "line", "pie"), "xKey" (column name for X-axis), and "yKey" (column name for Y-axis). Include this ONLY if the user asks for a specific visualization configuration.
          - Example: "Show me a line chart of sales over time" -> { "type": "line", "xKey": "date", "yKey": "sales" }
          - Example: "Pie chart of users by country" -> { "type": "pie", "xKey": "country", "yKey": "count" }
  
        Return ONLY the JSON object, no markdown.
      `;
    }

    let result;
    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
      try {
        result = await model.generateContent(systemPrompt);
        break;
      } catch (err: any) {
        if (err.message?.includes('429') || err.status === 429) {
          retries++;
          console.warn(`Gemini API 429 hit. Retrying (${retries}/${maxRetries})...`);
          if (retries === maxRetries) throw err;
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries))); // 2s, 4s, 8s
        } else {
          throw err;
        }
      }
    }

    if (!result) throw new Error('Failed to generate content after retries');

    const response = await result.response;
    const text = response.text();

    // Clean up the response if it contains markdown code blocks
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

    if (mode === 'explain' || mode === 'explain_schema') {
      return NextResponse.json({ success: true, explanation: text });
    }

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(cleanText);
    } catch (e) {
      // Fallback if JSON parsing fails, assume it's just SQL
      parsedResponse = { sql: cleanText, action: null, message: "Here is the query you requested." };
    }

    return NextResponse.json({ success: true, ...parsedResponse });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
