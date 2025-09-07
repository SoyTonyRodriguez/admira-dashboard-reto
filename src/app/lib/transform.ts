export type RatesTS = Record<string, Record<string, number>>; // { '2025-08-01': { MXN: 16.7, EUR: 0.91, ... } }

export type Point = { date: string; value: number };

export function dateRangeKeys(ts: RatesTS) {
    // Get all date keys from the rates object and sort them
    console.log('[dateRangeKeys] input:', ts);
    const result = Object.keys(ts).sort();
    console.log('[dateRangeKeys] output:', result);
    return result;
}

export function toSeries(ts: RatesTS, symbol: string): Point[] {
    // Convert rates object to an array of Points for a given currency symbol
    console.log('[toSeries] input:', ts, symbol);
    const result = dateRangeKeys(ts)
        .map(d => ({ date: d, value: ts[d]?.[symbol] ?? NaN })) // Map each date to a Point
        .filter(p => Number.isFinite(p.value)); // Remove invalid values
    console.log('[toSeries] output:', result);
    return result;
}

export function movingAvg(series: Point[], window = 7): Point[] {
    // Calculate moving average for a series of Points
    console.log('[movingAvg] input:', series, window);
    const out: Point[] = [];
    let acc = 0;
    const buf: number[] = [];
    for (let i = 0; i < series.length; i++) {
        buf.push(series[i].value); // Add current value to buffer
        acc += series[i].value; // Add to accumulator
        if (buf.length > window) acc -= buf.shift()!; // Remove oldest if buffer exceeds window
        const avg = acc / buf.length; // Calculate average
        out.push({ date: series[i].date, value: avg });
    }
    console.log('[movingAvg] output:', out);
    return out;
}

export function normalize100(series: Point[]): Point[] {
    // Normalize series so first value is 100, others are percent of base
    console.log('[normalize100] input:', series);
    if (series.length === 0) return series;
    const base = series[0].value; // Use first value as base
    const result = series.map(p => ({ date: p.date, value: (p.value / base) * 100 }));
    console.log('[normalize100] output:', result);
    return result;
}

export function pctChange(series: Point[]): number {
    // Calculate percent change from first to last value in series
    console.log('[pctChange] input:', series);
    if (series.length < 2) return 0;
    const first = series[0].value;
    const last = series[series.length - 1].value;
    const result = ((last - first) / first) * 100;
    console.log('[pctChange] output:', result);
    return result;
}

export function upDownShare(series: Point[]) {
    // Calculate share of up, down, and flat movements in the series
    console.log('[upDownShare] input:', series);
    let up = 0, down = 0, flat = 0;
    for (let i = 1; i < series.length; i++) {
        const diff = series[i].value - series[i - 1].value;
        if (Math.abs(diff) < 1e-9) flat++; // No change
        else if (diff > 0) up++; // Value increased
        else down++; // Value decreased
    }
    const total = Math.max(1, up + down + flat); // Avoid division by zero
    const result = { up: up / total, down: down / total, flat: flat / total };
    console.log('[upDownShare] output:', result);
    return result;
}

export function groupBy(series: Point[], period: 'week' | 'month'): Point[] {
    // Group series by week or month and average values per group
    console.log('[groupBy] input:', series, period);
    const fmt = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' });
    const keyFn = (iso: string) => {
        const d = new Date(iso);
        if (period === 'week') {
            // Get Monday of the week for ISO week grouping
            const tmp = new Date(d);
            const day = (d.getUTCDay() + 6) % 7; // ISO week start Monday
            tmp.setUTCDate(d.getUTCDate() - day);
            return fmt.format(tmp);
        } else {
            // Use first day of month for monthly grouping
            return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-01`;
        }
    };
    const buckets: Record<string, { acc: number; n: number }> = {};
    for (const p of series) {
        const k = keyFn(p.date); // Get group key
        buckets[k] ??= { acc: 0, n: 0 };
        buckets[k].acc += p.value; // Accumulate value
        buckets[k].n += 1; // Count items in group
    }
    // Average values per group and sort by date
    const result = Object.entries(buckets)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => ({ date: k, value: v.acc / v.n }));
    console.log('[groupBy] output:', result);
    return result;
}
