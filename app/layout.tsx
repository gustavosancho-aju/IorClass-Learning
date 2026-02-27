import type { Metadata } from 'next'
import { Toaster }       from 'react-hot-toast'
import './globals.css'

export const metadata: Metadata = {
  title: 'Master Speaking — LMS',
  description: 'Plataforma de inglês profissional para eventos e hospitalidade',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body suppressHydrationWarning>
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  )
}
