/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        devops: {
          dark: '#0f172a',
          card: '#1e293b',
          primary: '#3b82f6',
          success: '#22c55e',
          error: '#ef4444',
          warning: '#f59e0b',
          border: '#334155'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      }
    },
  },
  plugins: [],
}