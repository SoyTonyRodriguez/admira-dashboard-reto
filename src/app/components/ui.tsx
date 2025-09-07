
'use client';
import { useMemo } from 'react';

export function Spinner() {
    return (
        <div className="w-full flex items-center justify-center py-10">
            <div aria-label="cargando" className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
        </div>
    );
}

export function Card({ title, children, actions }: { title: string; children: React.ReactNode; actions?: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
            <div className="p-4 flex items-center justify-between">
                <h3 className="font-medium">{title}</h3>
                {actions}
            </div>
            <div className="px-4 pb-4">{children}</div>
        </div>
    );
}

export function useTopN<T>(items: T[], n: number, key: (x: T) => number) {
    return useMemo(() => items.slice().sort((a, b) => key(b) - key(a)).slice(0, n), [items, n, key]);
}