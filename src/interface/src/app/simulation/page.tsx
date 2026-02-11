'use client';
import dynamic from 'next/dynamic';

const RetroDashboard = dynamic(() => import('@/components/RetroDashboard'), {
    ssr: false,
});

export default function SimulationPage() {
    return <RetroDashboard />;
}
