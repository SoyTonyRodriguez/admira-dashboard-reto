// AFTER
'use client'
import { Card, Spinner } from '@/app/components/ui';
import { useEffect, useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, BarChart, Bar, PieChart, Pie } from 'recharts';
import { toSeries, movingAvg, normalize100, pctChange, upDownShare } from '@/app/lib/transform';

export default function Page() {
    
    const [data, setData] = useState<any>(null);
    const [state, setState] = useState<'idle'|'loading'|'success'|'error'|'empty'>('idle');
    const [error, setError] = useState('');
    const [start, setStart] = useState<string>(() => new Date(Date.now()-1000*60*60*24*30).toISOString().slice(0,10));
    const [end, setEnd] = useState<string>(() => new Date().toISOString().slice(0,10));
    const [sel, setSel] = useState<string[]>(['MXN','EUR','JPY','GBP']);
    const ALL = ['MXN','EUR','JPY','GBP','CAD','BRL','CLP','ARS','COP'] as const;

    const [symbol, setSymbol] = useState<string>('MXN');

    const baseSeries = useMemo(() => data ? toSeries(data, symbol) : [], [data, symbol]);
    const seriesMA7 = useMemo(() => movingAvg(baseSeries, 7), [baseSeries]);
    const normalizedMulti = useMemo(() => {
        if (!data) return [] as any[];
        const dates = Object.keys(data).sort();
        return dates.map(d => {
            const row: any = { date: d };
            for (const c of sel) {
            const s = toSeries(data, c); const n = normalize100(s);
            row[c] = n.find(p => p.date === d)?.value ?? null;
            } return row;
        });
        }, [data, sel]);
        const topList = useMemo(() => {
        if (!data) return [] as { symbol: string; change: number }[];
        return sel.map(s => ({ symbol: s, change: pctChange(toSeries(data, s)) }))
            .sort((a,b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, 6);
        }, [data, sel]);
    const ud = useMemo(() => upDownShare(baseSeries), [baseSeries]);

    const fetchData = async () => {
    setState('loading'); setError('');
    try {
        const url = `/api/timeseries?start=${start}&end=${end}&symbols=${sel.join(',')}`;
        const r = await fetch(url);
        console.log('[Dashboard] Fetch URL:', url, 'Response:', r);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j = await r.json();
        if (!j?.rates || Object.keys(j.rates).length === 0) { setState('empty'); setData(null); return; }
        setData(j.rates); setState('success');
    } catch (e: any) { setError(e?.message || 'Error'); setState('error'); }
    };
    useEffect(() => { fetchData(); }, []);

    return (
        <div className="space-y-6">

            {state==='success' && (
                <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Card title={`Tendencia ${symbol} + MA7`}>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={baseSeries}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" /><YAxis /><Tooltip /><Legend />
                            <Line type="monotone" dataKey="value" name={symbol} dot={false} />
                            <Line type="monotone" data={seriesMA7} dataKey="value" name="MA7" strokeDasharray="5 5" dot={false}/>
                        </LineChart>
                        </ResponsiveContainer>
                    </div>
                    </Card>
                    <Card title="Top-N % cambio">
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topList}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="symbol" /><YAxis /><Tooltip />
                            <Bar dataKey="change" name="% cambio" onClick={(_, i)=> setSymbol(topList[i].symbol)} />
                        </BarChart>
                        </ResponsiveContainer>
                    </div>
                    </Card>
                    <Card title={`Días ↑/↓/= en ${symbol}`}>
                    <div className="h-64">
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
                    </Card>
                </section>
            )}

            {state==='success' && (
                <section className="grid grid-cols-1 md:grid-cols-1 gap-3">
                    <Card title="Índice = 100 (multi-divisa)">
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={normalizedMulti}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" /><YAxis /><Tooltip />
                            {sel.map(s => (<Area key={s} type="monotone" dataKey={s} name={s} stackId="1" />))}
                        </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    </Card>
                </section>
            )}

            {state==='success' && (
                <section>
                    <Card title={`Detalle diario — ${symbol}`}>
                    <div className="max-h-80 overflow-auto">
                        <table className="w-full text-sm">
                        <thead className="sticky top-0"><tr><th>Fecha</th><th className="text-right">Valor</th></tr></thead>
                        <tbody>
                            {baseSeries.map(r => (
                            <tr key={r.date}><td>{r.date}</td><td className="text-right">{r.value.toFixed(4)}</td></tr>
                            ))}
                        </tbody>
                        </table>
                    </div>
                    </Card>
                </section>
            )}

        </div>
    );
}