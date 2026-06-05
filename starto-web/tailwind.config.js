/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "var(--primary)",
                background: "var(--background)",
                surface: "var(--surface)",
                "surface-2": "var(--surface-2)",
                border: "var(--border)",
                "text-primary": "var(--text-primary)",
                "text-secondary": "var(--text-secondary)",
                "text-muted": "var(--text-muted)",
                "accent-green": "#10B981",
                "accent-yellow": "#EAB308",
                "accent-blue": "#3B82F6",
                "accent-red": "#EF4444",
            },
            fontFamily: {
                display: ["var(--font-display)", "serif"],
                sans: ["var(--font-body)", "sans-serif"],
                mono: ["var(--font-mono)", "monospace"],
            },
        },
    },
    plugins: [],
}
