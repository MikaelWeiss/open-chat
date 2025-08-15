/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Elegant theme extensions
        glass: "hsla(var(--glass))",
        surface: "hsl(var(--surface))",
        'surface-hover': "hsl(var(--surface-hover))",
        'elegant-shadow': "hsla(var(--shadow))",
      },
      backgroundImage: {
        'gradient-elegant': 'linear-gradient(135deg, hsl(var(--gradient-start)), hsl(var(--gradient-end)))',
        'gradient-subtle': 'linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--gradient-end) / 0.15))',
        'shimmer': 'linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
      },
      backdropBlur: {
        'elegant': '10px',
        'strong': '20px',
      },
      boxShadow: {
        'elegant': '0 1px 3px 0 hsla(var(--shadow)), 0 1px 2px -1px hsla(var(--shadow))',
        'elegant-lg': '0 10px 15px -3px hsla(var(--shadow)), 0 4px 6px -4px hsla(var(--shadow))',
        'elegant-xl': '0 20px 25px -5px hsla(var(--shadow)), 0 10px 10px -5px hsla(var(--shadow))',
        'glow': '0 0 20px hsl(var(--primary) / 0.3)',
        'glow-strong': '0 0 30px hsl(var(--primary) / 0.4)',
      },
      padding: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      animation: {
        'slide-in': 'slide-in 0.2s ease-out',
        'slide-out': 'slide-out 0.2s ease-out',
      },
      keyframes: {
        'slide-in': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'slide-out': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' },
        },
      },
    },
  },
  plugins: [],
}