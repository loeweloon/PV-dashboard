import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg:       '#f0ede8',
        bg2:      '#e8e4de',
        dark:     '#111110',
        dark2:    '#1e1d1b',
        ink:      '#2a2925',
        ink2:     '#6b6860',
        ink3:     '#a09d98',
        lime:     '#b8e04a',
        lime2:    '#cce96a',
        'lime-dark': '#7aab1e',
        border:   'rgba(42,41,37,0.1)',
        border2:  'rgba(42,41,37,0.06)',
        completed:   '#3dd68c',
        construction:'#4a9eff',
        launched:    '#f59e0b',
        planning:    '#94a3b8',
        pending:     '#a78bfa',
        stopped:     '#f87171',
      },
      fontFamily: {
        syne:   ['var(--font-syne)', 'sans-serif'],
        sans:   ['var(--font-dm-sans)', 'sans-serif'],
        mono:   ['var(--font-dm-mono)', 'monospace'],
      },
      borderRadius: {
        card: '16px',
        sm:   '10px',
        pill: '100px',
      },
      boxShadow: {
        card: '0 2px 12px rgba(42,41,37,0.07)',
        lg:   '0 8px 40px rgba(42,41,37,0.11)',
      },
    },
  },
  plugins: [],
}

export default config
