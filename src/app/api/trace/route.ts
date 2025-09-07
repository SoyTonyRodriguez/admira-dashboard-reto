import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const p = path.join(process.cwd(), 'server', 'logs', 'http_trace.jsonl');
        const data = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
        return new NextResponse(data, { status: 200, headers: { 'content-type': 'text/plain; charset=utf-8' } });
    } catch {
        return new NextResponse('', { status: 200 });
    }
}
