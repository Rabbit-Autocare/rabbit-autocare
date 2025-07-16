"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { WishlistService } from '@/lib/service/wishlistService';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setWishlist([]);
      return;
    }
    setLoading(true);
    try {
      const { data } = await WishlistService.getWishlist();
      setWishlist(data || []);
    } catch (e) {
      setWishlist([]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const addToWishlist = async (product, variant) => {
    if (!user) return;
    setLoading(true);
    try {
      const { success, wishlistItem } = await WishlistService.addToWishlistSmart(product, variant);
      if (success) {
        setWishlist((prev) => [...prev, wishlistItem]);
      }
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (wishlistItemId) => {
    if (!user) return;
    setLoading(true);
    try {
      await WishlistService.removeFromWishlist(wishlistItemId);
      setWishlist((prev) => prev.filter(item => item.id !== wishlistItemId));
    } finally {
      setLoading(false);
    }
  };

  const refreshWishlist = fetchWishlist;

  return (
    <WishlistContext.Provider value={{ wishlist, loading, addToWishlist, removeFromWishlist, refreshWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
