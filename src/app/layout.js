// app/layout.js
import { Inter } from "next/font/google";
import "./globals.css";
import ClientLayout from "./client-layout";
import { AuthProvider } from '@/contexts/AuthContext'

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Rabbit Auto Care",
  description: "Your one-stop shop for auto care products",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
          {/* ✅ ScrollSmoother wrapper */}
          <div id="smooth-wrapper">
            <div id="smooth-content">
              <ClientLayout>{children}</ClientLayout>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
