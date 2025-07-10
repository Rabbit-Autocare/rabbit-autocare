'use client';
import { useState, useEffect } from 'react';
import { useCart } from '@/hooks/useCart';
import { Package, Plus, ShoppingCart, Percent } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';

export default function FrequentlyBoughtTogether({ initialCombos = [] }) {
  const {
    cartItems,
    clearCart,
    removeFromCart,
    addToCart,
    combos,
    combosLoading,
  } = useCart();
  const [showComboModal, setShowComboModal] = useState(false);
  const [pendingCombo, setPendingCombo] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Use initial combos until cart context is loaded
  const currentCombos = isInitialized ? combos : initialCombos;

  // Mark as initialized once combos are loaded
  useEffect(() => {
    if (!combosLoading && combos.length >= 0) {
      setIsInitialized(true);
    }
  }, [combosLoading, combos.length]);

  const handleAddComboClick = (comboItem) => {
    setPendingCombo(comboItem);
    setShowComboModal(true);
  };

  const handleAddCombo = async (keepOnlyCombo) => {
    setShowComboModal(false);
    if (!pendingCombo) return;

    try {
      if (keepOnlyCombo) {
        // Handle both possible data structures: products or combo_products
        const comboProducts =
          pendingCombo.products || pendingCombo.combo_products || [];
        const comboProductIds = comboProducts.map((p) => p.product_id);
        const comboVariantIds = comboProducts.map((p) => p.variant_id);

        const removals = cartItems
          .filter(
            (item) =>
              comboProductIds.includes(item.product_id || item.product?.id) &&
              comboVariantIds.includes(item.variant?.id)
          )
          .map((item) => removeFromCart(item.id));
        await Promise.all(removals);
      }

      // Handle both possible data structures: products or combo_products
      const comboProducts =
        pendingCombo.products || pendingCombo.combo_products || [];
      const includedVariants = comboProducts.map((item) => ({
        product_id: item.product_id,
        variant_id: item.variant_id,
        quantity: item.quantity,
      }));

      const comboObj = {
        combo_id: pendingCombo.id,
        ...pendingCombo,
      };

      console.log('[FrequentlyBoughtTogether] Adding COMBO:', {
        comboObj,
        includedVariants,
        quantity: 1,
      });

      const success = await addToCart(comboObj, includedVariants, 1);
      if (!success) {
        console.error('Failed to add combo to cart');
      }
    } catch (error) {
      console.error('Error adding combo to cart:', error);
    } finally {
      setPendingCombo(null);
    }
  };

  const calculateSavings = (combo) => {
    if (combo.original_price && combo.price) {
      return combo.original_price - combo.price;
    }
    return 0;
  };

  if (!cartItems || cartItems.length === 0) {
    return null;
  }

  // Find all variant_id values in the cart
  const cartVariantIds = cartItems.map(item => item.variant?.id).filter(Boolean);
  console.log('[FBT] Cart variant IDs:', cartVariantIds);

  // Filter combos to only those that include at least one matching variant_id
  const filteredCombos = (currentCombos || []).filter(combo => {
    const comboProducts = combo.products || combo.combo_products || [];
    const comboVariantIds = comboProducts.map(cp => cp.variant_id).filter(Boolean);
    const hasMatch = comboProducts.some(cp => cartVariantIds.includes(cp.variant_id));
    console.log(`[FBT] Combo ${combo.id} variant IDs:`, comboVariantIds, 'Has match:', hasMatch);
    return hasMatch;
  });
  console.log('[FBT] Filtered combos:', filteredCombos.map(c => c.id));

  return (
    <div className='bg-gray-50 rounded-lg p-4'>
      <h4 className='text-sm font-medium flex items-center gap-2 mb-3'>
        <ShoppingCart size={16} className='text-green-600' />
        Frequently Bought Together
      </h4>

      <div className='space-y-3'>
        <p className='text-xs text-gray-600 mb-3'>
          Based on items in your cart, customers also bought:
        </p>

        {combosLoading && !isInitialized ? (
          <div className='flex items-center justify-center py-8'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900'></div>
          </div>
        ) : (filteredCombos || []).length === 0 ? (
          <div className='flex flex-col items-center justify-center py-6 text-center bg-white rounded border border-dashed border-gray-300'>
            <div className='bg-gray-100 p-2 rounded-full mb-2'>
              <Package size={20} className='text-gray-500' />
            </div>
            <p className='text-gray-600 text-sm'>No combo offers available</p>
            <p className='text-gray-500 text-xs mt-1'>
              Check back later for new combo deals
            </p>
          </div>
        ) : (
          <div className='flex overflow-x-auto space-x-3 pb-2 -mx-4 px-4'>
            {(filteredCombos || []).map((item, index) => {
              const savings = calculateSavings(item);
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className='flex-shrink-0 w-48 border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow'
                >
                  <div className='relative'>
                    <Image
                      src={
                        item.image_url || '/placeholder.svg?height=96&width=192'
                      }
                      alt={item.name}
                      width={200}
                      height={100}
                      className='object-cover'
                    />
                    {savings > 0 && (
                      <div className='absolute top-2 left-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1'>
                        <Percent size={10} />
                        SAVE ₹{savings.toFixed(0)}
                      </div>
                    )}
                    {item.discount_percent && (
                      <div className='absolute top-2 right-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded'>
                        {item.discount_percent}% OFF
                      </div>
                    )}
                  </div>
                  <div className='p-3'>
                    <p className='text-sm font-medium mb-2 line-clamp-2 leading-tight'>
                      {item.name}
                    </p>
                    {item.description && (
                      <p className='text-xs text-gray-500 mb-2 line-clamp-1'>
                        {item.description}
                      </p>
                    )}
                    <p className='text-xs text-blue-600 mb-2'>
                      {item.products?.length ||
                        item.combo_products?.length ||
                        0}{' '}
                      products included
                    </p>
                    <div className='flex items-center justify-between mb-2'>
                      <div className='flex items-center gap-1'>
                        {item.original_price &&
                          item.original_price > item.price && (
                            <span className='text-gray-500 text-xs line-through'>
                              ₹{item.original_price}
                            </span>
                          )}
                        <span className='text-sm font-semibold text-green-600'>
                          ₹{item.price}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddComboClick(item)}
                      className='w-full bg-black text-white text-xs py-2 rounded hover:bg-gray-800 transition-colors flex items-center justify-center gap-1'
                    >
                      <Plus size={12} />
                      ADD COMBO
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {showComboModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40'>
          <div className='bg-white rounded-lg shadow-lg p-6 w-full max-w-xs flex flex-col items-center'>
            <h3 className='text-lg font-semibold mb-4 text-center'>
              How do you want to add this combo?
            </h3>
            <button
              className='w-full mb-2 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded font-medium'
              onClick={() => handleAddCombo(true)}
            >
              Keep only combo (remove other items)
            </button>
            <button
              className='w-full mb-2 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded font-medium'
              onClick={() => handleAddCombo(false)}
            >
              Keep combo and existing products
            </button>
            <button
              className='w-full mt-2 text-xs text-gray-500 hover:text-gray-700'
              onClick={() => setShowComboModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
