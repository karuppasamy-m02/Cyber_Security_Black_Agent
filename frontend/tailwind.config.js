/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // CYBER BLACK Master Palette
        obsidian: {
          DEFAULT: '#0A0A0A',
          deep: '#050505',
          card: '#121212',
          surface: '#151515',
          hover: '#1B1B1B',
        },
        graphite: {
          DEFAULT: '#2B2B2B',
          light: '#3D3D3D',
          border: '#2B2B2B',
          subtle: '#222222',
        },
        ash: {
          DEFAULT: '#A8A8A3',
          light: '#C4C4C0',
          dark: '#6E6E6A',
          muted: '#858580',
        },
        ivory: {
          DEFAULT: '#F5F5F2',
          muted: '#E5E5E0',
          pure: '#FFFFFF',
        },
        // Semantic Enterprise Palette (Obsidian / Graphite / Ash / Ivory)
        cs: {
          bg: 'var(--cs-bg)',
          surface: 'var(--cs-surface)',
          'surface-subtle': 'var(--cs-surface-subtle)',
          border: 'var(--cs-border)',
          text: 'var(--cs-text)',
          muted: 'var(--cs-muted)',
          accent: 'var(--cs-accent)',
          'accent-subtle': 'var(--cs-accent-subtle)',
          secondary: 'var(--cs-secondary)',
          'secondary-subtle': 'var(--cs-secondary-subtle)',
        },
        // Direct Dark Theme Tokens
        dark: {
          bg: '#0A0A0A',
          surface: '#121212',
          secondary: '#181818',
          border: '#2B2B2B',
          text: '#F5F5F2',
          muted: '#A8A8A3',
          accent: '#F5F5F2',
          teal: '#A8A8A3',
        },
        // Direct Light Theme Tokens
        light: {
          bg: '#F5F5F2',
          surface: '#FFFFFF',
          secondary: '#EBEBE6',
          border: '#D4D4CE',
          text: '#0A0A0A',
          muted: '#6E6E6A',
          accent: '#0A0A0A',
          teal: '#2B2B2B',
        },
        // Severity Semantic Colors (Subtle & Precision tuned)
        severity: {
          critical: '#EF4444',
          high: '#F97316',
          medium: '#EAB308',
          low: '#A8A8A3',
          info: '#78716C',
          healthy: '#22C55E',
        },
      },
      fontFamily: {
        sans: ['Geist', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['Geist Mono', 'JetBrains Mono', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '6px',
        sm: '4px',
        md: '6px',
        lg: '8px',
        xl: '12px',
        '2xl': '16px',
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.4)',
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.5), 0 1px 2px -1px rgba(0, 0, 0, 0.5)',
        popover: '0 4px 12px -2px rgba(0, 0, 0, 0.6), 0 2px 4px -2px rgba(0, 0, 0, 0.4)',
      },
    },
  },
  plugins: [],
}
