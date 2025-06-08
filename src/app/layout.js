// app/layout.js
import { Inter } from "next/font/google";
import "./globals.css";
import ClientLayout from "./client-layout";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "AutoCare - Quality Auto Parts",
  description: "Your trusted source for quality auto parts and accessories.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        {/* ✅ ScrollSmoother wrapper */}
        <div id="smooth-wrapper">
          <div id="smooth-content">
            <ClientLayout>{children}</ClientLayout>
          </div>
        </div>
      </body>
    </html>
  );
}
