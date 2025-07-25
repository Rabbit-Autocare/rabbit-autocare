import localFont from "next/font/local";
import "./globals.css";
import ClientLayout from "./client-layout";
import { AuthProvider } from '@/contexts/AuthContext' // Make sure this points to contexts, not hooks
import ClientOnly from '../components/ClientOnly.jsx';
import { WishlistProvider } from "@/contexts/WishlistContext";

// Font configurations (keep as is)
const montserrat = localFont({
  src: [
    { path: '../../public/fonts/Montserrat-Regular.ttf', weight: '400', style: 'normal' },
    { path: '../../public/fonts/Montserrat-Bold.ttf', weight: '700', style: 'normal' },
  ],
  variable: '--font-montserrat',
  display: 'swap',
});

const sansation = localFont({
  src: '../../public/fonts/Sansation-Regular.ttf',
  variable: '--font-sansation',
  display: 'swap',
});

  const metadata = {
    title: "Rabbit AutoCare – Premium Car Care Products",
    description:
      "Discover Rabbit AutoCare – a new standard in car care. From high-performance detailing sprays to advanced interior protection, our products are engineered for results and built for enthusiasts.",
    openGraph: {
      title: "Rabbit AutoCare | Engineered for Results",
      description:
        "Explore Rabbit AutoCare's premium car detailing range. Trusted by professionals, loved by enthusiasts. Clean, protect, and shine — with every drive.",
      url: "https://www.rabbitautocare.com",
      siteName: "Rabbit AutoCare",
      images: [
        {
          url: "https://www.rabbitautocare.com/assets/images/EXTERIORcat.webp",
          alt: "Rabbit AutoCare Premium Car Care Products",
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Rabbit AutoCare | Premium Car Detailing Products",
      description:
        "Clean deeper. Shine brighter. Protect longer. Rabbit AutoCare delivers professional-grade products for your car's interior and exterior care.",
      images: [
        "https://www.rabbitautocare.com/assets/images/EXTERIORcat.webp",
      ],
    },
  };



export default async function RootLayout({ children }) {
  // Note: No more session checking here since we use custom auth
  let initialCartItems = [];

  // You can still fetch cart items if you have user context from cookies/headers
  // For now, we'll start with empty cart and let client-side handle it

  return (
    <html lang="en" className={`${montserrat.variable} ${sansation.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        {/* Custom AuthProvider instead of Supabase auth */}
        <AuthProvider>
          <ClientOnly>
            <WishlistProvider>
              <div id="smooth-wrapper">
                <div id="smooth-content">
                  <ClientLayout initialCartItems={initialCartItems}>{children}</ClientLayout>
                </div>
              </div>
            </WishlistProvider>
          </ClientOnly>
        </AuthProvider>
      </body>
    </html>
  );
}
