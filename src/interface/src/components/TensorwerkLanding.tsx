'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity,
    Terminal,
    Zap,
    Database,
    Globe,
    ArrowRight,
    Menu,
    X,
    Github,
    ChevronDown,
    Cpu
} from 'lucide-react';

// --- Content Dictionary (EN/PT) ---
const CONTENT = {
    en: {
        menu: {
            about: "ABOUT PROJECT",
            sim: "LAUNCH SIMULATION",
        },
        hero: {
            title: "TENSORWERK",
            subtitle: "The market is not a random walk. It is a geometry.",
            cta: "SIMULATION",
        },
        manifesto: {
            title: "01 // THE MANIFESTO",
            quote: "We reject Stochastic Calculus.",
            body: "The market is not a chaotic distribution of random variables. It is a 4-Dimensional Riemannian Manifold deformed by capital mass. Price is simply the geodesic of least resistance.",
        },
        trinity: {
            title: "02 // ARCHITECTURE",
            c: "PHYSICS CORE (C++20)",
            c_desc: "AVX-512 Vectorization & Geodesic Solvers",
            rust: "NERVOUS SYSTEM (RUST)",
            rust_desc: "Zero-Copy Memory & Kernel Bypass",
            lisp: "SYMBOLIC LOGIC (LISP)",
            lisp_desc: "Meta-Compiler & Equation Derivation"
        },
        infra: {
            title: "03 // INFRASTRUCTURE",
            cpu: "AMD EPYC 9654",
            gpu: "NVIDIA H100",
            role: "CHIEF ARCHITECT"
        }
    },
    pt: {
        menu: {
            about: "SOBRE O PROJETO",
            sim: "INICIAR SIMULAÇÃO",
        },
        hero: {
            title: "TENSORWERK",
            subtitle: "O mercado não é um passeio aleatório. É geometria.",
            cta: "SIMULAÇÃO",
        },
        manifesto: {
            title: "01 // O MANIFESTO",
            quote: "Rejeitamos o Cálculo Estocástico.",
            body: "O mercado não é uma distribuição caótica de variáveis aleatórias. É uma Variedade Riemanniana 4D deformada pela massa de capital. O preço é simplesmente a geodésica de menor resistência.",
        },
        trinity: {
            title: "02 // ARQUITETURA",
            c: "NÚCLEO FÍSICO (C++20)",
            c_desc: "Vetorização AVX-512 & Solvers Geodésicos",
            rust: "SISTEMA NERVOSO (RUST)",
            rust_desc: "Memória Zero-Copy & Kernel Bypass",
            lisp: "LÓGICA SIMBÓLICA (LISP)",
            lisp_desc: "Meta-Compilador & Derivação de Equações"
        },
        infra: {
            title: "03 // INFRAESTRUTURA",
            cpu: "AMD EPYC 9654",
            gpu: "NVIDIA H100",
            role: "DESENVOLVEDOR"
        }
    }
};

