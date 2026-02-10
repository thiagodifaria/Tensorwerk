'use client';

import dynamic from 'next/dynamic';

const RiemannManifoldViewer = dynamic(
    () => import('@/components/RiemannManifoldViewer'),
    { ssr: false }
);

export default function Home() {
    return (
        <main style={{
            width: '100vw',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#0a0a0f',
        }}>
            {/* Header */}
            <header style={{
                padding: '12px 24px',
                borderBottom: '1px solid rgba(0, 255, 100, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'rgba(10, 10, 15, 0.95)',
                backdropFilter: 'blur(10px)',
                zIndex: 100,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                        fontSize: '20px',
                        fontWeight: 700,
                        letterSpacing: '0.15em',
                        color: '#00ff64',
                        fontFamily: "'JetBrains Mono', monospace",
                    }}>
                        TENSORWERK
                    </span>
                    <span style={{
                        fontSize: '11px',
                        color: 'rgba(255,255,255,0.3)',
                        borderLeft: '1px solid rgba(255,255,255,0.1)',
                        paddingLeft: '12px',
                    }}>
                        RIEMANNIAN MANIFOLD VIEWER
                    </span>
                </div>
                <div style={{
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    color: 'rgba(255,255,255,0.4)',
                }}>
                    v1.0.0
                </div>
            </header>

            {/* 3D Viewer */}
            <div style={{ flex: 1, position: 'relative' }}>
                <RiemannManifoldViewer
                    resolution={128}
                    curvatureScale={2.0}
                    showWireframe={false}
                    animationSpeed={1.0}
                />
            </div>
        </main>
    );
}
