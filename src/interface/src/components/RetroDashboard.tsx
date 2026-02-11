'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line, Text } from '@react-three/drei';
import * as THREE from 'three';
import { io } from 'socket.io-client';


// --- TYPES & INTERFACES ---
interface SystemState {
    status: string;
    metrics: {
        alpha: string;
        beta: string;
        gamma: string;
        delta: string;
    };
    logs: LogEntry[];
}

interface LogEntry {
    timestamp: string;
    message: string;
    type: 'info' | 'warn' | 'error' | 'success';
}

const LANGUAGES = {
    EN: {
        title: 'Tensorwerk',
        subtitle: 'Financial Engineering Engine',
        system: 'SYSTEM',
        online: 'ONLINE',
        metricTensor: 'Metric Tensor',
        eigenvalues: 'Eigenvalues',
        operations: 'Operations',
        rebase: 'Rebase',
        invert: 'Invert',
        commit: 'Commit Vector',
        view: 'VIEW',
        scale: 'SCALE',
        target: 'TARGET',
        logs: 'Event Log / System Output',
        commandPlaceholder: 'ENTER COMMAND...',
        inject: 'INJECT VOLATILITY',
        stabilize: 'HEDGE / STABILIZE'
    },
    PT: {
        title: 'Tensorwerks',
        subtitle: 'Motor de Engenharia Financeira',
        system: 'SISTEMA',
        online: 'ONLINE',
        metricTensor: 'Tensor Métrico',
        eigenvalues: 'Autovalores',
        operations: 'Operações',
        rebase: 'Rebasear',
        invert: 'Inverter',
        commit: 'Commitar Vetor',
        view: 'VISÃO',
        scale: 'ESCALA',
        target: 'ALVO',
        logs: 'Log de Eventos / Saída do Sistema',
        commandPlaceholder: 'DIGITE COMANDO...',
        inject: 'INJETAR VOLATILIDADE',
        stabilize: 'HEDGE / ESTABILIZAR'
    }
};

// --- 3D COMPONENTS ---

// Constructive Growth Animation ("The Crystal/Neural Network")
function ConstructiveManifold({ growthSpeed = 1.0 }: { growthSpeed?: number }) {
    const groupRef = useRef<THREE.Group>(null);
    const [nodes, setNodes] = useState<{ pos: THREE.Vector3, parent: THREE.Vector3 | null, color: string }[]>([]);

    // Initial Seed
    useEffect(() => {
        setNodes([{ pos: new THREE.Vector3(0, 0, 0), parent: null, color: '#FF3300' }]);
    }, []);

    useFrame((state, delta) => {
        if (!groupRef.current) return;

        // Rotate the whole structure slowly
        groupRef.current.rotation.y += delta * 0.1;

        // Randomly add nodes to simulate growth (Limit to 150 nodes for performance)
        if (nodes.length > 0 && nodes.length < 150 && Math.random() > 0.95) {
            const parentIndex = Math.floor(Math.random() * nodes.length);
            const parent = nodes[parentIndex];

            // Random direction
            const dir = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
            const length = 1.0 + Math.random(); // Branch length
            const newPos = parent.pos.clone().add(dir.multiplyScalar(length));

            // Color Logic based on distance/random
            const colors = ['#FF3300', '#9D00FF', '#0047FF', '#FF0055'];
            const newColor = colors[Math.floor(Math.random() * colors.length)];

            setNodes(prev => [...prev, { pos: newPos, parent: parent.pos, color: newColor }]);
        }
    });

    return (
        <group ref={groupRef}>
            {/* Draw Nodes */}
            {nodes.map((n, i) => (
                <mesh key={`node-${i}`} position={n.pos}>
                    <icosahedronGeometry args={[0.08, 0]} />
                    <meshBasicMaterial color={new THREE.Color(n.color)} />
                </mesh>
            ))}

            {/* Draw Connections (Lines) */}
            {nodes.map((n, i) => n.parent && (
                <Line
                    key={`line-${i}`}
                    points={[n.parent, n.pos]}
                    color={n.color}
                    lineWidth={1}
                    transparent
                    opacity={0.5}
                />
            ))}
        </group>
    );
}

