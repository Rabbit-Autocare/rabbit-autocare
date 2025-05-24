import { Inter } from 'next/font/google';
import './globals.css';
import Footer from '@/components/layout/Footer';
import { CartProvider } from '@/contexts/CartContext';
import MainNavbar from '@/components/navigation/MainNavbar';
import { ThemeProvider } from '@/contexts/ThemeContext';
//import { AuthProvider } from '@/contexts/AuthContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'AutoCare - Quality Auto Parts',
  description: 'Your trusted source for quality auto parts and accessories.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
     
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <CartProvider>
              <MainNavbar />
              {children}
              <Footer />
            </CartProvider>
          </ThemeProvider>
      </body>
    </html>
  );
}