export default function TensorwerkLanding() {
    const [lang, setLang] = useState<'en' | 'pt'>('pt');
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const savedLang = localStorage.getItem('tensorwerk_lang') as 'en' | 'pt';
        if (savedLang) setLang(savedLang);
    }, []);

    const handleLangChange = () => {
        const newLang = lang === 'en' ? 'pt' : 'en';
        setLang(newLang);
        localStorage.setItem('tensorwerk_lang', newLang);
    };

    const t = CONTENT[lang];

    const scrollToSection = (id: string) => {
        setMenuOpen(false);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="bg-[#050505] text-gray-300 font-mono selection:bg-[#FFB800] selection:text-black overflow-x-hidden">

            {/* 1. HEADER - Minimalist */}
            <header className="fixed top-0 left-0 w-full z-50 px-6 py-6 flex justify-between items-center mix-blend-difference text-white">
                <div className="text-sm font-bold tracking-[0.2em] opacity-80 hover:opacity-100 transition-opacity">
                    TENSORWERK
                </div>

                <div className="flex items-center gap-6">
                    <button
                        onClick={handleLangChange}
                        className="text-xs font-bold hover:text-[#FFB800] transition-colors"
                    >
                        [{lang.toUpperCase()}]
                    </button>

                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="hover:text-[#FFB800] transition-colors"
                    >
                        {menuOpen ? <X /> : <Menu />}
                    </button>
                </div>
            </header>

            {/* MOBILE MENU OVERLAY */}
            <AnimatePresence>
                {menuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed inset-0 z-40 bg-[#050505] flex flex-col items-center justify-center space-y-8"
                    >
                        <a
                            href="/about"
                            className="text-2xl font-bold tracking-widest hover:text-[#FFB800] transition-colors"
                        >
                            01. {t.menu.about}
                        </a>
                        <a
                            href="/simulation"
                            className="text-2xl font-bold tracking-widest text-[#FF3300] hover:text-white transition-colors"
                        >
                            02. {t.menu.sim}
                        </a>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 2. HERO SECTION - Circuit Board Animation */}
            <section className="relative h-screen flex flex-col items-center justify-center px-6 border-b border-gray-900 bg-[#050505] overflow-hidden">

                {/* Circuit Grid Background */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,184,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,184,0,0.03)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

                {/* Circuit Traces Container - ABSOLUTE FULL SCREEN to ensure edges mean edges */}
                <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
                    <svg className="w-full h-full min-w-[1200px] min-h-[800px]" viewBox="0 0 2000 1200" preserveAspectRatio="xMidYMid slice">
                        <defs>
                            <filter id="glow">
                                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                                <feMerge>
                                    <feMergeNode in="coloredBlur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>

                        {/* --- LEFT SIDE TRACES (Origin x=0) --- */}
                        {/* Target Center approx x=1000, y=600 */}

                        <motion.path
                            d="M 0 600 L 200 600 L 300 500 L 800 500 L 936 550"
                            fill="transparent" stroke="#FFB800" strokeWidth="1.5" strokeOpacity="0.4"
                            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2.5, ease: "linear" }}
                        />
                        <motion.circle r="2" fill="#fff"><animateMotion dur="3s" repeatCount="indefinite" path="M 0 600 L 200 600 L 300 500 L 800 500 L 936 550" /></motion.circle>

                        <motion.path
                            d="M 0 400 L 150 400 L 250 500 L 600 500 L 930 540"
                            fill="transparent" stroke="#FFB800" strokeWidth="1" strokeOpacity="0.3"
                            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 3, delay: 0.2, ease: "linear" }}
                        />

                        <motion.path
                            d="M 0 800 L 300 800 L 400 700 L 850 700 L 930 650"
                            fill="transparent" stroke="#FFB800" strokeWidth="1.5" strokeOpacity="0.4"
                            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2.8, delay: 0.1, ease: "linear" }}
                        />
                        <motion.circle r="2" fill="#fff"><animateMotion dur="4s" repeatCount="indefinite" path="M 0 800 L 300 800 L 400 700 L 850 700 L 930 650" /></motion.circle>

                        {/* NEW LEFT TRACES */}
                        <motion.path
                            d="M 0 200 L 100 200 L 200 300 L 500 300 L 940 530"
                            fill="transparent" stroke="#FFB800" strokeWidth="1" strokeOpacity="0.3"
                            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 3.2, delay: 0.4, ease: "linear" }}
                        />
                        <motion.path
                            d="M 0 1000 L 250 1000 L 350 900 L 700 900 L 940 660"
                            fill="transparent" stroke="#FFB800" strokeWidth="1" strokeOpacity="0.3"
                            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 3.5, delay: 0.5, ease: "linear" }}
                        />
                        <motion.circle r="1.5" fill="#fff"><animateMotion dur="5s" repeatCount="indefinite" path="M 0 1000 L 250 1000 L 350 900 L 700 900 L 940 660" /></motion.circle>


                        {/* --- RIGHT SIDE TRACES (Origin x=2000) --- */}
                        <motion.path
                            d="M 2000 600 L 1800 600 L 1700 700 L 1200 700 L 1064 650"
                            fill="transparent" stroke="#FFB800" strokeWidth="1.5" strokeOpacity="0.4"
                            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2.5, ease: "linear" }}
                        />
                        <motion.circle r="2" fill="#fff"><animateMotion dur="3s" repeatCount="indefinite" path="M 2000 600 L 1800 600 L 1700 700 L 1200 700 L 1064 650" /></motion.circle>

                        <motion.path
                            d="M 2000 400 L 1850 400 L 1750 300 L 1300 300 L 1064 550"
                            fill="transparent" stroke="#FFB800" strokeWidth="1" strokeOpacity="0.3"
                            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 3.2, delay: 0.3, ease: "linear" }}
                        />

                        <motion.path
                            d="M 2000 900 L 1600 900 L 1400 700 L 1064 660"
                            fill="transparent" stroke="#FFB800" strokeWidth="1" strokeOpacity="0.3"
                            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 3.5, delay: 0.4, ease: "linear" }}
                        />

                        {/* NEW RIGHT TRACES */}
                        <motion.path
                            d="M 2000 200 L 1900 200 L 1800 100 L 1500 100 L 1060 540"
                            fill="transparent" stroke="#FFB800" strokeWidth="1" strokeOpacity="0.3"
                            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 3, delay: 0.6, ease: "linear" }}
                        />
                        <motion.circle r="1.5" fill="#fff"><animateMotion dur="4.5s" repeatCount="indefinite" path="M 2000 200 L 1900 200 L 1800 100 L 1500 100 L 1060 540" /></motion.circle>

                        <motion.path
                            d="M 2000 1100 L 1800 1100 L 1700 1000 L 1300 1000 L 1060 670"
                            fill="transparent" stroke="#FFB800" strokeWidth="1" strokeOpacity="0.3"
                            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 3.8, delay: 0.2, ease: "linear" }}
                        />


                        {/* --- TOP SIDE TRACES (Origin y=0) --- */}
                        <motion.path
                            d="M 1000 0 L 1000 200 L 900 300 L 900 450 L 950 536"
                            fill="transparent" stroke="#FFB800" strokeWidth="1.5" strokeOpacity="0.4"
                            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2, delay: 0.5, ease: "linear" }}
                        />
                        <motion.circle r="2" fill="#fff"><animateMotion dur="2.5s" repeatCount="indefinite" path="M 1000 0 L 1000 200 L 900 300 L 900 450 L 950 536" /></motion.circle>

                        <motion.path
                            d="M 1400 0 L 1400 150 L 1200 350 L 1050 350 L 1050 536"
                            fill="transparent" stroke="#FFB800" strokeWidth="1" strokeOpacity="0.3"
                            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2.8, delay: 0.2, ease: "linear" }}
                        />

                        {/* NEW TOP TRACES */}
                        <motion.path
                            d="M 600 0 L 600 100 L 700 200 L 700 400 L 940 540"
                            fill="transparent" stroke="#FFB800" strokeWidth="1" strokeOpacity="0.3"
                            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2.9, delay: 0.7, ease: "linear" }}
                        />
                        <motion.path
                            d="M 1700 0 L 1700 100 L 1500 300 L 1070 540"
                            fill="transparent" stroke="#FFB800" strokeWidth="1" strokeOpacity="0.3"
                            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 3.1, delay: 0.3, ease: "linear" }}
                        />
                        <motion.circle r="1.5" fill="#fff"><animateMotion dur="3.5s" repeatCount="indefinite" path="M 1700 0 L 1700 100 L 1500 300 L 1070 540" /></motion.circle>


                        {/* --- BOTTOM SIDE TRACES (Origin y=1200) --- */}
                        <motion.path
                            d="M 1000 1200 L 1000 1000 L 1100 900 L 1100 800 L 1050 664"
                            fill="transparent" stroke="#FFB800" strokeWidth="1.5" strokeOpacity="0.4"
                            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2.2, delay: 0.6, ease: "linear" }}
                        />
                        <motion.circle r="2" fill="#fff"><animateMotion dur="3s" repeatCount="indefinite" path="M 1000 1200 L 1000 1000 L 1100 900 L 1100 800 L 1050 664" /></motion.circle>

                        <motion.path
                            d="M 600 1200 L 600 1000 L 800 800 L 950 800 L 950 664"
                            fill="transparent" stroke="#FFB800" strokeWidth="1" strokeOpacity="0.3"
                            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 3, delay: 0.3, ease: "linear" }}
                        />

                        {/* NEW BOTTOM TRACES */}
                        <motion.path
                            d="M 1400 1200 L 1400 1100 L 1300 900 L 1070 670"
                            fill="transparent" stroke="#FFB800" strokeWidth="1" strokeOpacity="0.3"
                            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2.7, delay: 0.4, ease: "linear" }}
                        />
                        <motion.circle r="1.5" fill="#fff"><animateMotion dur="4s" repeatCount="indefinite" path="M 1400 1200 L 1400 1100 L 1300 900 L 1070 670" /></motion.circle>

                        <motion.path
                            d="M 200 1200 L 200 1000 L 400 800 L 800 800 L 940 670"
                            fill="transparent" stroke="#FFB800" strokeWidth="1" strokeOpacity="0.3"
                            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 3.3, delay: 0.8, ease: "linear" }}
                        />

                        {/* --- DIAGONAL FILLERS (Corner Noise) --- */}
                        <motion.path
                            d="M 0 0 L 100 100 L 400 100 L 500 200 L 950 530"
                            fill="transparent" stroke="#FFB800" strokeWidth="0.5" strokeOpacity="0.2"
                            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 4, delay: 1, ease: "linear" }}
                        />
                        <motion.path
                            d="M 2000 0 L 1900 100 L 1600 100 L 1070 530"
                            fill="transparent" stroke="#FFB800" strokeWidth="0.5" strokeOpacity="0.2"
                            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 4.2, delay: 1.1, ease: "linear" }}
                        />
                        <motion.path
                            d="M 0 1200 L 100 1100 L 300 1100 L 500 900 L 940 670"
                            fill="transparent" stroke="#FFB800" strokeWidth="0.5" strokeOpacity="0.2"
                            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 4.5, delay: 1.2, ease: "linear" }}
                        />
                        <motion.path
                            d="M 2000 1200 L 1900 1100 L 1500 1100 L 1300 900 L 1070 670"
                            fill="transparent" stroke="#FFB800" strokeWidth="0.5" strokeOpacity="0.2"
                            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 4.3, delay: 1.3, ease: "linear" }}
                        />

                    </svg>
                </div>

                <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-7xl mx-auto h-[600px]">

                    {/* CENTRAL CPU UNIT */}
                    <div className="relative flex items-center justify-center">
                        <motion.div
                            initial={{ opacity: 0.2, scale: 0.95, filter: "grayscale(100%)" }}
                            animate={{ opacity: 1, scale: 1, filter: "grayscale(0%)" }}
                            transition={{ delay: 2.5, duration: 1.5, ease: "easeOut" }}
                            className="relative w-32 h-32 bg-[#050505] border border-gray-800 rounded-lg flex items-center justify-center z-20 shadow-[0_0_80px_rgba(255,184,0,0.1)]"
                        >
                            {/* Inner Processor Look */}
                            <div className="absolute inset-2 border border-dashed border-gray-700/50 rounded"></div>

                            {/* Core Glow - Pulses only after "connection" */}
                            <motion.div
                                animate={{ boxShadow: ["0 0 0px #FFB800", "0 0 30px #FFB800", "0 0 0px #FFB800"] }}
                                transition={{ duration: 2, repeat: Infinity, delay: 3 }}
                                className="w-16 h-16 bg-[#FFB800]/10 border border-[#FFB800] rounded flex items-center justify-center"
                            >
                                <Cpu className="w-8 h-8 text-[#FFB800]" />
                            </motion.div>

                            {/* Corner Pins */}
                            <div className="absolute -top-1 -left-1 w-2 h-2 bg-gray-500 rounded-full"></div>
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-gray-500 rounded-full"></div>
                            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-gray-500 rounded-full"></div>
                            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-gray-500 rounded-full"></div>

                            {/* Label */}
                            <div className="absolute -bottom-8 text-[10px] text-[#FFB800] font-mono tracking-widest whitespace-nowrap">
                                TW_CORE_V3 // ONLINE
                            </div>
                        </motion.div>
                    </div>

                    {/* CTA APPEARS AFTER CONNECTION */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 4, duration: 1 }}
                        className="absolute bottom-10 z-30 flex flex-col items-center"
                    >
                        {/* Solid background to prevent trace overlap */}
                        <a
                            href="/simulation"
                            className="group relative inline-flex items-center gap-4 px-12 py-5 bg-[#050505] border border-[#FFB800] text-[#FFB800] hover:bg-[#FFB800] hover:text-black transition-all duration-300 tracking-[0.2em] text-sm font-bold uppercase overflow-hidden"
                        >
                            <span className="relative z-10 flex items-center gap-3">
                                <Zap className="w-4 h-4" /> INICIAR UPLINK DE MERCADO
                            </span>

                            {/* Button Glitch Effect */}
                            <div className="absolute inset-0 bg-[#FFB800] translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                        </a>
                        <div className="text-center mt-4 text-[10px] text-gray-500 font-mono tracking-widest animate-pulse bg-[#050505]/80 px-2 py-1">
                            CONEXÃO NEURAL ESTABELECIDA
                        </div>
                    </motion.div>

                </div>
            </section>

            {/* 3. MANIFESTO / ABOUT TEASER */}
            <section id="about" className="min-h-screen flex flex-col justify-center px-6 py-20 border-b border-gray-900 bg-[#050505]">
                <div className="max-w-7xl mx-auto w-full grid md:grid-cols-2 gap-16 items-center">

                    <div className="space-y-8">
                        <div className="text-[#FFB800] text-xs font-bold tracking-[0.2em] mb-4">
                            {t.manifesto.title}
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tight">
                            "{t.manifesto.quote}"
                        </h2>
                        <p className="text-xl text-gray-400 leading-relaxed text-justify font-light">
                            {t.manifesto.body}
                        </p>

                        <div className="pt-8">
                            <a href="/about" className="text-sm font-bold tracking-widest text-white border-b border-[#FFB800] pb-1 hover:text-[#FFB800] transition-colors uppercase">
                                {t.menu.about} <span className="text-[#FFB800]">&rarr;</span>
                            </a>
                        </div>
                    </div>

                    {/* Decorative Graphic - Rotating Manifold */}
                    <div className="relative h-[500px] border border-gray-800 bg-[#020202] p-8 hidden md:flex flex-col justify-between overflow-hidden group hover:border-gray-700 transition-colors">
                        <div className="flex justify-between text-xs text-gray-600 font-mono z-10">
                            <span>RICCI_SCALAR: 0.98</span>
                            <span>LATENCY: 4us</span>
                        </div>

                        {/* Abstract Geometry - Now Visible */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            {/* Outer Rings - Subtle but visible */}
                            <div className="absolute w-[500px] h-[500px] border border-gray-800 rounded-full animate-[spin_60s_linear_infinite] opacity-50"></div>
                            <div className="absolute w-[350px] h-[350px] border border-gray-700 rounded-full animate-[spin_40s_linear_infinite_reverse] opacity-60"></div>

                            {/* Active Core */}
                            <div className="absolute w-[200px] h-[200px] border border-[#FFB800]/30 rounded-full animate-pulse flex items-center justify-center">
                                <div className="w-[180px] h-[180px] border border-[#FFB800]/10 rounded-full animate-[spin_10s_linear_infinite]"></div>
                            </div>

                            {/* Center Singularity Point */}
                            <div className="w-2 h-2 bg-[#FF3300] rounded-full shadow-[0_0_20px_#FF3300] animate-ping"></div>
                        </div>

                        <div className="z-10 text-right text-xs text-[#FF3300] font-mono">
                            SINGULARITY DETECTED
                        </div>
                    </div>

                </div>
            </section>

            {/* 4. ARCHITECTURE SECTION - Matched to About Page Style */}
            <section className="min-h-screen flex flex-col justify-center px-6 py-20 border-b border-gray-900 bg-[#050505]">
                <div className="max-w-7xl mx-auto w-full">
                    <div className="text-[#FFB800] text-xs font-bold tracking-[0.2em] mb-20 text-center uppercase">
                        {t.trinity.title}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                        {/* C++ */}
                        <div className="bg-[#0A0A0A] p-10 border border-gray-800 hover:border-[#FFB800] transition-all group duration-500">
                            <Activity className="w-10 h-10 text-[#FFB800] mb-8 group-hover:scale-110 transition-transform" />
                            <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">{t.trinity.c}</h3>
                            <p className="text-base text-gray-500 font-light leading-relaxed">{t.trinity.c_desc}</p>
                        </div>

                        {/* RUST */}
                        <div className="bg-[#0A0A0A] p-10 border border-gray-800 hover:border-[#FF3300] transition-all group duration-500">
                            <Zap className="w-10 h-10 text-[#FF3300] mb-8 group-hover:scale-110 transition-transform" />
                            <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">{t.trinity.rust}</h3>
                            <p className="text-base text-gray-500 font-light leading-relaxed">{t.trinity.rust_desc}</p>
                        </div>

                        {/* LISP */}
                        <div className="bg-[#0A0A0A] p-10 border border-gray-800 hover:border-white transition-all group duration-500">
                            <Terminal className="w-10 h-10 text-white mb-8 group-hover:scale-110 transition-transform" />
                            <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">{t.trinity.lisp}</h3>
                            <p className="text-base text-gray-500 font-light leading-relaxed">{t.trinity.lisp_desc}</p>
                        </div>

                    </div>
                </div>
            </section>

            {/* 5. FOOTER */}
            <footer className="bg-black py-16 px-6 border-t border-gray-900">
                <div className="max-w-4xl mx-auto text-center space-y-8">

                    <div className="flex flex-col items-center space-y-2">
                        <div className="text-white font-bold tracking-widest uppercase">Thiago Di Faria</div>
                        <div className="text-xs text-gray-600 tracking-widest">{t.infra.role}</div>
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
