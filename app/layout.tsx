// Removing next/font imports to avoid lightningcss issues
// import { Inter, Roboto_Mono } from 'next/font/google'
import StyledComponentsRegistry from './registry'
import ClientLayout from './ClientLayout'
// The ClientScript component will be created during CI build
// import ClientScript from './head-script/client-script'
import './globals.css'
import { Metadata } from 'next'

// Commented out font configuration
/*
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const roboto_mono = Roboto_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto-mono',
})
*/

// Theme configuration
export const theme = {
  colors: {
    primary: '#4f46e5',
    primaryLight: '#6366f1',
    primaryDark: '#4338ca',
    secondary: '#06b6d4',
    secondaryLight: '#22d3ee',
    secondaryDark: '#0891b2',
    accent: '#f97316',
    accentLight: '#fb923c',
    accentDark: '#ea580c',
    background: '#0f172a',
    foreground: '#f8fafc',
    card: '#1e293b',
    cardForeground: '#f8fafc',
    popover: '#1e293b',
    popoverForeground: '#f8fafc',
    muted: '#334155',
    mutedForeground: '#94a3b8',
    border: '#334155',
    input: '#334155',
    ring: '#4f46e5',
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  },
}

export const metadata: Metadata = {
  title: 'CymaSphere',
  description: 'CymaSphere - Music Analysis Platform'
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <StyledComponentsRegistry>
          <ClientLayout>{children}</ClientLayout>
        </StyledComponentsRegistry>
      </body>
    </html>
  )
}
