// AFTER
'use client'
import { Card, Spinner } from '@/app/components/ui';
import { useEffect, useState } from 'react';


export default function Page() {
    
    const [data, setData] = useState<any>(null);
    const [state, setState] = useState<'idle'|'loading'|'success'|'error'|'empty'>('idle');
    const [error, setError] = useState('')
    
    useEffect(() => {
        (async () => {
            setState('loading');
            console.log('[Dashboard] State: loading');
            try {
                const r = await fetch('/api/mock');
                console.log('[Dashboard] Fetch response:', r);
                const j = await r.json();
                console.log('[Dashboard] JSON data:', j);
                if (!j || !j.rates) {
                    setState('empty');
                    console.log('[Dashboard] State: empty');
                    return;
                }
                setData(j.rates);
                setState('success');
                console.log('[Dashboard] State: success, Data:', j.rates);
            } catch (e: any) {
                setError(e?.message || 'Error');
                setState('error');
                console.error('[Dashboard] State: error', e);
            }
        })();
    }, []);

    return (
        <div className="space-y-6">
            <Card title="Dashboard">
                {/* UI state rendering, also visible in console logs */}
                {state==='loading' && <Spinner/>}
                {state==='error' && <p className="text-sm text-red-600">Error: {error}</p>}
                {state==='empty' && <p className="text-sm">Sin datos.</p>}
                {state==='success' && <p className="text-sm opacity-80">Datos cargados ✔️</p>}
            </Card>
        </div>
    );
}