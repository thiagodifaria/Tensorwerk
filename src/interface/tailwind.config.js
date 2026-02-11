/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                accent: '#FF3300', // International Orange
                'bg-main': '#121212',
                grid: '#333333',
                'text-main': '#E0E0E0',
                'text-muted': '#666666',
            },
            fontFamily: {
                mono: ['IBM Plex Mono', 'monospace'],
            },
        },
    },
    plugins: [],
}
