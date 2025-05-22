import { Inter } from 'next/font/google';
import './globals.css';
//import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MainNavbar from '@/components/MainNavbar';
import { CartProvider } from '@/contexts/CartContext';
const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'AutoCare - Quality Auto Parts',
  description: 'Your trusted source for quality auto parts and accessories.',
};

export default function RootLayout({ children }) {
  return (
    <html lang='en'>
      <body className={inter.className}>
        <CartProvider>
          <MainNavbar/>
        {children}
        <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
