import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Conductor design system colors
        conductor: {
          bg: {
            DEFAULT: '#0a0a0a',
            page: 'var(--conductor-page-background)',
            card: 'var(--conductor-card-background)',
            input: 'var(--conductor-input-background)',
            nav: 'var(--conductor-nav-background)',
          },
          text: {
            DEFAULT: 'var(--conductor-body-color)',
            title: 'var(--conductor-title-color)',
            muted: 'var(--conductor-muted-color)',
          },
          border: {
            DEFAULT: 'var(--conductor-card-border)',
            input: 'var(--conductor-input-border)',
            nav: 'var(--conductor-nav-border)',
          },
          primary: 'var(--conductor-primary)',
          secondary: 'var(--conductor-secondary)',
          accent: 'var(--conductor-accent)',
          danger: 'var(--conductor-danger)',
          success: 'var(--conductor-success)',
        },
      },
      fontFamily: {
        title: 'var(--conductor-title-font)',
        body: 'var(--conductor-body-font)',
      },
      fontSize: {
        'title': 'var(--conductor-title-size)',
        'body': 'var(--conductor-body-size)',
      },
      borderRadius: {
        'card': 'var(--conductor-card-radius)',
        'button': 'var(--conductor-button-radius)',
        'input': 'var(--conductor-input-radius)',
      },
    },
  },
  plugins: [],
};
export default config;
