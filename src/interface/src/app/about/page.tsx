'use client';

import React, { useState } from 'react';
import { motion, useScroll, useSpring, AnimatePresence } from 'framer-motion';
import {
    Menu,
    X,
    Terminal,
    Cpu,
    Activity,
    Zap,
    Github,
    ArrowRight
} from 'lucide-react';

export default function AboutPage() {
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <div className="bg-[#050505] min-h-screen text-gray-300 font-mono selection:bg-[#FFB800] selection:text-black">

            {/* PROGRESS BAR */}
            <motion.div
                className="fixed top-0 left-0 right-0 h-1 bg-[#FFB800] origin-left z-50 mix-blend-difference"
                style={{ scaleX }}
            />

            {/* HEADER - Consistent with Landing */}
            <header className="fixed top-0 left-0 w-full z-40 px-6 py-6 flex justify-between items-center mix-blend-difference text-white bg-[#050505]/80 backdrop-blur-md">
                <a href="/" className="text-sm font-bold tracking-[0.2em] opacity-80 hover:opacity-100 transition-opacity">
                    TENSORWERK
                </a>

                <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="hover:text-[#FFB800] transition-colors"
                >
                    {menuOpen ? <X /> : <Menu />}
                </button>
            </header>

            {/* MOBILE MENU OVERLAY */}
            <AnimatePresence>
                {menuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed inset-0 z-50 bg-[#050505] flex flex-col items-center justify-center space-y-8"
                    >
                        <button onClick={() => setMenuOpen(false)} className="absolute top-6 right-6 text-white hover:text-[#FFB800]">
                            <X />
                        </button>
                        <a href="/" className="text-2xl font-bold tracking-widest hover:text-[#FFB800] transition-colors">
                            00. HOME
                        </a>
                        <a href="/simulation" className="text-2xl font-bold tracking-widest text-[#FF3300] hover:text-white transition-colors">
                            02. SIMULAÇÃO
                        </a>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* CONTENT LAYOUT */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-[250px_1fr] gap-12 px-6 py-32">

                {/* SIDEBAR NAVIGATION (Sticky) */}
                <aside className="hidden md:block h-fit sticky top-32">
                    <nav className="space-y-4 text-xs font-bold tracking-widest border-l border-gray-800 pl-4">
                        <a href="#manifesto" className="block text-gray-500 hover:text-[#FFB800] transition-colors">01. MANIFESTO</a>
                        <a href="#math" className="block text-gray-500 hover:text-[#FFB800] transition-colors">02. FUNDAMENTAÇÃO</a>
                        <a href="#architecture" className="block text-gray-500 hover:text-[#FFB800] transition-colors">03. ARQUITETURA</a>
                        <a href="#infrastructure" className="block text-gray-500 hover:text-[#FFB800] transition-colors">04. INFRAESTRUTURA</a>
                        <a href="#author" className="block text-gray-500 hover:text-[#FFB800] transition-colors">05. AUTOR</a>
                    </nav>
                </aside>

                {/* MAIN CONTENT */}
                <main className="space-y-32">

                    {/* HERO TITLE BLOCK */}
                    <section>
                        <div className="text-[#FFB800] text-xs font-bold tracking-[0.2em] mb-4">
                            WHITE PAPER // TECHNICAL DOCS v3.0
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-8">
                            GEOMETRIA RIEMANNIANA &<br />ENGENHARIA FINANCEIRA
                        </h1>
                    </section>

                    {/* 01. MANIFESTO */}
                    <section id="manifesto" className="space-y-8">
                        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                            <span className="text-[#FFB800] text-sm md:text-base">01 //</span> O MANIFESTO DA GEOMETRIA FINANCEIRA
                        </h2>

                        <div className="prose prose-invert prose-lg text-gray-400 max-w-none text-justify">
                            <h3 className="text-white font-bold text-xl mb-4">A Ilusão do Random Walk</h3>
                            <p className="mb-6">
                                Modelos tradicionais como Black-Scholes, GARCH e ARIMA baseiam-se na premissa fundamental de que o mercado é um processo estocástico regido por movimentos brownianos geométricos com ruído gaussiano. Esta simplificação assume que os retornos são independentes e identicamente distribuídos (i.i.d.), que a volatilidade é uma propriedade estatística endógena e que eventos extremos (crashes de 10-sigma) são anomalias estatísticas que ocorrem uma vez a cada idade do universo.
                            </p>
                            <p className="mb-6 border-l-4 border-red-900 pl-6 bg-red-900/10 p-4">
                                <strong>A realidade, no entanto, contradiz violentamente esses modelos.</strong> Crashes acontecem a cada década. Flash crashes acontecem a cada mês. A distribuição de retornos tem caudas gordas de lei de potência, não curvas normais.
                            </p>

                            <h3 className="text-white font-bold text-xl mb-4">A Revolução Riemanniana</h3>
                            <p className="mb-6">
                                O Tensorwerk rejeita a hipótese estocástica. Nós postulamos que o mercado é um sistema determinístico caótico operando sobre uma variedade topológica (Manifold) de dimensão D=4. O caos aparente é apenas a manifestação da curvatura complexa desse espaço devido à interação massiva de agentes.
                            </p>
                            <div className="grid grid-cols-2 gap-4 my-8 font-bold text-white bg-gray-900 p-6 border border-gray-800">
                                <div>CAPITAL = ENERGIA (E)</div>
                                <div>LIQUIDEZ = MASSA (M)</div>
                                <div>FLUXO = MOMENTO (p)</div>
                                <div>PREÇO = COORDENADA (x^u)</div>
                            </div>
                            <p>
                                Não tentamos prever o preço jogando dados (Monte Carlo). Nós calculamos a <strong>geodésica</strong> — o caminho de menor resistência — que o preço <em>deve</em> percorrer dada a geometria atual do livro de ofertas.
                            </p>
                        </div>
                    </section>

                    {/* 02. MATHEMATICS */}
                    <section id="math" className="space-y-8">
                        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                            <span className="text-[#FFB800] text-sm md:text-base">02 //</span> EQUAÇÕES DE CAMPO
                        </h2>

                        <div className="bg-[#020202] border border-gray-800 p-12 overflow-x-auto flex justify-center items-center my-8">
                            <div className="text-xl md:text-3xl font-serif text-white tracking-widest">
                                R<sub>μν</sub> - <span className="text-gray-600">1/2</span>Rg<sub>μν</sub> + Λg<sub>μν</sub> = <span className="text-[#FFB800]">κT<sub>μν</sub></span>
                            </div>
                        </div>

                        <div className="prose prose-invert prose-lg text-gray-400 max-w-none text-justify">
                            <p className="mb-6">
                                A dinâmica do mercado é governada por uma variante das Equações de Campo de Einstein. Cada termo tem um significado financeiro preciso:
                            </p>
                            <ul className="list-disc pl-6 space-y-4 mb-8">
                                <li><strong>R<sub>μν</sub> (Ricci Tensor):</strong> Representa a "fricção" ou resistência do mercado à mudança de preço. Em mercados com alto spread, R<sub>μν</sub> é grande.</li>
                                <li><strong>R (Escalar de Ricci):</strong> A curvatura média local. Mercados calmos são planos (R ≈ 0). Mercados voláteis são curvos (R ≫ 0).</li>
                                <li><strong>g<sub>μν</sub> (Metric Tensor):</strong> A "régua" fundamental. Define a distância de custo para mover o preço de P1 para P2.</li>
                                <li><strong>T<sub>μν</sub> (Stress-Energy):</strong> A densidade de ordens limitadas e fluxo de mercado. É a fonte da gravidade financeira.</li>
                            </ul>

                            <h3 className="text-white font-bold text-xl mb-4">Detecção de Singularidades (Crashes)</h3>
                            <p>
                                Um "Crash" de mercado não é apenas uma desvalorização rápida. Geometricamente, é uma Singularidade Topológica, onde a curvatura do espaço-tempo financeiro se torna infinita, rompendo a continuidade da liquidez. Para detectar isso, monitoramos o <strong>Invariante de Kretschmann</strong>. Se a derivada temporal deste escalar divergir, o sistema emite um sinal de HEDGE IMEDIATO microssegundos antes do colapso.
                            </p>
                        </div>
                    </section>

                    {/* 03. ARCHITECTURE */}
                    <section id="architecture" className="space-y-12">
                        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                            <span className="text-[#FFB800] text-sm md:text-base">03 //</span> ARQUITETURA HPC
                        </h2>

                        <div className="prose prose-invert prose-lg text-gray-400 max-w-none text-justify mb-8">
                            <p>
                                O Tensorwerk não é um backend convencional. É um sistema distribuído de alta performance desenhado para orçamentos de latência na escala de microssegundos (&lt; 5μs tick-to-trade).
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                            {/* LISP */}
                            <div className="bg-[#0A0A0A] p-8 border border-gray-800 hover:border-white transition-all group">
                                <Terminal className="w-10 h-10 text-white mb-6 group-hover:scale-110 transition-transform" />
                                <h3 className="text-xl font-bold text-white mb-3">01. Meta-Lógica (LISP)</h3>
                                <p className="text-sm text-gray-500 leading-relaxed mb-4">
                                    Atua como um "Matemático Simbólico". Recebe Lagrangianas, calcula derivadas parciais e gera código C++ AVX-512 otimizado em tempo de execução (Hot-Reload) sem downtime.
                                </p>
                                <div className="text-[10px] uppercase tracking-wider text-gray-600 border-t border-gray-800 pt-4">
                                    SYMBOLIC DERIVATION // SBCL
                                </div>
                            </div>

                            {/* C++ */}
                            <div className="bg-[#0A0A0A] p-8 border border-gray-800 hover:border-[#FFB800] transition-all group">
                                <Cpu className="w-10 h-10 text-[#FFB800] mb-6 group-hover:scale-110 transition-transform" />
                                <h3 className="text-xl font-bold text-white mb-3">02. Motor Físico (C++)</h3>
                                <p className="text-sm text-gray-500 leading-relaxed mb-4">
                                    O núcleo crítico. Roda sem Garbage Collection. Usa Templates para metaprogramação e intrinsics AVX-512 para processar 8 doubles por ciclo de clock.
                                </p>
                                <div className="text-[10px] uppercase tracking-wider text-gray-600 border-t border-gray-800 pt-4">
                                    ZERO ALLOC // C++20
                                </div>
                            </div>

                            {/* RUST */}
                            <div className="bg-[#0A0A0A] p-8 border border-gray-800 hover:border-[#FF3300] transition-all group">
                                <Zap className="w-10 h-10 text-[#FF3300] mb-6 group-hover:scale-110 transition-transform" />
                                <h3 className="text-xl font-bold text-white mb-3">03. Sistema Nervoso (Rust)</h3>
                                <p className="text-sm text-gray-500 leading-relaxed mb-4">
                                    Gatekeeper de memória. Garante segurança e concorrência na borda (Edge). Implementa parsers Zero-Copy para feeds de dados binários (SBE/ITCH).
                                </p>
                                <div className="text-[10px] uppercase tracking-wider text-gray-600 border-t border-gray-800 pt-4">
                                    MEMORY SAFETY // RUST
                                </div>
                            </div>

                        </div>
                    </section>

                    {/* 04. INFRASTRUCTURE */}
                    <section id="infrastructure" className="space-y-8">
                        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                            <span className="text-[#FFB800] text-sm md:text-base">04 //</span> HARDWARE & OTIMIZAÇÃO
                        </h2>

                        <div className="prose prose-invert prose-lg text-gray-400 max-w-none text-justify mb-6">
                            <p>
                                O sistema operacional padrão não é suficiente. Aplicamos tuning severo no kernel Linux, incluindo isolamento de CPU (Isolcpus), Huge Pages de 1GB e desativação de interrupções via IRQ Affinity para garantir que as threads de cálculo nunca sejam interrompidas pelo OS.
                            </p>
                        </div>

                        <div className="border border-gray-800 rounded-sm overflow-hidden">
                            <table className="w-full text-left font-mono text-sm">
                                <thead className="bg-[#0F0F0F] text-gray-500 text-xs uppercase tracking-wider">
                                    <tr>
                                        <th className="p-4 border-b border-gray-800">Recurso</th>
                                        <th className="p-4 border-b border-gray-800">Hardware Recomendado</th>
                                        <th className="p-4 border-b border-gray-800 text-right">Throughput</th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-300 divide-y divide-gray-800/50 bg-[#050505]">
                                    <tr>
                                        <td className="p-4 text-[#FFB800] font-bold">Processamento</td>
                                        <td className="p-4">AMD EPYC 9654 (96 Cores / 192 Threads)</td>
                                        <td className="p-4 text-right">3.7 GHz</td>
                                    </tr>
                                    <tr>
                                        <td className="p-4 text-[#FF3300] font-bold">Aceleração</td>
                                        <td className="p-4">2x NVIDIA H100 PCIe (80GB HBM3)</td>
                                        <td className="p-4 text-right">3.35 TB/s</td>
                                    </tr>
                                    <tr>
                                        <td className="p-4 text-blue-500 font-bold">Rede</td>
                                        <td className="p-4">Mellanox ConnectX-7 (Kernel Bypass)</td>
                                        <td className="p-4 text-right">400 Gbps</td>
                                    </tr>
                                    <tr>
                                        <td className="p-4 text-white font-bold">Memória</td>
                                        <td className="p-4">512 GB DDR5-4800 ECC (Octa-Ranked)</td>
                                        <td className="p-4 text-right">In-Memory DB</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* 05. AUTHOR */}
                    <section id="author" className="pt-16 border-t border-gray-800">
                        <div className="flex flex-col items-start gap-6">
                            <div className="space-y-2">
                                <h3 className="text-3xl font-bold text-white uppercase tracking-tight">Thiago Di Faria</h3>
                                <p className="text-[#FFB800] text-sm font-bold tracking-[0.3em] uppercase">
                                    DESENVOLVEDOR
                                </p>
                            </div>
                            <p className="text-gray-400 text-lg italic border-l-2 border-gray-700 pl-4 py-2">
                                "Aventure-se na geometria profunda, onde o lucro é apenas uma consequência da compreensão da estrutura do universo."
                            </p>
                        </div>
                    </section>

                </main>
            </div>

            {/* FOOTER - Matching Landing Page */}
            <footer className="bg-black py-16 px-6 border-t border-gray-900">
                <div className="max-w-4xl mx-auto text-center space-y-8">

                    <div className="flex flex-col items-center space-y-2">
                        <div className="text-white font-bold tracking-widest uppercase">Thiago Di Faria</div>
                        <div className="text-xs text-gray-600 tracking-widest">DESENVOLVEDOR</div>
                    </div>

                    <div className="flex justify-center gap-8">
                        <a href="https://github.com/thiagodifaria" target="_blank" className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm">
                            <Github className="w-4 h-4" /> github.com/thiagodifaria
                        </a>
                    </div>

                    <div className="text-[10px] text-gray-800 font-mono pt-8">
                        TENSORWERK // QUANTITATIVE ENGINEERING
                    </div>

                </div>
            </footer>

        </div>
    );
}
