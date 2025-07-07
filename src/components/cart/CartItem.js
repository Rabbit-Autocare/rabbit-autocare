'use client';
import { useCart } from '@/hooks/useCart';
import Image from 'next/image';
import { X, Plus, Minus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ComboService } from '@/lib/service/comboService';
import { KitService } from '@/lib/service/kitService';

export default function CartItem({ item, formatPrice, getVariantDisplayText }) {
  const { removeFromCart, updateCartItem, updateItemPrice } = useCart();
  const [isUpdating, setIsUpdating] = useState(false);
  const [comboKitDetails, setComboKitDetails] = useState(null);

  useEffect(() => {
    async function fetchComboKit() { 
      if (item.combo_id) {
        const combos = await ComboService.getCombos(item.combo_id);
        const details = combos && combos.length > 0 ? combos[0] : null;
        setComboKitDetails(details);
        if (details) {
          updateItemPrice(item.id, { combo_price: details.price });
        }
      } else if (item.kit_id) {
        const kits = await KitService.getKits(item.kit_id);
        const details = kits && kits.length > 0 ? kits[0] : null;
        setComboKitDetails(details);
        if (details) {
          updateItemPrice(item.id, { kit_price: details.price });
        }
      }
    }
    fetchComboKit();
  }, [item.id, item.combo_id, item.kit_id, updateItemPrice]);

  const handleIncrease = async () => {
    // Check stock before increasing
    const maxStock = item.variant?.stock || item.product?.stock || 999;

    if (item.quantity < maxStock) {
      setIsUpdating(true);
      try {
        const newQuantity = item.quantity + 1;
        const result = await updateCartItem(item.id, newQuantity);

        if (!result) {
          throw new Error('Failed to update quantity');
        }
      } catch (error) {
        console.error('Error increasing quantity:', error);
        // You could add a toast notification here
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const handleDecrease = async () => {
    if (item.quantity <= 1) {
      await handleRemove();
      return;
    }

    setIsUpdating(true);
    try {
      const newQuantity = item.quantity - 1;
      const result = await updateCartItem(item.id, newQuantity);

      if (!result) {
        throw new Error('Failed to update quantity');
      }
    } catch (error) {
      console.error('Error decreasing quantity:', error);
      // You could add a toast notification here
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    setIsUpdating(true);
    try {
      const result = await removeFromCart(item.id);
      if (!result) {
        throw new Error('Failed to remove item');
      }
    } catch (error) {
      console.error('Error removing item:', error);
      // You could add a toast notification here
    } finally {
      setIsUpdating(false);
    }
  };

  if (!item.product && !item.combo_id && !item.kit_id) {
    return null;
  }

  const productName = item.product?.name || item.name || 'Unknown Product';
 const currentPrice =
  item.variant?.base_price ||
  item.variant?.price ||
  item.product?.base_price ||
  item.product?.price ||
  0;

  const productImage =
    item.product?.main_image_url || item.product?.image_url || item.image;
  const productStock = item.product?.stock || item.variant?.stock || 999;

  // Combo/Kit display logic
  const isCombo = !!item.combo_id;
  const isKit = !!item.kit_id;

  // For combos/kits, the variant is an array of included products
  const includedVariants = (isCombo || isKit) && Array.isArray(item.variant) ? item.variant : null;

  // Use combo/kit details if available
  const displayName = comboKitDetails?.name || productName;
  const displayImage = comboKitDetails?.main_image_url || comboKitDetails?.image_url || productImage;
  const displayPrice = comboKitDetails?.price || currentPrice;

  return (
    <div className='flex items-start gap-3 p-3 bg-white rounded-lg border'>
      {/* Product/Combo/Kit image */}
      <div className='relative w-20 h-20 flex-shrink-0 bg-gray-100 rounded overflow-hidden'>
        {displayImage ? (
          <Image
            src={displayImage}
            alt={displayName}
            fill
            sizes='80px'
            className='object-cover'
          />
        ) : (
          <div className='w-full h-full flex items-center justify-center bg-gray-200'>
            <span className='text-gray-400 text-xs'>No image</span>
          </div>
        )}
      </div>

      {/* Product/Combo/Kit info */}
      <div className='flex-1'>
        <h4 className='font-medium text-gray-900 leading-tight'>
          {displayName}
          {isCombo && <span className='ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded'>Combo</span>}
          {isKit && <span className='ml-2 px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded'>Kit</span>}
        </h4>
        <p className='text-blue-600 font-medium mt-1'>
          {formatPrice(displayPrice)}
        </p>

        {/* For combos/kits, list included products/variants with names/images */}
        {includedVariants && comboKitDetails ? (
          <div className='mt-2'>
            <p className='text-xs text-gray-500 mb-1'>Includes:</p>
            <ul className='text-xs text-gray-700 pl-4 list-disc'>
              {(isCombo ? comboKitDetails.combo_products : comboKitDetails.kit_products).map((v, idx) => (
                <li key={v.variant_id || idx} className='flex items-center gap-2'>
                  {v.product?.main_image_url && (
                    <Image src={v.product.main_image_url} alt={v.product.name} width={24} height={24} className='rounded object-cover' />
                  )}
                  <span>{v.product?.name || `Product ID: ${v.product_id}`}</span>
                  <span className='text-gray-500'>x{v.quantity}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          // Regular product variant info
          item.variant && (
            <p className='text-gray-500 text-xs mt-1'>
              {item.variant.size || item.variant.displayText || getVariantDisplayText(item.variant)}
            </p>
          )
        )}

        {/* Stock warning if needed */}
        {item.quantity >= productStock && (
          <p className='text-orange-500 text-xs mt-1'>Max stock reached</p>
        )}

        {/* Quantity controls */}
        <div className='flex items-center gap-2 mt-2'>
          <button
            onClick={handleDecrease}
            className='p-1 rounded-full border hover:bg-gray-100 transition-colors'
            aria-label='Decrease quantity'
            disabled={isUpdating}
          >
            <Minus size={14} />
          </button>
          <span className='px-2 min-w-8 text-center'>{item.quantity}</span>
          <button
            onClick={handleIncrease}
            className='p-1 rounded-full border hover:bg-gray-100 transition-colors'
            aria-label='Increase quantity'
            disabled={item.quantity >= productStock || isUpdating}
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Remove button */}
      <button
        onClick={handleRemove}
        className='p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-red-500 transition-colors'
        aria-label='Remove item'
      >
        <X size={16} />
      </button>
    </div>
  );
}
