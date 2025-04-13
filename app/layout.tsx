import '@fontsource/inter/300.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/700.css'

import { Inter } from 'next/font/google'
import StyledComponentsRegistry from './registry'
import ClientLayout from './ClientLayout'
// The ClientScript component will be created during CI build
// import ClientScript from './head-script/client-script'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <title>CymaSphere</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="CymaSphere - Music Analysis Platform" />
        {/* ClientScript will be added during CI build */}
      </head>
      <body className={inter.className}>
        {/* Add a script to load the CSS in production */}
        {process.env.NODE_ENV === 'production' && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                document.addEventListener('DOMContentLoaded', function() {
                  const link = document.createElement('link');
                  link.rel = 'stylesheet';
                  link.href = '/styles/main.css';
                  document.head.appendChild(link);
                });
              `
            }}
          />
        )}
        <StyledComponentsRegistry>
          <ClientLayout>{children}</ClientLayout>
        </StyledComponentsRegistry>
      </body>
    </html>
  )
}
