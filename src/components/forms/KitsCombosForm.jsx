'use client';

import React from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import Image from 'next/image';

const KitsCombosForm = ({
  itemLabel = 'Kit',
  itemData,
  selectedProducts,
  allProducts,
  previewImage,
  loading,
  uploading,
  onCancel,
  onChange,
  onImageUpload,
  onDiscountChange,
  onSubmit,
  onProductSelect,
  onVariantSelect,
  onQuantityChange,
  getImageUrl,
}) => {
  return (
    <div className='min-h-screen bg-white text-gray-900'>
      {/* Header */}
      <div className='px-6'>
        <button
          onClick={onCancel}
          className='flex items-center text-gray-600 hover:text-gray-900 mb-4 text-sm'
        >
          <ArrowLeft size={18} className='mr-2' />
          <span>Kits & Combos</span>
        </button>
      </div>

      <div className='flex'>
        {/* Left Panel - Product Selection */}
        <div className='min-w-md h-screen overflow-y-auto bg-white'>
          <div className='mx-5 pt-8'>
            <h1 className='text-2xl font-semibold mb-6'>Add {itemLabel}</h1>
            <h2 className='text-lg font-semibold'>Select Products</h2>
          </div>

          {loading ? (
            <div className='flex items-center justify-center h-64'>
              <p className='text-gray-500'>Loading products...</p>
            </div>
          ) : (
            <div className='p-4 space-y-3'>
              {allProducts.map((product) => {
                const isSelected = selectedProducts.some(
                  (p) => p.id === product.id
                );
                const selected = selectedProducts.find(
                  (p) => p.id === product.id
                );

                return (
                  <div key={product.id} className='rounded-lg p-3'>
                    <div className='flex items-start space-x-3'>
                      <div className='w-12 h-12 bg-gray-100 rounded flex items-center justify-center overflow-hidden'>
                        {product.main_image_url ? (
                          <Image
                            src={getImageUrl(product.main_image_url)}
                            alt={product.name}
                            width={48}
                            height={48}
                            className='object-cover w-full h-full rounded'
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/placeholder-image.png';
                            }}
                          />
                        ) : (
                          <div className='text-xs px-2'>No image</div>
                        )}
                      </div>

                      <div className='flex-1'>
                        <div className='flex justify-between items-start'>
                          <div>
                            <p className='text-sm font-medium truncate'>
                              {product.name}
                            </p>
                            <p className='text-xs mt-1'>
                              {isSelected
                                ? 'Select variants below'
                                : 'Tap to select'}
                            </p>
                          </div>
                          <label className='relative flex items-start'>
                            <input
                              type='checkbox'
                              checked={isSelected}
                              onChange={(e) =>
                                onProductSelect(product, e.target.checked)
                              }
                              className='peer ml-2 h-4 w-4 appearance-none border border-[#E0E0E0] rounded bg-white checked:bg-[#E0E0E0] checked:border-[#E0E0E0] cursor-pointer'
                            />
                            {/** Lucide Check icon */}
                            <Check
                              size={12}
                              className='absolute left-[0.65rem] top-1/2 -translate-y-1/2 text-black opacity-0 peer-checked:opacity-100 pointer-events-none'
                            />
                          </label>
                        </div>

                        {isSelected && (product.variants || []).length > 0 && (
                          <div className='mt-3'>
                            <div className='flex flex-wrap gap-2'>
                              {(product.variants || []).map(
                                (variant, index) => {
                                  // Compare variants by their properties since they don't have unique IDs
                                  const isVariantSelected =
                                    selected &&
                                    selected.selected_variant &&
                                    // For microfiber products, compare by GSM
                                    ((product.is_microfiber &&
                                      variant.gsm_value ===
                                        selected.selected_variant.gsm_value) ||
                                      // For other products, compare by size (quantity and unit)
                                      (!product.is_microfiber &&
                                        variant.quantity ===
                                          selected.selected_variant.quantity &&
                                        variant.unit ===
                                          selected.selected_variant.unit));

                                  // Generate a unique key using product ID and index
                                  const uniqueKey = `${product.id}-variant-${index}`;
                                  return (
                                    <button
                                      key={uniqueKey}
                                      type='button'
                                      onClick={() =>
                                        onVariantSelect(product.id, variant)
                                      }
                                      className={`text-sm px-4 py-1.5 rounded-full transition shadow-sm ${
                                        isVariantSelected
                                          ? 'bg-[#601E8D] text-white shadow-md'
                                          : 'bg-gray-200 text-black hover:bg-gray-300'
                                      }`}
                                    >
                                      {product.is_microfiber
                                        ? `${variant.gsm_value || '300'}GSM`
                                        : `${variant.quantity || ''} ${
                                            variant.unit || 'ml'
                                          }`}
                                    </button>
                                  );
                                }
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Panel - Kit Details */}
        <div className='flex-1 px-5 pt-8 pb-16'>
          <div className='min-w-lg mx-auto'>
            <h2 className='text-lg font-semibold mb-6'>{itemLabel} Details</h2>
            <div className='space-y-6 max-w-md'>
              {/* Name */}
              <div>
                <label className='block text-base font-medium text-gray-900 mb-2'>
                  {itemLabel} Name
                </label>
                <input
                  type='text'
                  placeholder={`Enter ${itemLabel.toLowerCase()} name`}
                  className='w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black'
                  value={itemData.name}
                  onChange={(e) =>
                    onChange({ ...itemData, name: e.target.value })
                  }
                />
              </div>

              {/* Description */}
              <div>
                <label className='block text-base font-medium text-gray-900 mb-2'>
                  {itemLabel} Description
                </label>
                <textarea
                  placeholder='Enter description'
                  rows={4}
                  className='w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none'
                  value={itemData.description}
                  onChange={(e) =>
                    onChange({ ...itemData, description: e.target.value })
                  }
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className='block text-base font-medium text-gray-900 mb-2'>
                  Media
                </label>
                <div
                  className='border border-gray-300 rounded-lg px-4 py-6 text-center bg-white'
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files.length > 0) {
                      onImageUpload({
                        target: { files: e.dataTransfer.files },
                      });
                    }
                  }}
                  onDragOver={(e) => e.preventDefault()}
                >
                  {previewImage ? (
                    <div className='space-y-3'>
                      <div className="relative w-full h-32">
                        <Image
                          src={previewImage}
                          alt="Preview"
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                      <label className='inline-block bg-gray-200 font-bold text-black text-sm px-5 py-2 rounded cursor-pointer hover:bg-[#601E8D] hover:text-white'>
                        Browse
                        <input
                          type='file'
                          accept='image/*'
                          className='hidden'
                          onChange={onImageUpload}
                          disabled={uploading}
                        />
                      </label>
                    </div>
                  ) : (
                    <div className='py-5 space-y-3 text-black'>
                      <p className=' font-bold text-sm'>
                        Upload Product Images
                      </p>
                      <p className='text-xs'>
                        Drag and drop images here, or browse
                      </p>
                      <label className='inline-block bg-gray-200 text-black text-sm px-5 py-2 rounded cursor-pointer hover:bg-[#601E8D] hover:text-white'>
                        Browse
                        <input
                          type='file'
                          accept='image/*'
                          className='hidden'
                          onChange={onImageUpload}
                          disabled={uploading}
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Discount */}
              <div>
                <label className='block text-base font-medium text-gray-900 mb-2'>
                  Discount Percentage
                </label>
                <input
                  type='number'
                  placeholder='Enter discount percentage'
                  className='w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none'
                  value={itemData.discount_percentage}
                  onChange={onDiscountChange}
                />
              </div>

              {/* Pricing Summary */}
              <div className='p-4 space-y-2'>
                <div className='flex justify-between text-sm'>
                  <span className='font-medium'>Original Price:</span>
                  <span>₹{itemData.original_price.toFixed(2)}</span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span className='font-medium'>Discounted Price:</span>
                  <span className='font-semibold text-green-600'>
                    ₹{itemData.discounted_price.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Save Button */}
              <div className='pt-4 flex justify-end'>
                <button
                  type='button'
                  onClick={onSubmit}
                  disabled={loading || uploading}
                  className='bg-black text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-[#601E8D] disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {loading || uploading
                    ? 'Saving Image...'
                    : `Save ${itemLabel}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KitsCombosForm;
