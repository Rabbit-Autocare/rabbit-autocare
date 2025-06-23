"use client";
import React from 'react';
import Image from 'next/image';
import { formatPrice } from '@/lib/utils/cartTransformUtils';

export default function OrderSummary({
  items,
  updateItemQuantity,
  coupon,
  orderTotals,
  loading,
  onPlaceOrder,
}) {
  const renderProductItem = (item) => (
    <div key={item.id} className="group relative">
      <div className="bg-gradient-to-r from-slate-50 to-white p-6 rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all duration-300">
        <div className="flex items-start gap-6">
          {/* Product Image */}
          <div className="flex-shrink-0 relative">
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 ring-2 ring-white shadow-md">
              <Image
                src={item.main_image_url || "/placeholder.svg"}
                alt={item.name}
                width={80}
                height={80}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>

          {/* Product Details */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-gray-900 leading-tight mb-2">
                  {item.name}
                </h4>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500 font-medium">
                    Code: <span className="text-gray-700">{item.product_code || 'N/A'}</span>
                  </p>
                  {item.variant_display_text && item.variant_display_text !== 'Default' && (
                    <p className="text-sm text-indigo-600 font-medium">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-indigo-50 text-indigo-700">
                        {item.variant_display_text}
                      </span>
                    </p>
                  )}
                  {item.variant && item.variant.id && (
                    <p className="text-xs text-gray-400">
                      Variant ID: {item.variant.id}
                    </p>
                  )}
                </div>
              </div>

              {/* Quantity Control */}
              <div className="flex items-center bg-white rounded-xl border-2 border-gray-200 shadow-sm">
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 1)}
                  className="w-16 text-center font-semibold text-gray-900 bg-transparent border-none outline-none py-2"
                />
              </div>
            </div>

            {/* Price Information */}
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
              <div className="text-sm text-gray-600">
                <span className="font-medium">₹{item.price}</span> × {item.quantity}
              </div>
              <div className="text-xl font-bold text-gray-900">
                ₹{item.total_price}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderComboItem = (item) => (
    <div key={item.id} className="group relative">
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-2xl border-2 border-amber-200 hover:border-amber-300 hover:shadow-lg transition-all duration-300">
        <div className="flex items-start gap-6">
          {/* Combo Image */}
          <div className="flex-shrink-0 relative">
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-gradient-to-br from-amber-100 to-orange-200 ring-2 ring-white shadow-md">
              <Image
                src={item.main_image_url || "/placeholder.svg"}
                alt={item.name}
                width={80}
                height={80}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
              COMBO
            </div>
          </div>

          {/* Combo Details */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-gray-900 leading-tight mb-2">
                  {item.name}
                </h4>
                <p className="text-sm text-amber-700 font-medium mb-3">
                  🎁 {item.included_products?.length || 0} products included
                </p>

                {/* Included Products */}
                {item.included_products && item.included_products.length > 0 && (
                  <div className="bg-white/60 rounded-lg p-3 mb-3">
                    <div className="space-y-2">
                      {item.included_products.map((included, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span className="text-gray-700 font-medium">• {included.product_name}</span>
                          {included.product_code && (
                            <span className="text-gray-500 text-xs bg-gray-100 px-2 py-1 rounded">
                              {included.product_code}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Variant Details */}
                {item.included_variants && item.included_variants.length > 0 && (
                  <div className="bg-white/60 rounded-lg p-3">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Selected Variants:</p>
                    <div className="space-y-1">
                      {item.included_variants.map((variant, index) => (
                        <div key={index} className="text-sm text-gray-600">
                          <span className="font-medium">{variant.product_name}:</span> 
                          <span className="ml-1">{variant.variant_details?.color || ''} {variant.variant_details?.size || ''}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Quantity Control */}
              <div className="flex items-center bg-white rounded-xl border-2 border-amber-300 shadow-sm">
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 1)}
                  className="w-16 text-center font-semibold text-gray-900 bg-transparent border-none outline-none py-2"
                />
              </div>
            </div>

            {/* Price Information */}
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-amber-200">
              <div className="text-sm">
                <span className="font-medium text-gray-700">₹{item.price}</span> × {item.quantity}
                {item.original_price && item.original_price > item.price && (
                  <span className="text-gray-400 line-through ml-2 text-xs">
                    ₹{item.original_price}
                  </span>
                )}
              </div>
              <div className="text-xl font-bold text-gray-900">
                ₹{item.total_price}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderKitItem = (item) => (
    <div key={item.id} className="group relative">
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-2xl border-2 border-emerald-200 hover:border-emerald-300 hover:shadow-lg transition-all duration-300">
        <div className="flex items-start gap-6">
          {/* Kit Image */}
          <div className="flex-shrink-0 relative">
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-gradient-to-br from-emerald-100 to-teal-200 ring-2 ring-white shadow-md">
              <Image
                src={item.main_image_url || "/placeholder.svg"}
                alt={item.name}
                width={80}
                height={80}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
              KIT
            </div>
          </div>

          {/* Kit Details */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-gray-900 leading-tight mb-2">
                  {item.name}
                </h4>
                <p className="text-sm text-emerald-700 font-medium mb-3">
                  📦 {item.included_products?.length || 0} products included
                </p>

                {/* Included Products */}
                {item.included_products && item.included_products.length > 0 && (
                  <div className="bg-white/60 rounded-lg p-3 mb-3">
                    <div className="space-y-2">
                      {item.included_products.map((included, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span className="text-gray-700 font-medium">• {included.product_name}</span>
                          {included.product_code && (
                            <span className="text-gray-500 text-xs bg-gray-100 px-2 py-1 rounded">
                              {included.product_code}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Variant Details */}
                {item.included_variants && item.included_variants.length > 0 && (
                  <div className="bg-white/60 rounded-lg p-3">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Selected Variants:</p>
                    <div className="space-y-1">
                      {item.included_variants.map((variant, index) => (
                        <div key={index} className="text-sm text-gray-600">
                          <span className="font-medium">{variant.product_name}:</span> 
                          <span className="ml-1">{variant.variant_details?.color || ''} {variant.variant_details?.size || ''}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Quantity Control */}
              <div className="flex items-center bg-white rounded-xl border-2 border-emerald-300 shadow-sm">
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 1)}
                  className="w-16 text-center font-semibold text-gray-900 bg-transparent border-none outline-none py-2"
                />
              </div>
            </div>

            {/* Price Information */}
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-emerald-200">
              <div className="text-sm">
                <span className="font-medium text-gray-700">₹{item.price}</span> × {item.quantity}
                {item.original_price && item.original_price > item.price && (
                  <span className="text-gray-400 line-through ml-2 text-xs">
                    ₹{item.original_price}
                  </span>
                )}
              </div>
              <div className="text-xl font-bold text-gray-900">
                ₹{item.total_price}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderItem = (item) => {
    switch (item.type) {
      case 'product':
        return renderProductItem(item);
      case 'combo':
        return renderComboItem(item);
      case 'kit':
        return renderKitItem(item);
      default:
        return renderProductItem(item);
    }
  };

  if (!items || items.length === 0) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-white p-8 shadow-2xl rounded-3xl border border-gray-200">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
            <span className="text-3xl">🛒</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Summary</h2>
          <p className="text-gray-500">Your cart is empty</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 shadow-2xl rounded-3xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <span className="text-2xl">📋</span>
          Order Summary
        </h2>
        <p className="text-indigo-100 mt-1">{orderTotals.itemCount} items in your cart</p>
      </div>

      <div className="p-6">
        {/* Items List */}
        <div className="space-y-4 mb-8">
          {items.map(renderItem)}
        </div>

        {/* Coupon Information */}
        {coupon && (
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">%</span>
                </div>
                <div>
                  <p className="font-semibold text-green-800">
                    {coupon.code}
                  </p>
                  <p className="text-sm text-green-600">
                    {coupon.value}% discount applied
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-800">
                  -₹{orderTotals.discount}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Price Breakdown */}
        <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-2xl p-6 border border-gray-200">
          <div className="space-y-4">
            <div className="flex justify-between items-center text-lg">
              <span className="text-gray-700 font-medium">
                Subtotal ({orderTotals.itemCount} items)
              </span>
              <span className="font-semibold text-gray-900">₹{orderTotals.subtotal}</span>
            </div>

            {coupon && (
              <div className="flex justify-between items-center text-lg text-green-600">
                <span className="font-medium">Discount ({coupon.code})</span>
                <span className="font-semibold">-₹{orderTotals.discount}</span>
              </div>
            )}

            <div className="border-t-2 border-gray-200 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-gray-900">Total</span>
                <span className="text-3xl font-bold text-indigo-600">₹{orderTotals.grandTotal}</span>
              </div>
            </div>

            {coupon && (
              <div className="bg-green-100 rounded-lg p-3 text-center">
                <p className="text-sm font-medium text-green-700">
                  🎉 You saved ₹{orderTotals.discount} on this order!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Place Order Button */}
        <button
          onClick={onPlaceOrder}
          disabled={loading}
          className="mt-8 w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-4 px-6 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-3">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Placing Order...</span>
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