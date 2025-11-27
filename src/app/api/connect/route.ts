import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

// POST: Test or Connect
export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { host, user, password, database, port, createDatabase } = body;

    // If creating a database, first connect without specifying one
    const connection = await mysql.createConnection({
      host,
      user,
      password,
      port: parseInt(port) || 3306,
      database: createDatabase ? undefined : database,
      ssl: { rejectUnauthorized: false }
    });

    if (createDatabase) {
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
      await connection.changeUser({ database });
    }

    await connection.end();

    return NextResponse.json({
      success: true,
      message: createDatabase ? 'Database created and connected' : 'Connection successful'
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
