// Force dynamic — evita prerender estático quando NEXT_PUBLIC env vars
// não estão disponíveis no build de Preview do Vercel
export const dynamic = 'force-dynamic'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen ms-gradient-bg flex items-center justify-center p-4">
      {children}
    </div>
  )
}
