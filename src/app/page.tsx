
'use client';

import { useEffect, useMemo, useState } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { Card, Spinner, useTopN } from '@/app/components/ui';
import { RatesTS, toSeries, movingAvg, normalize100, pctChange, upDownShare, groupBy } from '@/app/lib/transform';

const ALL = ['MXN','EUR','JPY','GBP','CAD','BRL','CLP','ARS','COP'] as const;

type FetchState = 'idle' | 'loading' | 'success' | 'error' | 'empty';

export default function Page() {
    const [start, setStart] = useState<string>(() => new Date(Date.now() - 1000*60*60*24*60).toISOString().slice(0,10));
    const [end, setEnd] = useState<string>(() => new Date().toISOString().slice(0,10));
    const [sel, setSel] = useState<string[]>(['MXN','EUR','JPY','GBP']);
    const [symbol, setSymbol] = useState<string>('MXN');
    const [state, setState] = useState<FetchState>('idle');
    const [data, setData] = useState<RatesTS | null>(null);
    const [error, setError] = useState<string>('');
    const [period, setPeriod] = useState<'day'|'week'|'month'>('day');

    const fetchData = async () => {
        setState('loading');
        setError('');
        try {
        const url = `/api/timeseries?start=${start}&end=${end}&symbols=${sel.join(',')}`;
        const r = await fetch(url);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j = await r.json();
        if (!j?.rates || Object.keys(j.rates).length === 0) { setState('empty'); setData(null); return; }
        setData(j.rates as RatesTS);
        setState('success');
        } catch (e: any) {
        setError(e?.message || 'Error desconocido');
        setState('error');
        }
    };

    useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, []);

    const baseSeries = useMemo(() => data ? toSeries(data, symbol) : [], [data, symbol]);
    const seriesMA7 = useMemo(() => movingAvg(baseSeries, 7), [baseSeries]);
    const aggSeries = useMemo(() => {
        if (!baseSeries.length) return baseSeries;
        if (period === 'day') return baseSeries;
        return groupBy(baseSeries, period);
    }, [baseSeries, period]);

    const normalizedMulti = useMemo(() => {
        if (!data) return [] as Array<{ date: string } & Record<string, number>>;
        const dates = Object.keys(data).sort();
        return dates.map(d => {
        const row: any = { date: d };
        for (const c of sel) {
            const s = toSeries(data, c);
            const n = normalize100(s);
            const found = n.find(p => p.date === d);
            row[c] = found?.value ?? null;
        }
        return row;
        });
    }, [data, sel]);

    const topList = useMemo(() => {
        if (!data) return [] as { symbol: string; change: number }[];
        return sel.map(s => ({ symbol: s, change: pctChange(toSeries(data, s)) }))
        .sort((a,b) => Math.abs(b.change) - Math.abs(a.change))
        .slice(0, 8);
    }, [data, sel]);

    const ud = useMemo(() => upDownShare(baseSeries), [baseSeries]);

    const topN = useTopN(topList, 6, x => Math.abs(x.change));

    return (
        <div className="space-y-6">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card title="Filtros" actions={
            <button onClick={fetchData} className="rounded-xl px-3 py-1.5 text-sm bg-zinc-900 text-white dark:bg-white dark:text-black">Aplicar</button>
            }>
            <div className="grid grid-cols-2 gap-3">
                <div>
                <label className="text-xs">Inicio</label>
                <input type="date" value={start} onChange={e=>setStart(e.target.value)} className="w-full rounded-xl border p-2 bg-transparent" />
                </div>
                <div>
                <label className="text-xs">Fin</label>
                <input type="date" value={end} onChange={e=>setEnd(e.target.value)} className="w-full rounded-xl border p-2 bg-transparent" />
                </div>
                <div className="col-span-2">
                <label className="text-xs">Divisas</label>
                <div className="flex flex-wrap gap-2 mt-1">
                    {ALL.map(c => (
                    <button key={c} onClick={()=> setSel(p => p.includes(c) ? p.filter(x=>x!==c) : [...p, c])}
                        className={`px-2 py-1 rounded-lg border text-sm ${sel.includes(c)?'bg-zinc-900 text-white dark:bg-white dark:text-black':'bg-transparent'}`}>
                        {c}
                    </button>
                    ))}
                </div>
                </div>
                <div>
                <label className="text-xs">Símbolo activo</label>
                <select value={symbol} onChange={e=>setSymbol(e.target.value)} className="w-full rounded-xl border p-2 bg-transparent">
                    {sel.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                </div>
                <div>
                <label className="text-xs">Agregación</label>
                <select value={period} onChange={e=>setPeriod(e.target.value as any)} className="w-full rounded-xl border p-2 bg-transparent">
                    <option value="day">Día</option>
                    <option value="week">Semana</option>
                    <option value="month">Mes</option>
                </select>
                </div>
            </div>
            </Card>

            <Card title={`Tendencia ${symbol} (USD→${symbol}) + MA7`}>
            {state==='loading' && <Spinner/>}
            {state==='error' && <p className="text-sm text-red-600">Error: {error}</p>}
            {state==='empty' && <p className="text-sm">Sin datos en el rango seleccionado.</p>}
            {state==='success' && (
                <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={aggSeries} margin={{ left: 8, right: 8, top: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} hide={false} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v: any) => v.toFixed?.(4) ?? v} />
                    <Legend />
                    <Line type="monotone" dataKey="value" name={symbol} dot={false} />
                    <Line type="monotone" data={seriesMA7} dataKey="value" name="MA7" strokeDasharray="5 5" dot={false} />
                    </LineChart>
                </ResponsiveContainer>
                </div>
            )}
            </Card>

            <Card title="Top‑N % cambio (selección)">
            {state!=='success' ? (state==='loading'?<Spinner/>:<p className="text-sm opacity-80">{state==='error'?`Error: ${error}`:'Sin datos'}</p>) : (
                <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topN} margin={{ left: 8, right: 8, top: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="symbol" />
                    <YAxis />
                    <Tooltip formatter={(v: any) => `${v.toFixed?.(2)}%`} />
                    <Bar dataKey="change" name="% cambio" onClick={(_, idx) => setSymbol(topN[idx].symbol)} />
                    </BarChart>
                </ResponsiveContainer>
                </div>
            )}
            </Card>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Card title="Índice = 100 (multi‑divisa)">
            {state==='success' ? (
                <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={normalizedMulti} margin={{ left: 8, right: 8, top: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    {sel.map(s => (
                        <Area key={s} type="monotone" dataKey={s} name={s} stackId="1" />
                    ))}
                    </AreaChart>
                </ResponsiveContainer>
                </div>
            ) : state==='loading' ? <Spinner/> : <p className="text-sm opacity-80">{state==='error'?`Error: ${error}`:'Sin datos'}</p>}
            </Card>

            <Card title={`Días ↑ / ↓ / = en ${symbol}`}>
            {state==='success' ? (
                <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                    <Pie dataKey="value" nameKey="name" data={[
                        { name: 'Alcistas', value: ud.up },
                        { name: 'Bajistas', value: ud.down },
                        { name: 'Planos', value: ud.flat },
                    ]} innerRadius={60} outerRadius={90} label />
                    </PieChart>
                </ResponsiveContainer>
                </div>
            ) : state==='loading' ? <Spinner/> : <p className="text-sm opacity-80">{state==='error'?`Error: ${error}`:'Sin datos'}</p>}
            </Card>
        </section>

        <section>
            <Card title={`Detalle diario — ${symbol}`}>
            {state==='success' ? (
                <div className="max-h-80 overflow-auto">
                <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-zinc-100 dark:bg-zinc-800">
                    <tr>
                        <th className="text-left p-2">Fecha</th>
                        <th className="text-right p-2">Valor</th>
                    </tr>
                    </thead>
                    <tbody>
                    {toSeries(data!, symbol).map(r => (
                        <tr key={r.date} className="border-t border-zinc-200 dark:border-zinc-800">
                        <td className="p-2">{r.date}</td>
                        <td className="p-2 text-right">{r.value.toFixed(4)}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>
            ) : state==='loading' ? <Spinner/> : <p className="text-sm opacity-80">{state==='error'?`Error: ${error}`:'Sin datos'}</p>}
            </Card>
        </section>

        <footer className="text-xs text-zinc-500">Base USD. Fuente: exchangerate.host. Logs en <code>server/logs/http_trace.jsonl</code> and  weebhook <code>server/logs/webhook.jsonl</code> or http://localhost:3000/api/webhook</footer>
        </div>
    );
}