import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Admira — Mini‑Dashboard',
    description: 'Reto de dashboard con Next.js + API routes + Recharts',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    return (
        <html lang="es">
            <body className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
                <div className="max-w-6xl mx-auto p-4 md:p-6">
                    <header className="mb-6">
                        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                            Admira — Mini‑Dashboard
                        </h1>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            API → Transformaciones → Gráficos → Filtros → Evidencia
                        </p> 
                    </header>
                    {children}
                </div>
            </body>
        </html>
    );
}