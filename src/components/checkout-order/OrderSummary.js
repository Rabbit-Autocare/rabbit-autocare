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
    <div key={item.id} className="border-b py-4">
      <div className="flex items-start space-x-4">
        {/* Product Image */}
        <div className="flex-shrink-0">
          <Image
            src={item.main_image_url || "/placeholder.svg"}
            alt={item.name}
            width={60}
            height={60}
            className="rounded-md object-cover"
          />
        </div>

        {/* Product Details */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {item.name}
              </h4>
              <p className="text-xs text-gray-500 mt-1">
                Product Code: {item.product_code || 'N/A'}
              </p>
              {item.variant_display_text && item.variant_display_text !== 'Default' && (
                <p className="text-xs text-gray-600 mt-1">
                  Variant: {item.variant_display_text}
                </p>
              )}
              {item.variant && (
                <div className="text-xs text-gray-500 mt-1">
                  {item.variant.id && <span>Variant ID: {item.variant.id}</span>}
                </div>
              )}
            </div>

            {/* Quantity Control */}
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 1)}
                className="w-16 border rounded px-2 py-1 text-sm text-center"
              />
            </div>
          </div>

          {/* Price Information */}
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-gray-600">
              ₹{item.price} × {item.quantity}
            </span>
            <span className="font-semibold text-gray-900">
              ₹{item.total_price}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderComboItem = (item) => (
    <div key={item.id} className="border-b py-4">
      <div className="flex items-start space-x-4">
        {/* Combo Image */}
        <div className="flex-shrink-0">
          <Image
            src={item.main_image_url || "/placeholder.svg"}
            alt={item.name}
            width={60}
            height={60}
            className="rounded-md object-cover"
          />
        </div>

        {/* Combo Details */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {item.name} (Combo)
              </h4>
              <p className="text-xs text-gray-500 mt-1">
                {item.included_products?.length || 0} products included
              </p>

              {/* Included Products */}
              {item.included_products && item.included_products.length > 0 && (
                <div className="mt-2 space-y-1">
                  {item.included_products.map((included, index) => (
                    <div key={index} className="text-xs text-gray-600 flex justify-between">
                      <span>• {included.product_name}</span>
                      <span className="text-gray-500">
                        {included.product_code && `(${included.product_code})`}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Variant Details */}
              {item.included_variants && item.included_variants.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-gray-700">Selected Variants:</p>
                  {item.included_variants.map((variant, index) => (
                    <div key={index} className="text-xs text-gray-600 ml-2">
                      {variant.product_name}: {variant.variant_details?.color || ''} {variant.variant_details?.size || ''}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quantity Control */}
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 1)}
                className="w-16 border rounded px-2 py-1 text-sm text-center"
              />
            </div>
          </div>

          {/* Price Information */}
          <div className="flex justify-between items-center mt-2">
            <div className="text-sm">
              <span className="text-gray-600">₹{item.price} × {item.quantity}</span>
              {item.original_price && item.original_price > item.price && (
                <span className="text-gray-400 line-through ml-2">
                  ₹{item.original_price}
                </span>
              )}
            </div>
            <span className="font-semibold text-gray-900">
              ₹{item.total_price}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderKitItem = (item) => (
    <div key={item.id} className="border-b py-4">
      <div className="flex items-start space-x-4">
        {/* Kit Image */}
        <div className="flex-shrink-0">
          <Image
            src={item.main_image_url || "/placeholder.svg"}
            alt={item.name}
            width={60}
            height={60}
            className="rounded-md object-cover"
          />
        </div>

        {/* Kit Details */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {item.name} (Kit)
              </h4>
              <p className="text-xs text-gray-500 mt-1">
                {item.included_products?.length || 0} products included
              </p>

              {/* Included Products */}
              {item.included_products && item.included_products.length > 0 && (
                <div className="mt-2 space-y-1">
                  {item.included_products.map((included, index) => (
                    <div key={index} className="text-xs text-gray-600 flex justify-between">
                      <span>• {included.product_name}</span>
                      <span className="text-gray-500">
                        {included.product_code && `(${included.product_code})`}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Variant Details */}
              {item.included_variants && item.included_variants.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-gray-700">Selected Variants:</p>
                  {item.included_variants.map((variant, index) => (
                    <div key={index} className="text-xs text-gray-600 ml-2">
                      {variant.product_name}: {variant.variant_details?.color || ''} {variant.variant_details?.size || ''}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quantity Control */}
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 1)}
                className="w-16 border rounded px-2 py-1 text-sm text-center"
              />
            </div>
          </div>

          {/* Price Information */}
          <div className="flex justify-between items-center mt-2">
            <div className="text-sm">
              <span className="text-gray-600">₹{item.price} × {item.quantity}</span>
              {item.original_price && item.original_price > item.price && (
                <span className="text-gray-400 line-through ml-2">
                  ₹{item.original_price}
                </span>
              )}
            </div>
            <span className="font-semibold text-gray-900">
              ₹{item.total_price}
            </span>
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
      <div className="bg-white p-6 shadow rounded">
        <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
        <p className="text-gray-500 text-center py-8">No items in cart</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 shadow rounded">
      <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

      {/* Items List */}
      <div className="space-y-0 mb-6">
        {items.map(renderItem)}
      </div>

      {/* Coupon Information */}
      {coupon && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-green-800">
                Coupon Applied: {coupon.code}
              </p>
              <p className="text-xs text-green-600">
                {coupon.value}% discount
              </p>
            </div>
            <span className="text-sm font-medium text-green-800">
              -₹{orderTotals.discount}
            </span>
          </div>
        </div>
      )}

      {/* Price Breakdown */}
      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal ({orderTotals.itemCount} items)</span>
          <span className="font-medium">₹{orderTotals.subtotal}</span>
        </div>

        {coupon && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Discount ({coupon.code})</span>
            <span>-₹{orderTotals.discount}</span>
          </div>
        )}

        <div className="flex justify-between text-lg font-bold border-t pt-2">
          <span>Total</span>
          <span>₹{orderTotals.grandTotal}</span>
        </div>

        {coupon && (
          <p className="text-xs text-green-600 text-center mt-2">
            You saved ₹{orderTotals.discount} on this order
          </p>
        )}
      </div>

      {/* Place Order Button */}
      <button
        onClick={onPlaceOrder}
        disabled={loading}
        className="mt-6 w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
      >
        {loading ? 'Placing Order...' : 'Place Order'}
      </button>
    </div>
  );
}
