import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand primary — coral (matches the Rezzy logo)
        primary: {
          50: '#FFF3F1',
          100: '#FFE4DF',
          200: '#FFC9C0',
          300: '#FFA89B',
          400: '#FF8475',
          500: '#FF6B6B',
          600: '#F0463F',
          700: '#D32F2A',
          800: '#AE2722',
          900: '#8F211D',
          coral: '#FF6B6B',
          dark: '#D32F2A',
          DEFAULT: '#FF6B6B',
          foreground: '#FFFFFF',
        },
        // Secondary — warm dark brown (coat / boots in logo)
        secondary: {
          50: '#F5F0EE',
          100: '#E7DBD6',
          200: '#CBB4AB',
          300: '#A98A7C',
          400: '#836055',
          500: '#5D4037',
          600: '#4E352D',
          700: '#3E2A24',
          800: '#2F201B',
          900: '#241813',
          'dark-brown': '#5D4037',
          light: '#8D6E63',
          DEFAULT: '#5D4037',
          foreground: '#FFFFFF',
        },
        // Accent — feather red
        accent: {
          red: '#D90429',
          DEFAULT: '#D90429',
          foreground: '#FFFFFF',
        },
        success: { DEFAULT: '#16A34A', foreground: '#FFFFFF' },
        warning: { DEFAULT: '#F59E0B', foreground: '#FFFFFF' },
        ring: '#FF6B6B',
        background: '#F3F2EF',
        surface: '#FFFFFF',
        text: '#1F2328',
        border: '#E3E2DF',
        foreground: '#1F2328',
        'muted-foreground': '#6B7280',
        muted: {
          DEFAULT: '#F3F4F6',
          foreground: '#6B7280',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
      },
      transitionTimingFunction: {
        expo: 'cubic-bezier(0.16, 1, 0.3, 1)',
        smooth: 'cubic-bezier(0.22, 1, 0.36, 1)',
        'in-out-soft': 'cubic-bezier(0.65, 0, 0.35, 1)',
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.08)',
        'card-hover': '0 8px 24px rgba(16,24,40,0.10), 0 2px 6px rgba(16,24,40,0.06)',
        focus: '0 0 0 3px rgba(255,107,107,0.35)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config
