import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {


    title: 'Tensorwerk — Riemannian Market Visualization',
    description: 'Real-time 4D manifold visualization of financial market dynamics using Riemannian geometry.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body style={{
                margin: 0,
                padding: 0,
                backgroundColor: '#0a0a0f',
                color: '#e0e0e0',
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            }}>
                {children}
            </body>
        </html>
    );
}
