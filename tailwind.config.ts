import type { Config } from "tailwindcss";


export default {
    darkMode: ["class"],
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: '#F9FAFB',
  			foreground: '#1F2937',
  			primary: {
  				DEFAULT: '#4F46E5',
  				foreground: '#FFFFFF'
  			},
  			secondary: {
  				DEFAULT: '#6366F1',
  				foreground: '#FFFFFF'
  			},
  			destructive: {
  				DEFAULT: '#EF4444',
  				foreground: '#FFFFFF'
  			},
  			muted: {
  				DEFAULT: '#E5E7EB',
  				foreground: '#6B7280'
  			},
  			accent: {
  				DEFAULT: '#F3F4F6',
  				foreground: '#1F2937'
  			},
  			popover: {
  				DEFAULT: '#FFFFFF',
  				foreground: '#1F2937'
  			},
  			card: {
  				DEFAULT: '#FFFFFF',
  				foreground: '#1F2937'
  			},
  			success: '#10B981'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		boxShadow: {
  			card: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}