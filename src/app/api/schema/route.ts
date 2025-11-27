import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { host, user, password, database, port } = body;

    const connection = await mysql.createConnection({
      host,
      user,
      password,
      database,
      port: parseInt(port) || 3306,
      ssl: { rejectUnauthorized: false }
    });

    // Fetch tables
    const [tables]: any = await connection.execute('SHOW TABLES');
    const tableNames = tables.map((row: any) => Object.values(row)[0]);

    const schema: any = {};

    for (const table of tableNames) {
      const [columns]: any = await connection.execute(`DESCRIBE \`${table}\``);
      schema[table] = columns.map((col: any) => ({
        name: col.Field,
        type: col.Type,
        key: col.Key,
      }));
    }

    // Fetch Foreign Keys
    const [fks]: any = await connection.execute(`
      SELECT 
        TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = ? AND REFERENCED_TABLE_NAME IS NOT NULL
    `, [database]);

    const foreignKeys = fks.map((row: any) => ({
      table: row.TABLE_NAME,
      column: row.COLUMN_NAME,
      refTable: row.REFERENCED_TABLE_NAME,
      refColumn: row.REFERENCED_COLUMN_NAME
    }));

    await connection.end();

    return NextResponse.json({ success: true, schema, foreignKeys });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
