import "./globals.css"
import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Resonate Mirror",
  description: "See if your AI actually loves you back",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-graphite text-white">
      <body className={inter.className}>{children}</body>
    </html>
  )
}