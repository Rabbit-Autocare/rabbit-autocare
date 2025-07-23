"use client";
import { useCart } from "@/hooks/useCart";

export default function PriceSummary({ 
  formatPrice, 
  deliveryCharge = 0,  // ✅ Add deliveryCharge prop
  orderTotals = {}     // ✅ Add orderTotals prop
}) {
  const { cartItems, coupon } = useCart();
  const GST_RATE = 18;
  
  let subtotal = 0;
  let gstRemoved = 0;
  let basePrice = 0;
  
  // ✅ Existing cart calculation logic (keep as is)
  cartItems.forEach(item => {
    const qty = item.quantity || 1;
    const getPrice = (incl, excl) => {
      const priceIncl = Number(incl) || 0;
      const priceExcl = excl ?? priceIncl / 1.18;
      return [priceIncl * qty, priceExcl * qty];
    };

    if (item.kit_id && item.kit_price) {
      const [incl, excl] = getPrice(item.kit_price, item.kit_price_excluding_gst);
      subtotal += incl;
      basePrice += excl;
    } else if (item.combo_id && item.combo_price) {
      const [incl, excl] = getPrice(item.combo_price, item.combo_price_excluding_gst);
      subtotal += incl;
      basePrice += excl;
    } else if (Array.isArray(item.variant)) {
      item.variant.forEach(v => {
        const [incl, excl] = getPrice(v.base_price, v.base_price_excluding_gst);
        subtotal += incl;
        basePrice += excl;
      });
    } else {
      const v = item.variant || {};
      const [incl, excl] = getPrice(v.base_price, v.base_price_excluding_gst);
      subtotal += incl;
      basePrice += excl;
    }
  });

  gstRemoved = subtotal - basePrice;
  
  let discount = 0;
  if (coupon?.percent) {
    discount = Math.round(basePrice * (coupon.percent / 100));
  } else if (coupon?.discount) {
    const discountIncl = Number(coupon.discount);
    discount = Math.round(discountIncl / 1.18);
  }

  const discountedBase = basePrice - discount;
  const netAmount = discountedBase + gstRemoved; // Amount before delivery
  
  // ✅ Check if free delivery applies
  const isFreeDelivery = netAmount >= 499;
  const actualDeliveryCharge = isFreeDelivery ? 0 : deliveryCharge;
  
  // ✅ Final total with delivery
  const finalTotal = netAmount + actualDeliveryCharge;
  const youSaved = subtotal - finalTotal;

  if (!cartItems?.length) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Price Summary</h3>
      
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span>Subtotal ({cartItems.length} items)</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        
        {discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount ({coupon?.code})</span>
            <span>-{formatPrice(discount * 1.18)}</span>
          </div>
        )}
        
        {/* ✅ ADD DELIVERY CHARGES SECTION */}
        <div className="flex justify-between">
          <span>Delivery Charges</span>
          <span className={isFreeDelivery ? "text-green-600" : ""}>
            {isFreeDelivery ? (
              <>
                <span className="line-through text-gray-400">{formatPrice(deliveryCharge)}</span>
                <span className="ml-2 text-green-600 font-medium">FREE</span>
              </>
            ) : (
              formatPrice(actualDeliveryCharge)
            )}
          </span>
        </div>
        
        <hr className="my-3" />
        
        <div className="flex justify-between font-semibold text-lg">
          <span>Total</span>
          <span>{formatPrice(finalTotal)}</span>
        </div>
        
        {/* ✅ DELIVERY SAVINGS MESSAGE */}
        {isFreeDelivery && deliveryCharge > 0 && (
          <div className="text-xs text-green-600 mt-2 bg-green-50 p-2 rounded">
            🎉 You saved {formatPrice(deliveryCharge)} on delivery!
          </div>
        )}
        
        {/* ✅ FREE DELIVERY ENCOURAGEMENT */}
        {!isFreeDelivery && netAmount > 0 && netAmount < 499 && (
          <div className="text-xs text-orange-600 mt-2 bg-orange-50 p-2 rounded">
            💡 Add {formatPrice(499 - netAmount)} more for FREE delivery
          </div>
        )}
        
        {youSaved > 0 && (
          <div className="text-green-600 text-sm mt-2 bg-green-50 p-2 rounded">
            You saved {formatPrice(youSaved)} on this order!
          </div>
        )}
      </div>
    </div>
  );
}
