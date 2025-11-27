import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { host, user, password, database, port, query } = body;

    if (!query) {
      return NextResponse.json({ success: false, message: 'Query is required' }, { status: 400 });
    }

    const connection = await mysql.createConnection({
      host,
      user,
      password,
      database,
      port: parseInt(port) || 3306,
      multipleStatements: true,
      ssl: { rejectUnauthorized: false }
    });

    // Disable ONLY_FULL_GROUP_BY to allow flexible grouping queries
    await connection.query("SET SESSION sql_mode=(SELECT REPLACE(@@sql_mode,'ONLY_FULL_GROUP_BY',''))");

    // Remove trailing semicolons to prevent "empty query" errors with multipleStatements: true
    let sql = query.trim();
    while (sql.endsWith(';')) {
      sql = sql.slice(0, -1).trim();
    }

    const [rows, fields] = await connection.query(sql);
    await connection.end();

    return NextResponse.json({ success: true, rows, fields });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

