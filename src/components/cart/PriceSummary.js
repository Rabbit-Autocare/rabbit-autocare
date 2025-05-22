'use client';
import { useCart } from '@/hooks/useCart';

export default function PriceSummary() {
  const { 
    calculateSubtotal, 
    calculateDiscount, 
    calculateTotal, 
    coupon 
  } = useCart();

  const subtotal = calculateSubtotal();
  const discount = calculateDiscount();
  const total = calculateTotal();

  return (
    <div className="bg-white rounded-lg border p-4">
      <h4 className="text-sm font-medium mb-3">Price Details</h4>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal</span>
          <span>₹{subtotal}</span>
        </div>
        
        {discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount ({coupon?.code})</span>
            <span>-₹{discount}</span>
          </div>
        )}
        
        <div className="border-t pt-2 mt-2 flex justify-between font-medium">
          <span>Total</span>
          <span>₹{total}</span>
        </div>
        
        {discount > 0 && (
          <p className="text-green-600 text-xs font-medium">You saved ₹{discount} on this order</p>
        )}
      </div>
    </div>
  );
}