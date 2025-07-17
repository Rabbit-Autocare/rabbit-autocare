"use client";
import { WishlistProvider } from "./WishlistContext";

export default function WishlistProviderClient({ children }) {
  return <WishlistProvider>{children}</WishlistProvider>;
}
