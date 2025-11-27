import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const host = formData.get('host') as string;
        const user = formData.get('user') as string;
        const password = formData.get('password') as string;
        const database = formData.get('database') as string;
        const port = formData.get('port') as string;

        if (!file) {
            return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        const decoder = new TextDecoder('utf-8');
        let query = decoder.decode(buffer);

        if (!query.trim()) {
            return NextResponse.json({ success: false, message: 'File is empty' }, { status: 400 });
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

        // Disable ONLY_FULL_GROUP_BY
        await connection.query("SET SESSION sql_mode=(SELECT REPLACE(@@sql_mode,'ONLY_FULL_GROUP_BY',''))");

        // Remove trailing semicolons
        let sql = query.trim();
        while (sql.endsWith(';')) {
            sql = sql.slice(0, -1).trim();
        }

        // Execute
        await connection.query(sql);
        await connection.end();

        return NextResponse.json({ success: true, message: 'Import successful' });
    } catch (error: any) {
        console.error('Import error:', error);
        return NextResponse.json(
            { success: false, message: error.message, sql: error.sql },
            { status: 500 }
        );
    }
}
