// app/layout.js
import { Inter } from "next/font/google";
import "./globals.css";
import ClientLayout from "./client-layout";
import { AuthProvider } from '@/contexts/AuthContext'
import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { fetchCartItems } from '@/lib/service/cartService';
import { transformCartForCheckout } from '@/lib/utils/cartTransformUtils';

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Rabbit Auto Care",
  description: "Your one-stop shop for auto care products",
};

export default async function RootLayout({ children }) {
  // SSR: Get user session and userId
  let initialCartItems = [];
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (userId) {
      const rawCartItems = await fetchCartItems(userId);
      initialCartItems = await transformCartForCheckout(rawCartItems, userId);
    }
  } catch (e) {
    // Fail silently, fallback to empty cart
    initialCartItems = [];
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
          {/* ✅ ScrollSmoother wrapper */}
          <div id="smooth-wrapper">
            <div id="smooth-content">
              <ClientLayout initialCartItems={initialCartItems}>{children}</ClientLayout>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
