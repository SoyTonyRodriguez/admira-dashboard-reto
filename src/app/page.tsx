// AFTER
'use client'
import { Card, Spinner } from '@/app/components/ui';
import { useEffect, useState } from 'react';


export default function Page() {
    
    const [data, setData] = useState<any>(null);
    const [state, setState] = useState<'idle'|'loading'|'success'|'error'|'empty'>('idle');
    const [error, setError] = useState('');
    const [start, setStart] = useState<string>(() => new Date(Date.now()-1000*60*60*24*30).toISOString().slice(0,10));
    const [end, setEnd] = useState<string>(() => new Date().toISOString().slice(0,10));
    const [sel, setSel] = useState<string[]>(['MXN','EUR','JPY','GBP']);
    const ALL = ['MXN','EUR','JPY','GBP','CAD','BRL','CLP','ARS','COP'] as const;

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


    // useEffect(() => {
    //     (async () => {
    //         setState('loading');
    //         console.log('[Dashboard] State: loading');
    //         try {
    //             const r = await fetch('/api/mock');
    //             console.log('[Dashboard] Fetch response:', r);
    //             const j = await r.json();
    //             console.log('[Dashboard] JSON data:', j);
    //             if (!j || !j.rates) {
    //                 setState('empty');
    //                 console.log('[Dashboard] State: empty');
    //                 return;
    //             }
    //             setData(j.rates);
    //             setState('success');
    //             console.log('[Dashboard] State: success, Data:', j.rates);
    //         } catch (e: any) {
    //             setError(e?.message || 'Error');
    //             setState('error');
    //             console.error('[Dashboard] State: error', e);
    //         }
    //     })();
    // }, []);

    return (
        <div className="space-y-6">
            <Card title="Filtros" actions={<button onClick={fetchData} className="rounded-xl px-3 py-1.5 text-sm bg-zinc-900 text-white">Aplicar</button>}>
                <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-xs">Inicio</label><input type="date" value={start} onChange={e=>setStart(e.target.value)} className="w-full rounded-xl border p-2 bg-transparent"/></div>
                    <div><label className="text-xs">Fin</label><input type="date" value={end} onChange={e=>setEnd(e.target.value)} className="w-full rounded-xl border p-2 bg-transparent"/></div>
                    <div className="col-span-2">
                        <label className="text-xs">Divisas</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                            {ALL.map(c => (
                                <button key={c} onClick={()=> setSel(p => p.includes(c) ? p.filter(x=>x!==c) : [...p, c])}
                                className={`px-2 py-1 rounded-lg border text-sm ${sel.includes(c)?'bg-zinc-900 text-white':'bg-transparent'}`}>{c}</button>
                            ))}
                        </div>
                    </div>
                </div>
            </Card>

            {state==='loading' && <Spinner/>}
            {state==='error' && <p className="text-sm text-red-600">Error: {error}</p>}
            {state==='empty' && <p className="text-sm">Sin datos en el rango seleccionado.</p>}

        </div>
    );
}