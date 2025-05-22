'use client';
import { Inter } from 'next/font/google';
import './globals.css';
import MainNavbar from '../components/MainNavbar';
import { CartProvider } from '../contexts/CartContext';
import CartDrawer from '../components/cart/CartDrawer';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }) {
  return (
    <html lang='en'>
      <body className={inter.className}>
        <CartProvider>
          <MainNavbar />
          {children}
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
