
import React from 'react';

export default function OrderSummary({
  cartItems,
  updateProductQuantity,
  appliedCoupon,
  subtotal,
  discount,
  grandTotal,
  loading,
  onPlaceOrder,
}) {
  return (
    <div className='bg-white p-4 shadow rounded'>
      <h2 className='text-xl font-semibold mb-2'>Order Summary</h2>
      {cartItems.map((item, index) => (
        <div
          key={`${item.product_id}-${item.variant_id || index}`}
          className='border-b py-2 flex justify-between items-center'
        >
          <div>
            <p className='font-medium'>{item.name}</p>
            <p className='text-sm text-gray-600'>Size: {item.variant_size}</p>
            <p className='text-sm text-gray-600'>₹{item.price}</p>
          </div>
          <input
            type='number'
            min={1}
            max={item.variant_stock}
            value={item.quantity}
            onChange={(e) =>
              updateProductQuantity(item.id, parseInt(e.target.value))
            }
            className='w-16 border rounded p-1 text-center'
          />
          <p className='font-semibold'>₹{(item.price * item.quantity).toFixed(2)}</p>
        </div>
      ))}

      {appliedCoupon && (
        <div className='mt-4 pt-4 border-t'>
          <h3 className='font-medium mb-2'>Applied Coupon</h3>
          <div className='bg-green-50 p-2 rounded mt-2 text-sm'>
            <p>
              <span className='font-medium'>{appliedCoupon.code}</span> applied - {appliedCoupon.discount_percent}% off
            </p>
            <p className='text-xs text-gray-600'>{appliedCoupon.description}</p>
          </div>
        </div>
      )}

      <div className='mt-4'>
        <div className='flex justify-between'>
          <span>Subtotal:</span>
          <span>₹{subtotal.toFixed(2)}</span>
        </div>
        {appliedCoupon && (
          <div className='flex justify-between text-green-600'>
            <span>Discount ({appliedCoupon.code}):</span>
            <span>-₹{discount.toFixed(2)}</span>
          </div>
        )}
        <div className='flex justify-between font-bold text-lg mt-2'>
          <span>Grand Total:</span>
          <span>₹{grandTotal.toFixed(2)}</span>
        </div>
      </div>

      <button
        onClick={onPlaceOrder}
        disabled={loading}
        className='mt-4 w-full bg-green-600 text-white py-2 rounded hover:bg-green-700'
      >
        {loading ? 'Placing Order...' : 'Place Order'}
      </button>
    </div>
  );
}
