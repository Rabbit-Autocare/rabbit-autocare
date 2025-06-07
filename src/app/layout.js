import { Inter } from "next/font/google"
import "./globals.css"
import ClientLayout from "./client-layout"
import ScrollHandler from "@/components/ScrollHandler"
import { CartProvider } from "@/contexts/CartContext"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "AutoCare - Quality Auto Parts",
  description: "Your trusted source for quality auto parts and accessories.",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ScrollHandler />
        {/* ✅ ScrollSmoother wrapper - restored for all pages */}
        <div id="smooth-wrapper">
          <div id="smooth-content">
            <CartProvider>
              <ClientLayout>{children}</ClientLayout>
            </CartProvider>
          </div>
        </div>
      </body>
    </html>
  )
}
