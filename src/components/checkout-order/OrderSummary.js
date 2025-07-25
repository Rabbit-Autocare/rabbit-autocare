"use client"
import Image from "next/image"

// Helper function to display variant info
function getVariantDisplayText(variant, isMicrofiber) {
  if (!variant) return null;
  if (isMicrofiber) {
    const size = variant.size ? `${variant.size}` : '';
    const color = variant.color ? `${variant.color}` : '';
    const gsm = variant.gsm ? `${variant.gsm}gsm` : '';
    return [size, color, gsm].filter(Boolean).join(', ');
  } else if ((variant.quantity && variant.unit) || (variant.quantity_value && variant.unit)) {
    const q = variant.quantity || variant.quantity_value;
    return `${q}${variant.unit}`;
  } else if (variant.displayText) {
    return variant.displayText;
  }
  return '';
}

export default function OrderSummary({
  items,
  updateItemQuantity,
  coupon,
  orderTotals,
  deliveryCharge,
  loading,
  onPlaceOrder,
  selectedShippingAddressId // Add this prop
}) {
  const calculatedSubtotal = items.reduce((sum, item) => {
    const unit = item.price || 0;
    const qty = item.quantity || 1;
    const total = item.total_price ?? unit * qty;
    return sum + total;
  }, 0);

  const calculatedGrandTotal = calculatedSubtotal - (orderTotals.discount || 0) + (deliveryCharge || 0);

  // Calculate cart value for delivery message condition
  const cartValue = orderTotals.subtotal - (orderTotals.discount || 0);
  const showDeliveryMessage = !selectedShippingAddressId && cartValue < 499;

  const renderPrice = (item) => (
    <div className="text-xl font-bold text-black">
      ₹{(item.total_price ?? (item.price || 0) * (item.quantity || 1)).toFixed(2)}
    </div>
  );

  const renderProductItem = (item) => (
    <div key={item.id} className="group relative">
      <div className="bg-white p-6 rounded-[4px] border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-300">
        <div className="flex items-start gap-6">
          <div className="flex-shrink-0 relative">
            <div className="w-20 h-20 rounded-[4px] overflow-hidden bg-gray-50 border border-gray-200 shadow-sm">
              <Image
                src={item.main_image_url || "/placeholder.svg"}
                alt={item.name}
                width={80}
                height={80}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-black leading-tight mb-2">{item.name}</h4>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500 font-medium">
                    Code: <span className="text-gray-700">{item.variant?.variant_code || item.product_code || item.variant?.code || 'N/A'}</span>
                  </p>
                  {item.variant_display_text && item.variant_display_text !== "Default" && (
                    <p className="text-sm text-[#601E8D] font-medium">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-50 text-[#601E8D] border border-purple-200">
                        {item.variant_display_text}
                      </span>
                    </p>
                  )}
                  {item.variant && (
                    <p className="text-xs text-gray-500">
                      {getVariantDisplayText(item.variant, item.is_microfiber)}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
              <div className="text-sm text-gray-600">
                <span className="font-medium">₹{item.price}</span> × {item.quantity}
              </div>
              {renderPrice(item)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderComboItem = (item) => (
    <div key={item.id} className="group relative">
      <div className="bg-purple-50 p-6 rounded-[4px] border-2 border-purple-200 hover:border-purple-300 hover:shadow-sm transition-all duration-300">
        <div className="flex items-start gap-6">
          <div className="flex-shrink-0 relative">
            <div className="w-20 h-20 rounded-[4px] overflow-hidden bg-purple-100 border border-purple-200 shadow-sm">
              <Image
                src={item.main_image_url || "/placeholder.svg"}
                alt={item.name}
                width={80}
                height={80}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="absolute -top-2 -right-2 bg-[#601E8D] text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">COMBO</div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-black leading-tight mb-2">{item.name}</h4>
                <p className="text-sm text-[#601E8D] font-medium mb-3">🎁 {item.included_products?.length || 0} products included</p>
                {item.included_products?.length > 0 && (
                  <div className="bg-gray-50 rounded-[4px] p-3 mb-3 border border-gray-200">
                    <div className="space-y-2">
                      {item.included_products.map((included, index) => (
                        <div key={index} className="pl-4 border-l-2 border-gray-200 mb-2">
                          <div className="font-medium text-gray-800">{included.product_name}</div>
                          <div className="text-xs bg-gray-100 border border-gray-200 rounded px-2 py-0.5 text-gray-700 inline-block mt-1">
                            Code: {included.variant?.variant_code || included.product_code || 'N/A'}
                          </div>
                          {included.variant && (
                            <div className="text-xs bg-blue-50 border border-blue-200 rounded px-2 py-0.5 text-blue-700 inline-block mt-1 ml-1">
                              {getVariantDisplayText(included.variant, included.is_microfiber)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-purple-200">
              <div className="text-sm">
                <span className="font-medium text-gray-700">₹{item.price}</span> × {item.quantity}
                {item.original_price && item.original_price > item.price && (
                  <span className="text-gray-400 line-through ml-2 text-xs">₹{item.original_price}</span>
                )}
              </div>
              {renderPrice(item)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderKitItem = (item) => (
    <div key={item.id} className="group relative">
      <div className="bg-gray-50 p-6 rounded-[4px] border-2 border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-300">
        <div className="flex items-start gap-6">
          <div className="flex-shrink-0 relative">
            <div className="w-20 h-20 rounded-[4px] overflow-hidden bg-gray-100 border border-gray-200 shadow-sm">
              <Image
                src={item.main_image_url || "/placeholder.svg"}
                alt={item.name}
                width={80}
                height={80}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="absolute -top-2 -right-2 bg-black text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">KIT</div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-black leading-tight mb-2">{item.name}</h4>
                <p className="text-sm text-gray-700 font-medium mb-3">📦 {item.included_products?.length || 0} products included</p>
                {item.included_products?.length > 0 && (
                  <div className="bg-gray-50 rounded-[4px] p-3 mb-3 border border-gray-200">
                    <div className="space-y-2">
                      {item.included_products.map((included, index) => (
                        <div key={index} className="pl-4 border-l-2 border-gray-200 mb-2">
                          <div className="font-medium text-gray-800">{included.product_name}</div>
                          <div className="text-xs bg-gray-100 border border-gray-200 rounded px-2 py-0.5 text-gray-500 inline-block mt-1">
                            Code: {included.variant?.variant_code || included.product_code || 'N/A'}
                          </div>
                          {included.variant && (
                            <div className="text-xs bg-blue-50 border border-blue-200 rounded px-2 py-0.5 text-blue-700 inline-block mt-1 ml-1">
                              {getVariantDisplayText(included.variant, included.is_microfiber)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
              <div className="text-sm">
                <span className="font-medium text-gray-700">₹{item.price}</span> × {item.quantity}
                {item.original_price && item.original_price > item.price && (
                  <span className="text-gray-400 line-through ml-2 text-xs">₹{item.original_price}</span>
                )}
              </div>
              {renderPrice(item)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderItem = (item) => {
    switch (item.type) {
      case "product": return renderProductItem(item);
      case "combo": return renderComboItem(item);
      case "kit": return renderKitItem(item);
      default: return renderProductItem(item);
    }
  };

  if (!items || items.length === 0) {
    return (
      <div className="bg-white p-8 shadow-sm rounded-[4px] border border-gray-200 text-center">
        <div className="w-20 h-20 mx-auto mb-4 bg-gray-50 rounded-full flex items-center justify-center border border-gray-200">
          <span className="text-3xl">🛒</span>
        </div>
        <h2 className="text-2xl font-bold text-black mb-2">Order Summary</h2>
        <p className="text-gray-500">Your cart is empty</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-[4px] border border-gray-200 overflow-hidden">
      <div className="bg-black p-6 text-white border-b border-gray-200">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <span className="text-2xl">📋</span> Order Summary
        </h2>
        <p className="text-gray-300 mt-1">{orderTotals.itemCount} items in your cart</p>
      </div>

      <div className="p-6">
        <div className="space-y-4 mb-8">{items.map(renderItem)}</div>

        {coupon && (
          <div className="mb-6 p-4 bg-purple-50 border-2 border-[#601E8D] rounded-[4px]">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#601E8D] rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">%</span>
                </div>
                <div>
                  <p className="font-semibold text-black">{coupon.code}</p>
                  <p className="text-sm text-gray-600">{coupon.value}% discount applied</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-[#601E8D]">-₹{orderTotals.discount}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gray-50 rounded-[4px] p-6 border border-gray-200">
          <div className="space-y-4">
            <div className="flex justify-between items-center text-lg">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-semibold text-black">₹{calculatedSubtotal.toFixed(2)}</span>
            </div>

            {orderTotals.discount > 0 && (
              <div className="flex justify-between items-center text-lg text-green-600">
                <span>
                  Discount{" "}
                  {coupon && (
                    <span className="text-sm font-mono bg-green-100 p-1 rounded-sm">{coupon.code}</span>
                  )}
                </span>
                <span className="font-semibold">- ₹{orderTotals.discount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between items-center text-lg">
  <span className="text-gray-600">Delivery Charges</span>
  <span className="font-semibold text-black">
    {!selectedShippingAddressId ? (
      <span className="text-gray-500">Select address</span>
    ) : deliveryCharge === 0 ? (
      <span className="text-green-600">FREE</span>
    ) : (
      `₹${deliveryCharge.toFixed(2)}`
    )}
  </span>
</div>

          </div>
        </div>

        {/* Delivery Information Message - Only show when no address selected and cart < 499 */}
       {showDeliveryMessage && (
  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded text-sm">
    <div className="flex items-center gap-2">
      <span className="text-amber-600">ℹ️</span>
      <div className="text-amber-800">
        <span className="font-medium">Delivery: ₹59-99</span> for orders under ₹499.
        <span className="text-green-700 font-medium ml-1">Free above ₹499!</span>
      </div>
    </div>
  </div>
)}


        <div className="p-6 bg-gray-50 border-t-2 border-dashed border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold text-black">Grand Total</span>
            <span className="text-3xl font-extrabold text-[#601E8D]">
              ₹{calculatedGrandTotal.toFixed(2)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            onPlaceOrder({
              subtotal: calculatedSubtotal,
              grandTotal: calculatedGrandTotal,
              deliveryCharge,
              itemCount: items.length,
              items
            })
          }
          disabled={loading || !selectedShippingAddressId}
          className="mt-8 w-full bg-[#601E8D] hover:bg-[#4a1770] text-white py-4 px-6 rounded-[4px] font-bold text-lg shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-3">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Placing Order...</span>
            </div>
          ) : !selectedShippingAddressId ? (
            <div className="flex items-center justify-center gap-3">
              <span>📍</span>
              <span>Select Address to Continue</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3">
              <span>🚀</span>
              <span>Place Order</span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
