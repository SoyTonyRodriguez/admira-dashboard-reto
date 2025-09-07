import { NextResponse } from 'next/server';
// Import NextResponse for API response

// Generates a synthetic fixture (60 days) for selected currencies
function generateFixture() {
    // List of currency symbols to generate data for
    const symbols = ['MXN','EUR','JPY','GBP','CAD','BRL','CLP','ARS','COP'];
    const days = 60; // Number of days to generate
    const today = new Date(); // Current date
    const base: Record<string, Record<string, number>> = {};
    // Loop backwards from today for 'days' days
    for (let i = days; i >= 0; i--) {
        const d = new Date(today);
        d.setUTCDate(today.getUTCDate() - i); // Get date 'i' days ago
        const key = d.toISOString().slice(0,10); // Format as YYYY-MM-DD
        base[key] = {} as any;
        for (const s of symbols) {
        // Generate a smooth pseudo-random curve for each currency
        const seed = Math.sin(i * (1 + symbols.indexOf(s)/10)) * 0.02;
        // Starting value for each currency
        const start = { MXN: 18, EUR: 0.92, JPY: 155, GBP: 0.78, CAD: 1.36, BRL: 5.1, CLP: 920, ARS: 950, COP: 4200 }[s] ?? 1;
        // Calculate value for this day and currency
        base[key][s] = Number((start * (1 + seed) * (1 + (i - days/2)/5000)).toFixed(4));
        }
    }
    // Return fixture object with base currency and rates
    return { base: 'USD', rates: base, success: true };
}

export async function GET() {
    // API route handler for GET requests
    // Respond with the generated fixture as JSON
    return NextResponse.json(generateFixture());
}