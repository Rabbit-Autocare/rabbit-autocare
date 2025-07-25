// contexts/WishlistContext.js
"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { WishlistService } from '@/lib/service/wishlistService';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchWishlist = useCallback(async () => {
    console.log('🔍 WishlistContext - Auth state:', { isAuthenticated, user: !!user, authLoading });

    if (authLoading) {
      console.log('⏳ Auth still loading, waiting...');
      return;
    }

    if (!isAuthenticated || !user) {
      console.log('❌ Not authenticated, clearing wishlist');
      setWishlist([]);
      return;
    }

    console.log('✅ Fetching wishlist for user:', user.id);
    setLoading(true);

    try {
      const { data } = await WishlistService.getWishlist();
      console.log('📦 Wishlist data received in context:', data);
      setWishlist(data || []);
    } catch (e) {
      console.error('❌ Wishlist fetch error in context:', e);
      setWishlist([]);
    }
    setLoading(false);
  }, [user, isAuthenticated, authLoading]);

  useEffect(() => {
    if (!authLoading) {
      fetchWishlist();
    }
  }, [fetchWishlist, authLoading]);

  const addToWishlist = async (product, variant) => {
    if (!isAuthenticated || !user) {
      console.log('❌ Cannot add to wishlist: not authenticated');
      return { success: false, message: 'Not authenticated' };
    }

    setLoading(true);
    try {
      const result = await WishlistService.addToWishlistSmart(product, variant);
      if (result.success && result.wishlistItem) {
        setWishlist((prev) => [...prev, result.wishlistItem]);
        console.log('✅ Added to wishlist successfully');
      }
      return result;
    } catch (error) {
      console.error('❌ Add to wishlist error in context:', error);
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (wishlistItemId) => {
    if (!isAuthenticated || !user) {
      return { success: false, message: 'Not authenticated' };
    }

    setLoading(true);
    try {
      await WishlistService.removeFromWishlist(wishlistItemId);
      setWishlist((prev) => prev.filter(item => item.id !== wishlistItemId));
      console.log('✅ Removed from wishlist successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Remove from wishlist error in context:', error);
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  const refreshWishlist = useCallback(() => {
    console.log('🔄 Refreshing wishlist...');
    fetchWishlist();
  }, [fetchWishlist]);

  return (
    <WishlistContext.Provider value={{
      wishlist,
      loading,
      addToWishlist,
      removeFromWishlist,
      refreshWishlist,
      isAuthenticated
    }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
