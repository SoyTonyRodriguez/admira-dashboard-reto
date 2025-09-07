import { NextRequest, NextResponse } from 'next/server';
// Import Next.js API types and Node.js modules for file and path operations
import fs from 'fs';
import path from 'path';

const LOG_DIR = path.join(process.cwd(), 'server', 'logs');
// Directory and file for logging HTTP traces
const TRACE_FILE = path.join(LOG_DIR, 'http_trace.jsonl');

async function sendWebhook(payload: any) {
// Send a webhook with the given payload if the URL is set in env
    const url = process.env.WEBHOOK_URL;
    if (!url) return;
    try {
        await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    } catch (e) {
        // no queremos romper el flujo si falla el webhook
    }
}

export async function GET(req: NextRequest) {
    // Extract query parameters or use defaults for start/end dates and symbols
    const start = req.nextUrl.searchParams.get('start') || new Date(Date.now() - 86_400_000*30).toISOString().slice(0,10);
    const end = req.nextUrl.searchParams.get('end') || new Date().toISOString().slice(0,10);
    const symbols = req.nextUrl.searchParams.get('symbols') || 'MXN,EUR,JPY,GBP';

    const url = `https://api.exchangerate.host/timeseries?base=USD&start_date=${start}&end_date=${end}&symbols=${encodeURIComponent(symbols)}`;
    // Build the external API URL for timeseries data
    const startedAt = Date.now();
    // Record start time for duration logging

    const token = process.env.ADMIRA_TOKEN || '';
    // Get Admira token from environment
    const headers: Record<string,string> = { 'X-Admira-Token': token };
    // Prepare custom headers for the request
    // Try to fetch data from the external API

    try {
        const r = await fetch(url, { headers: { ...headers } });
        // Fetch the timeseries data
        const status = r.status;
        // Save HTTP status
        const json = await r.json().catch(() => ({}));
        // Parse JSON response, fallback to empty object on error

        fs.mkdirSync(LOG_DIR, { recursive: true });
        // Ensure log directory exists
        const entry = {
        // Build log entry for this request
        ts: new Date().toISOString(),
        method: 'GET',
        url_base: url.split('?')[0],
        status,
        duration_ms: Date.now() - startedAt,
        headers: { 'x-admira-token': token ? 'set' : 'missing' },
        qs: { start, end, symbols }
        };
        fs.appendFileSync(TRACE_FILE, JSON.stringify(entry) + '\n');
        // Append log entry to trace file
        sendWebhook({ type: 'trace', ...entry }).catch(()=>{});
        // Send trace to webhook (non-blocking)

        if (!r.ok || !json?.rates) {
        // If request failed or rates missing, fallback to mock data
        // fallback a mock para mantener demo operativa
        const mockURL = new URL(req.url);
        mockURL.pathname = '/api/mock';
        const mock = await fetch(mockURL.toString());
        const mj = await mock.json();
        return NextResponse.json(mj, { status: 200, headers: { 'x-data-source': 'mock' } });  // Return mock data with header indicating source

        }
        // Return real data with header indicating source
        return NextResponse.json(json, { status, headers: { 'x-data-source': 'exchangerate.host' } });
    } catch (e: any) {
        // On error, log and send webhook, then return error response
        fs.mkdirSync(LOG_DIR, { recursive: true });
        fs.appendFileSync(TRACE_FILE, JSON.stringify({ ts: new Date().toISOString(), error: e?.message || 'unknown' }) + '\n');
        sendWebhook({ type: 'error', message: e?.message || 'unknown' }).catch(()=>{});
        return NextResponse.json({ error: 'Proxy error' }, { status: 500 });
    }
}