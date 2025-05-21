'use client';
import { useCart } from '@/hooks/useCart';
import Image from 'next/image';
import { X, Plus, Minus } from 'lucide-react';

export default function CartItem({ item }) {
  const { removeFromCart, updateQuantity } = useCart();

  const handleIncrease = () => {
    // Check stock before increasing
    if (item.quantity < item.product.stock) {
      updateQuantity(item.id, item.quantity + 1);
    }
  };

  const handleDecrease = () => {
    if (item.quantity > 1) {
      updateQuantity(item.id, item.quantity - 1);
    } else {
      removeFromCart(item.id);
    }
  };

  if (!item.product) {
    return null; // Handle case where product data might be missing
  }

  return (
    <div className="flex items-start gap-3 p-3 bg-white rounded-lg border">
      {/* Product image */}
      <div className="relative w-20 h-20 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
        {item.product.image_url ? (
          <Image
            src={item.product.image_url}
            alt={item.product.name}
            fill
            sizes="80px"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <span className="text-gray-400 text-xs">No image</span>
          </div>
        )}
      </div>

      {/* Product info */}
      <div className="flex-1">
        <h4 className="font-medium text-gray-900 leading-tight">
          {item.product.name}
        </h4>
        <p className="text-blue-600 font-medium mt-1">₹{item.product.price}</p>
        
        {/* Stock warning if needed */}
        {item.quantity >= item.product.stock && (
          <p className="text-orange-500 text-xs mt-1">Max stock reached</p>
        )}

        {/* Quantity controls */}
        <div className="flex items-center gap-2 mt-2">
          <button 
            onClick={handleDecrease}
            className="p-1 rounded-full border hover:bg-gray-100"
            aria-label="Decrease quantity"
          >
            <Minus size={14} />
          </button>
          <span className="px-2 min-w-8 text-center">{item.quantity}</span>
          <button 
            onClick={handleIncrease}
            className="p-1 rounded-full border hover:bg-gray-100"
            aria-label="Increase quantity"
            disabled={item.quantity >= item.product.stock}
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Remove button */}
      <button
        onClick={() => removeFromCart(item.id)}
        className="p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-red-500"
        aria-label="Remove item"
      >
        <X size={16} />
      </button>
    </div>
  );
}