// --- MAIN DASHBOARD COMPONENT ---

export default function RetroDashboard() {
    const [lang, setLang] = useState<'EN' | 'PT'>('EN');
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [tensorData, setTensorData] = useState<string[][]>([]);
    const [logs, setLogs] = useState<LogEntry[]>([
        { timestamp: new Date().toLocaleTimeString(), message: 'System initialization sequence started...', type: 'info' }
    ]);
    const [utcTime, setUtcTime] = useState('');
    const [mounted, setMounted] = useState(false);

    const [socket, setSocket] = useState<any>(null);
    const [command, setCommand] = useState('');

    const t = LANGUAGES[lang];

    // Hydration fix & Load Language
    useEffect(() => {
        setMounted(true);
        const savedLang = localStorage.getItem('tensorwerk_lang');
        if (savedLang) setLang(savedLang.toUpperCase() as 'EN' | 'PT');
    }, []);

    // 1. Clock
    useEffect(() => {
        const timer = setInterval(() => {
            setUtcTime(new Date().toISOString().split('T')[1].split('.')[0]);
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // 2. Tensor Data Simulation
    // 2. REAL BACKEND CONNECTION (Socket.IO)
    // 2. REAL BACKEND CONNECTION (Socket.IO)
    useEffect(() => {
        const newSocket = io('http://localhost:5000');
        setSocket(newSocket);

        newSocket.on('connect', () => {
            setLogs(prev => [...prev.slice(-49), {
                timestamp: new Date().toLocaleTimeString(),
                message: 'CONNECTED TO PHYSICS ENGINE (WS:5000)',
                type: 'success'
            }]);
        });

        newSocket.on('tensor_update', (data: any) => {
            if (data.metric && Array.isArray(data.metric)) {
                setTensorData(data.metric.map((row: number[]) => row.map((n: number) => n.toFixed(3))));
            }
        });

        newSocket.on('system_log', (data: any) => {
            setLogs(prev => [...prev.slice(-49), {
                timestamp: new Date().toLocaleTimeString(),
                message: data.message || JSON.stringify(data),
                type: data.type || 'info'
            }]);
        });

        return () => { newSocket.disconnect(); };
    }, []);

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((err) => {
                console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
            setIsFullScreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullScreen(false);
            }
        }
    };

    const handleCommandSubmit = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && socket) {
            if (command.trim() === 'HELP') {
                setLogs(prev => [...prev.slice(-49), {
                    timestamp: new Date().toLocaleTimeString(),
                    message: 'AVAILABLE COMMANDS: REBASE, INVERT, COMMIT, CLEAR',
                    type: 'info'
                }]);
            } else if (command.trim() === 'CLEAR') {
                setLogs([]);
            } else {
                socket.emit('inject_volatility', { command });
                setLogs(prev => [...prev.slice(-49), {
                    timestamp: new Date().toLocaleTimeString(),
                    message: `> ${command}`,
                    type: 'info'
                }]);
            }
            setCommand('');
        }
    };

    const handleOperation = (op: string) => {
        if (socket) {
            socket.emit('inject_volatility', { command: op });
            setLogs(prev => [...prev.slice(-49), {
                timestamp: new Date().toLocaleTimeString(),
                message: `EXECUTING OPERATION: ${op}`,
                type: 'warn'
            }]);
        }
    };

    if (!mounted) return <div className="bg-[#121212] h-screen w-screen" />;

    return (
        <div className="flex flex-col h-screen w-screen bg-[#121212] text-[#E0E0E0] font-mono text-sm overflow-hidden select-none">

            {/* HEADER */}
            <header className="h-14 flex items-center justify-between px-4 border-b border-[#333] bg-[#121212] z-10 shrink-0">
                <div className="flex items-center space-x-6">
                    <a href="/" className="text-xl font-bold tracking-widest uppercase hover:text-accent transition-colors">
                        Tensorwerk
                    </a>
                    <div className="h-4 w-[1px] bg-[#333]"></div>
                    <span className="hidden md:inline text-xs text-[#666] uppercase tracking-wide">
                        {t.subtitle}
                    </span>
                </div>
                <div className="flex items-center space-x-6 text-xs">
                    <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-accent inline-block"></span>
                        <span>{t.system}: {t.online}</span>
                    </div>
                    <div className="text-[#666]">|</div>
                    <div>{utcTime} UTC</div>
                </div>
            </header>


            {/* MAIN CONTENT */}
            <div className="flex flex-1 overflow-hidden relative flex-col md:flex-row">

                {/* LEFT SIDEBAR (Desktops) / BOTTOM (Mobile) */}
                <aside className="w-full md:w-80 flex flex-col border-r border-[#333] bg-[#121212] shrink-0 z-20 md:z-auto order-2 md:order-1 h-1/2 md:h-auto">


                    {/* Metric Tensor Table */}
                    <div className="flex flex-col h-1/2 md:h-1/2 border-b border-[#333]">
                        <div className="px-3 py-2 border-b border-[#333] bg-[#1a1a1a] flex justify-between items-center">
                            <span className="text-xs font-bold uppercase text-accent">{t.metricTensor} (g_uv)</span>
                            <span className="text-[10px] text-[#666]">R^4 MANIFOLD</span>
                        </div>
                        <div className="overflow-auto flex-1 p-0">
                            <table className="w-full text-xs border-collapse">
                                <thead>
                                    <tr>
                                        <th className="text-left border-b border-[#333] p-2 text-[#666]">Idx</th>
                                        <th className="text-left border-b border-[#333] p-2 text-[#666]">X0</th>
                                        <th className="text-left border-b border-[#333] p-2 text-[#666]">X1</th>
                                        <th className="text-left border-b border-[#333] p-2 text-[#666]">X2</th>
                                        <th className="text-left border-b border-[#333] p-2 text-[#666]">X3</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tensorData.length > 0 ? tensorData.map((row, i) => (
                                        <tr key={i}>
                                            <td className="p-1 border-b border-[#222] pl-3 text-[#666]">g<sub>{i}μ</sub></td>
                                            {row.map((val, j) => (
                                                <td key={j} className={`p-1 border-b border-[#222] tabular-nums ${i === j ? 'text-white' : 'text-[#666]'}`}>
                                                    {val}
                                                </td>
                                            ))}
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={5} className="p-4 text-center text-[#666]">AWAITING DATA STREAM...</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Eigenvalues - Pushed to bottom via margin-top-auto if needed, but flex layout handles it */}
                    <div className="flex flex-col flex-1 border-t md:border-t-0 bg-[#121212]">

                        {/* Spacer to push content down */}
                        <div className="flex-1 hidden md:block"></div>

                        <div className="px-3 py-2 border-t border-b border-[#333] bg-[#1a1a1a] flex justify-between items-center">
                            <span className="text-xs font-bold uppercase text-[#999]">{t.eigenvalues}</span>
                            <span className="text-[10px] text-[#666]">REAL-TIME</span>
                        </div>
                        <div className="p-4 space-y-4 text-xs">
                            <div className="grid grid-cols-2 gap-4">
                                <div><div className="text-[#666] mb-1">ALPHA</div><div className="text-lg">0.8942</div></div>
                                <div><div className="text-[#666] mb-1">BETA</div><div className="text-lg text-accent">1.2405</div></div>
                                <div><div className="text-[#666] mb-1">GAMMA</div><div className="text-lg">-0.003</div></div>
                                <div><div className="text-[#666] mb-1">DELTA</div><div className="text-lg">4.5510</div></div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-[#333]">
                                <div className="text-[#666] mb-2 uppercase text-[10px]">{t.operations}</div>
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => handleOperation('REBASE')} className="border border-[#333] p-2 hover:bg-white hover:text-black transition-colors">{t.rebase}</button>
                                    <button onClick={() => handleOperation('INVERT')} className="border border-[#333] p-2 hover:bg-white hover:text-black transition-colors">{t.invert}</button>
                                    <button onClick={() => handleOperation('COMMIT')} className="col-span-2 border border-[#333] p-2 hover:bg-accent hover:text-black transition-colors">{t.commit}</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* CENTER: 3D Canvas */}
                <main className="flex-1 flex flex-col bg-[#0f0f0f] relative order-1 md:order-2 h-1/2 md:h-full">

                    <div className="flex-1 relative border-b border-[#333]">
                        {/* Overlay Elements */}
                        <div className="absolute top-2 left-10 z-10 text-[10px] text-accent font-mono pointer-events-none">
                            {t.view}: PERSPECTIVE<br />
                            {t.scale}: 1:1<br />
                            {t.target}: GROWTH_LATTICE
                        </div>

                        {/* 3D Canvas */}
                        <div className="absolute inset-0">
                            <Canvas camera={{ position: [10, 10, 10], fov: 45 }}>
                                <color attach="background" args={['#0f0f0f']} />
                                <fog attach="fog" args={['#0f0f0f', 10, 50]} />
                                <ambientLight intensity={0.5} />
                                <pointLight position={[10, 10, 10]} />
                                <gridHelper args={[40, 40, 0x333333, 0x1a1a1a]} />
                                <ConstructiveManifold />
                                <OrbitControls autoRotate autoRotateSpeed={0.5} />
                            </Canvas>
                        </div>

                        {/* Rulers Overlay */}
                        <div className="absolute bottom-0 left-0 w-full h-5 border-t border-[#333] flex justify-between px-2 text-[9px] text-[#666] items-center pointer-events-none">
                            <span>T-24H</span><span>T-12H</span><span>NOW</span><span>T+12H</span><span>T+24H</span>
                        </div>
                        <div className="absolute top-0 left-0 h-full w-8 border-r border-[#333] flex flex-col justify-between py-2 text-[9px] text-[#666] items-center pointer-events-none">
                            <span>+10</span><span>0</span><span>-10</span>
                        </div>
                    </div>

                    {/* BOTTOM LOGS */}
                    <div className="h-48 bg-[#121212] flex flex-col shrink-0">
                        <div className="px-3 py-1 border-b border-[#333] bg-[#1a1a1a] flex justify-between items-center text-[10px] uppercase tracking-wider text-[#666]">
                            <span>{t.logs}</span>
                            <span>/var/log/syslog</span>
                        </div>
                        <div className="flex-1 p-3 font-mono text-xs overflow-y-auto">
                            {logs.slice().reverse().map((log, i) => (
                                <div key={i} className="mb-1">
                                    <span className="text-[#666]">[{log.timestamp}]</span> <span className={log.type === 'warn' ? 'text-accent' : log.type === 'success' ? 'text-green-500' : 'text-[#E0E0E0]'}>{log.message}</span>
                                </div>
                            ))}
                        </div>
                        <div className="h-8 border-t border-[#333] flex items-center px-3 text-xs bg-[#121212]">
                            <span className="text-accent mr-2">{'>'}</span>
                            <input
                                type="text"
                                className="bg-transparent border-none outline-none flex-1 text-[#E0E0E0] placeholder-[#333]"
                                placeholder={t.commandPlaceholder}
                                value={command}
                                onChange={(e) => setCommand(e.target.value.toUpperCase())}
                                onKeyDown={handleCommandSubmit}
                            />
                            <div className="w-2 h-4 bg-accent animate-pulse ml-2"></div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
