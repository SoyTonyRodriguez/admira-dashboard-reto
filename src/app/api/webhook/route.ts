import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const LOG_DIR = path.join(process.cwd(), 'server', 'logs');
const WEBHOOK_FILE = path.join(LOG_DIR, 'webhook.jsonl');

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));
        fs.mkdirSync(LOG_DIR, { recursive: true });
        const entry = { ts: new Date().toISOString(), ...body };
        fs.appendFileSync(WEBHOOK_FILE, JSON.stringify(entry) + '\n');
        return NextResponse.json({ ok: true }, { status: 200 });
    } catch (e: any) {
        return NextResponse.json({ ok: false, error: e?.message || 'unknown' }, { status: 500 });
    }
}

export async function GET() {
    const data = fs.existsSync(WEBHOOK_FILE) ? fs.readFileSync(WEBHOOK_FILE, 'utf8') : '';
    return new NextResponse(data, { status: 200, headers: { 'content-type': 'text/plain; charset=utf-8' } });
}