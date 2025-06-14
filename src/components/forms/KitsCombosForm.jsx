'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, AlertCircle, Package, X } from 'lucide-react';
import { KitService } from '@/lib/service/kitService';
import { ComboService } from '@/lib/service/comboService';
import { StockService } from '@/lib/service/stockService';

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
  onRemoveProductInstance,
}) => {
  const [errors, setErrors] = useState({});
  const [stockErrors, setStockErrors] = useState({});
  const [variantStocks, setVariantStocks] = useState({});

  // Get color style for microfiber products
  const getColorStyle = (colorName) => {
    const colorMap = {
      red: "#ef4444",
      blue: "#3b82f6",
      green: "#22c55e",
      yellow: "#eab308",
      purple: "#a855f7",
      pink: "#ec4899",
      orange: "#f97316",
      gray: "#6b7280",
      grey: "#6b7280",
      black: "#000000",
      white: "#ffffff",
      brown: "#a78bfa",
      navy: "#1e40af",
      teal: "#14b8a6",
      lime: "#84cc16",
      cyan: "#06b6d4",
      indigo: "#6366f1",
      emerald: "#10b981",
      rose: "#f43f5e",
      amber: "#f59e0b",
      violet: "#8b5cf6",
      sky: "#0ea5e9",
      slate: "#64748b",
    };

    return { backgroundColor: colorMap[colorName?.toLowerCase()] || "#6b7280" };
  };

  // Get unique colors and sizes for a product
  const getUniqueColorsAndSizes = (product) => {
    if (!product.variants) return { colors: [], sizes: [] };

    const colors = [...new Set(product.variants.map((v) => v.color).filter(Boolean))];
    const sizes = [...new Set(product.variants.map((v) => v.size).filter(Boolean))];

    return { colors, sizes };
  };

  // Check if a color has any variants in stock
  const isColorAvailable = (product, color) => {
    return product.variants?.some((v) => v.color === color && v.stock > 0) || false;
  };

  // Check if a size has any variants in stock
  const isSizeAvailable = (product, size) => {
    return product.variants?.some((v) => v.size === size && v.stock > 0) || false;
  };

  // Get variant for color-size combination
  const getVariantForCombination = (product, color, size) => {
    return product.variants?.find((v) => v.color === color && v.size === size) || null;
  };

  // Fetch stock information for variants when selectedProducts change
  useEffect(() => {
    const fetchVariantStocks = async () => {
      const stocks = {};
      const variantIdsToFetch = selectedProducts
        .filter(p => p.selected_variant)
        .map(p => p.selected_variant.id);

      if (variantIdsToFetch.length > 0) {
        try {
          const fetchedStocks = await StockService.getMultipleVariantsStock(variantIdsToFetch);
          // Correctly iterate over the object returned by getMultipleVariantsStock
          Object.keys(fetchedStocks).forEach(variantId => {
            stocks[variantId] = fetchedStocks[variantId];
          });
        } catch (error) {
          console.error('Error fetching multiple variant stocks:', error);
        }
      }
      setVariantStocks(stocks);
    };

    fetchVariantStocks();
  }, [selectedProducts]);

  // Validate form data
  const validateForm = () => {
    const newErrors = {};

    if (!itemData.name) {
      newErrors.name = `${itemLabel} name is required`;
    }

    if (!itemData.description) {
      newErrors.description = 'Description is required';
    }

    if (!itemData.image_url && !previewImage) {
      newErrors.image = 'Image is required';
    }

    if (selectedProducts.length === 0) {
      newErrors.products = 'Please select at least one product';
    }

    // Check if all selected products have variants selected
    const missingVariants = selectedProducts.filter(
      p => p.variants?.length > 0 && !p.selected_variant
    );
    if (missingVariants.length > 0) {
      newErrors.variants = 'Please select variants for all products';
    }

    // Check for duplicate products in kits (not in combos)
    if (itemLabel === 'Kit') {
      const productIds = selectedProducts.map(p => p.id);
      if (new Set(productIds).size !== productIds.length) {
        newErrors.products = 'Kit cannot contain duplicate products';
      }
    }

    // Check stock availability for all selected variants
    const insufficientStock = selectedProducts.some(p => {
      if (!p.selected_variant) return false;
      const stock = variantStocks[p.selected_variant.id];
      return !stock || stock <= 0;
    });

    if (insufficientStock) {
      newErrors.stock = 'One or more selected variants are out of stock';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check stock availability
  const checkStockAvailability = async () => {
    const newStockErrors = {};
    const variants = selectedProducts.map(p => ({
      variantId: p.selected_variant.id,
      quantity: p.quantity || 1
    }));

    try {
      const hasEnoughStock = await StockService.checkMultipleVariantsStock(variants);
      if (!hasEnoughStock) {
        newStockErrors.stock = 'Insufficient stock for one or more variants';
      }
    } catch (error) {
      newStockErrors.stock = 'Error checking stock availability';
    }

    setStockErrors(newStockErrors);
    return Object.keys(newStockErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!(await checkStockAvailability())) {
      return;
    }

    // Call the parent's onSubmit with the form data
    onSubmit(itemData);
  };

  // Add quantity selection UI for each product
  const renderQuantitySelector = (product) => {
    const currentStock = variantStocks[product.selected_variant?.id] || 0;
    const isMaxQuantityReached = product.quantity >= currentStock;
    return (
      <div className="mt-2 flex items-center space-x-2">
        <label className="text-sm text-gray-600">Quantity:</label>
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => onQuantityChange(product.id, Math.max(1, (product.quantity || 1) - 1))}
            className="w-6 h-6 flex items-center justify-center border rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={product.quantity <= 1}
          >
            -
          </button>
          <span className="w-8 text-center">{product.quantity || 1}</span>
          <button
            type="button"
            onClick={() => onQuantityChange(product.id, (product.quantity || 1) + 1)}
            className="w-6 h-6 flex items-center justify-center border rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isMaxQuantityReached}
          >
            +
          </button>
        </div>
      </div>
    );
  };

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

      <form onSubmit={handleSubmit}>
        <div className='flex'>
          {/* Left Panel - Product Selection */}
          <div className='min-w-md h-screen overflow-y-auto bg-white'>
            <div className='mx-5 pt-8'>
              <h1 className='text-2xl font-semibold mb-6'>Add {itemLabel}</h1>
              <h2 className='text-lg font-semibold'>Select Products</h2>
              {errors.products && (
                <p className='text-red-500 text-sm mt-1 flex items-center'>
                  <AlertCircle size={16} className='mr-1' />
                  {errors.products}
                </p>
              )}
              {errors.variants && (
                <p className='text-red-500 text-sm mt-1 flex items-center'>
                  <AlertCircle size={16} className='mr-1' />
                  {errors.variants}
                </p>
              )}
              {stockErrors.stock && (
                <p className='text-red-500 text-sm mt-1 flex items-center'>
                  <AlertCircle size={16} className='mr-1' />
                  {stockErrors.stock}
                </p>
              )}
            </div>

            {loading ? (
              <div className='flex items-center justify-center h-64'>
                <p className='text-gray-500'>Loading products...</p>
              </div>
            ) : (
              <div className='divide-y divide-gray-200'>
                {allProducts.map((product) => {
                  // Determine if this product is currently selected
                  const isSelected = selectedProducts.some((p) => p.id === product.id);
                  const selectedInstances = selectedProducts.filter(p => p.id === product.id);

                  return (
                    <div
                      key={product.id}
                      className={`flex items-start p-5 transition-colors ${isSelected ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
                    >
                      <img
                        src={getImageUrl(product.main_image_url)}
                        alt={product.name}
                        className='w-20 h-20 object-cover rounded-lg mr-4'
                      />
                      <div className='flex-1'>
                        <div className='flex justify-between items-start'>
                          <div>
                            <p className='text-sm font-medium truncate'>
                              {product.name}
                            </p>
                            <p className='text-xs text-gray-500 mt-1'>
                              {isSelected
                                ? selectedInstances.length > 0 && selectedInstances[0].selected_variant
                                  ? `Selected: ${selectedInstances[0].selected_variant.color || ''} ${selectedInstances[0].selected_variant.size || ''} ${selectedInstances[0].selected_variant.quantity || ''} ${selectedInstances[0].selected_variant.unit || ''}`
                                  : 'Select variants below'
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
                              className='peer ml-2 h-4 w-4 appearance-none border border-[#E0E0E0] rounded bg-white checked:bg-[#601E8D] checked:border-[#601E8D] cursor-pointer'
                            />
                            <Check
                              size={12}
                              className='absolute left-[0.65rem] top-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none'
                            />
                          </label>
                        </div>

                        {isSelected && (
                          <div className='mt-4 space-y-4'>
                            {/* Show selected instances */}
                            {selectedInstances.map((selected, instanceIndex) => {
                              const { colors, sizes } = getUniqueColorsAndSizes(product);
                              const hasColorOptions = colors.length > 0;
                              const hasSizeOptions = sizes.length > 0;
                              const hasGsmOptions = product.variants?.some(v => v.gsm) || false; // Check for GSM
                              const hasQuantityOptions = product.variants?.some(v => v.quantity) || false; // Check for Quantity

                              // Determine active variant based on selected instance's selected_variant
                              const activeVariant = selected.selected_variant;

                              const handleColorSelect = (color) => {
                                const newVariant = product.variants.find(
                                  v => v.color === color && (hasSizeOptions ? v.size === activeVariant?.size : true) &&
                                       (hasGsmOptions ? v.gsm === activeVariant?.gsm : true) &&
                                       (hasQuantityOptions ? v.quantity === activeVariant?.quantity : true)
                                );
                                onVariantSelect(product.id, newVariant, instanceIndex);
                              };

                              const handleSizeSelect = (size) => {
                                const newVariant = product.variants.find(
                                  v => v.size === size && (hasColorOptions ? v.color === activeVariant?.color : true) &&
                                       (hasGsmOptions ? v.gsm === activeVariant?.gsm : true) &&
                                       (hasQuantityOptions ? v.quantity === activeVariant?.quantity : true)
                                );
                                onVariantSelect(product.id, newVariant, instanceIndex);
                              };

                              const handleGsmSelect = (gsm) => {
                                const newVariant = product.variants.find(
                                  v => v.gsm === gsm && (hasColorOptions ? v.color === activeVariant?.color : true) &&
                                       (hasSizeOptions ? v.size === activeVariant?.size : true) &&
                                       (hasQuantityOptions ? v.quantity === activeVariant?.quantity : true)
                                );
                                onVariantSelect(product.id, newVariant, instanceIndex);
                              };

                              const handleQuantitySelect = (quantity) => {
                                const newVariant = product.variants.find(
                                  v => v.quantity === quantity && (hasColorOptions ? v.color === activeVariant?.color : true) &&
                                       (hasSizeOptions ? v.size === activeVariant?.size : true) &&
                                       (hasGsmOptions ? v.gsm === activeVariant?.gsm : true)
                                );
                                onVariantSelect(product.id, newVariant, instanceIndex);
                              };


                              return (
                                <div key={`${product.id}-instance-${instanceIndex}`} className="border-t pt-4">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium">Instance {instanceIndex + 1}</span>
                                    {selectedInstances.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          // This needs to remove *this specific instance*
                                          onRemoveProductInstance(product.id, instanceIndex);
                                        }}
                                        className="text-red-500 hover:text-red-700"
                                      >
                                        <X size={16} />
                                      </button>
                                    )}
                                  </div>

                                  {product.variants?.length > 0 ? (
                                    <div className="space-y-4">
                                      {/* Color Selection for Microfiber Products */}
                                      {hasColorOptions && (
                                        <div className='space-y-2'>
                                          <h4 className='font-medium text-sm'>Choose Color:</h4>
                                          <div className='flex flex-wrap gap-2'>
                                            {colors.map((color) => {
                                              const isSelectedColor = activeVariant?.color === color;
                                              const hasStock = product.variants.some(v =>
                                                v.color === color &&
                                                (hasSizeOptions ? v.size === activeVariant?.size : true) &&
                                                (hasGsmOptions ? v.gsm === activeVariant?.gsm : true) &&
                                                (hasQuantityOptions ? v.quantity === activeVariant?.quantity : true) &&
                                                variantStocks[v.id] > 0
                                              );
                                              const variantIdForColor = product.variants.find(v => v.color === color)?.id;

                                              return (
                                                <div key={color} className='relative group'>
                                                  <button
                                                    type="button"
                                                    onClick={() => hasStock && handleColorSelect(color)}
                                                    disabled={!hasStock}
                                                    className={`
                                                      w-8 h-8 rounded-full border-2 transition-all duration-200 relative
                                                      ${
                                                        isSelectedColor
                                                          ? 'border-black ring-2 ring-black ring-offset-2'
                                                          : hasStock
                                                            ? 'border-gray-300 hover:border-gray-400'
                                                            : 'border-gray-200 cursor-not-allowed opacity-50'
                                                      }
                                                    `}
                                                    style={getColorStyle(color)}
                                                    title={color}
                                                  >
                                                    {color?.toLowerCase() === 'white' && (
                                                      <div className='absolute inset-0 rounded-full border border-gray-300'></div>
                                                    )}
                                                    {!hasStock && (
                                                      <div className='absolute inset-0 flex items-center justify-center'>
                                                        <X className='w-3 h-3 text-gray-600' />
                                                      </div>
                                                    )}
                                                  </button>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      )}

                                      {/* Size Selection */}
                                      {hasSizeOptions && (
                                        <div className='space-y-2'>
                                          <h4 className='font-medium text-sm'>Choose Size:</h4>
                                          <div className='flex flex-wrap gap-2'>
                                            {sizes.map((size) => {
                                              const isSelectedSize = activeVariant?.size === size;
                                              const hasStock = product.variants.some(v =>
                                                v.size === size &&
                                                (hasColorOptions ? v.color === activeVariant?.color : true) &&
                                                (hasGsmOptions ? v.gsm === activeVariant?.gsm : true) &&
                                                (hasQuantityOptions ? v.quantity === activeVariant?.quantity : true) &&
                                                variantStocks[v.id] > 0
                                              );
                                              const variantIdForSize = product.variants.find(v => v.size === size)?.id;

                                              return (
                                                <div key={size} className='relative group'>
                                                  <button
                                                    type="button"
                                                    onClick={() => hasStock && handleSizeSelect(size)}
                                                    disabled={!hasStock}
                                                    className={`
                                                      px-4 py-2 text-sm font-medium transition-all duration-200 rounded-full
                                                      ${
                                                        isSelectedSize
                                                          ? 'bg-black text-white border-2 border-black'
                                                          : hasStock
                                                            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
                                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                                      }
                                                    `}
                                                  >
                                                    {size}
                                                  </button>
                                                  {!hasStock && (
                                                    <div className='absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none'>
                                                      <div className='bg-red-500 text-white rounded-full p-1'>
                                                        <X className='w-3 h-3' />
                                                      </div>
                                                    </div>
                                                  )}
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      )}

                                      {/* GSM Selection (for microfiber) */}
                                      {hasGsmOptions && product.is_microfiber && (
                                        <div className='space-y-2'>
                                          <h4 className='font-medium text-sm'>Choose GSM:</h4>
                                          <div className='flex flex-wrap gap-2'>
                                            {[...new Set(product.variants.map(v => v.gsm).filter(Boolean))].map(gsm => {
                                              const isSelectedGsm = activeVariant?.gsm === gsm;
                                              const hasStock = product.variants.some(v =>
                                                v.gsm === gsm &&
                                                (hasColorOptions ? v.color === activeVariant?.color : true) &&
                                                (hasSizeOptions ? v.size === activeVariant?.size : true) &&
                                                (hasQuantityOptions ? v.quantity === activeVariant?.quantity : true) &&
                                                variantStocks[v.id] > 0
                                              );
                                              return (
                                                <div key={gsm} className='relative group'>
                                                  <button
                                                    type="button"
                                                    onClick={() => hasStock && handleGsmSelect(gsm)}
                                                    disabled={!hasStock}
                                                    className={`
                                                      px-4 py-2 text-sm font-medium transition-all duration-200 rounded-full
                                                      ${
                                                        isSelectedGsm
                                                          ? 'bg-black text-white border-2 border-black'
                                                          : hasStock
                                                            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
                                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                                      }
                                                    `}
                                                  >
                                                    {gsm}
                                                  </button>
                                                  {!hasStock && (
                                                    <div className='absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none'>
                                                      <div className='bg-red-500 text-white rounded-full p-1'>
                                                        <X className='w-3 h-3' />
                                                      </div>
                                                    </div>
                                                  )}
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      )}

                                      {/* Quantity Selection (for non-microfiber) */}
                                      {hasQuantityOptions && !product.is_microfiber && (
                                        <div className='space-y-2'>
                                          <h4 className='font-medium text-sm'>Choose Quantity:</h4>
                                          <div className='flex flex-wrap gap-2'>
                                            {[...new Set(product.variants.map(v => v.quantity).filter(Boolean))].map(quantity => {
                                              const isSelectedQuantity = activeVariant?.quantity === quantity;
                                              const hasStock = product.variants.some(v =>
                                                v.quantity === quantity &&
                                                (hasColorOptions ? v.color === activeVariant?.color : true) &&
                                                (hasSizeOptions ? v.size === activeVariant?.size : true) &&
                                                (hasGsmOptions ? v.gsm === activeVariant?.gsm : true) &&
                                                variantStocks[v.id] > 0
                                              );
                                              return (
                                                <div key={quantity} className='relative group'>
                                                  <button
                                                    type="button"
                                                    onClick={() => hasStock && handleQuantitySelect(quantity)}
                                                    disabled={!hasStock}
                                                    className={`
                                                      px-4 py-2 text-sm font-medium transition-all duration-200 rounded-full
                                                      ${
                                                        isSelectedQuantity
                                                          ? 'bg-black text-white border-2 border-black'
                                                          : hasStock
                                                            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
                                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                                      }
                                                    `}
                                                  >
                                                    {quantity} {product.variants.find(v => v.quantity === quantity)?.unit || ''}
                                                  </button>
                                                  {!hasStock && (
                                                    <div className='absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none'>
                                                      <div className='bg-red-500 text-white rounded-full p-1'>
                                                        <X className='w-3 h-3' />
                                                      </div>
                                                    </div>
                                                  )}
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      )}

                                      {activeVariant && renderQuantitySelector(selected)}

                                      {/* Stock Information for selected variant */}
                                      {activeVariant && (
                                        <div className='text-xs mt-2'>
                                          Stock: {' '
                                          }{variantStocks[activeVariant.id] !== undefined ? (
                                            variantStocks[activeVariant.id] > 0 ? (
                                              <span className='text-green-600 font-medium'>
                                                {variantStocks[activeVariant.id]} in stock
                                              </span>
                                            ) : (
                                              <span className='text-red-600 font-medium'>Out of stock</span>
                                            )
                                          ) : (
                                            <span className='text-gray-500'>N/A</span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className='text-sm text-gray-500 mt-2'>
                                      This product has no variants.
                                    </div>
                                  )}
                                </div>
                              );
                            })}

                            {/* Add Another Instance Button (only for combos) */}
                            {itemLabel === 'Combo' && (
                              <button
                                type="button"
                                onClick={() => {
                                  // This will add a new instance of the same product
                                  onProductSelect(product, true);
                                }}
                                className="mt-2 text-sm text-purple-600 hover:text-purple-800"
                              >
                                + Add Another Instance
                              </button>
                            )}
                          </div>
                        )}
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
                  {errors.name && (
                    <p className='text-red-500 text-sm mt-1 flex items-center'>
                      <AlertCircle size={16} className='mr-1' />
                      {errors.name}
                    </p>
                  )}
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
                  {errors.description && (
                    <p className='text-red-500 text-sm mt-1 flex items-center'>
                      <AlertCircle size={16} className='mr-1' />
                      {errors.description}
                    </p>
                  )}
                </div>

                {/* Image Upload */}
                <div>
                  <label className='block text-base font-medium text-gray-900 mb-2'>
                    {itemLabel} Image
                  </label>
                  <div className='mt-1 flex justify-center rounded-md border-2 border-dashed border-gray-300 px-6 pt-5 pb-6'>
                    {previewImage || itemData.image_url ? (
                      <div className='text-center'>
                        <img
                          src={previewImage || getImageUrl(itemData.image_url)}
                          alt='Preview'
                          className='mx-auto h-32 w-32 object-cover rounded-md mb-3'
                        />
                        <button
                          type='button'
                          onClick={() => {
                            onChange({ ...itemData, image_url: null });
                            setPreviewImage(null);
                          }}
                          className='text-red-500 text-sm hover:underline'
                        >
                          Remove Image
                        </button>
                      </div>
                    ) : (
                      <div className='py-5 space-y-3 text-black'>
                        <p className='font-bold text-sm'>
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
                  {errors.image && (
                    <p className='text-red-500 text-sm mt-1 flex items-center'>
                      <AlertCircle size={16} className='mr-1' />
                      {errors.image}
                    </p>
                  )}
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

                {/* Selected Products Summary */}
                {selectedProducts.length > 0 && (
                  <div className='border rounded-lg p-4'>
                    <h3 className='font-medium mb-3'>Selected Products</h3>
                    <div className='space-y-2'>
                      {selectedProducts.map((product) => {
                        const currentStock = variantStocks[product.selected_variant?.id];
                        return (
                          <div key={product.id + (product.selected_variant?.id || '')} className='flex items-center justify-between text-sm'>
                            <div className='flex items-center space-x-2'>
                              <Package size={16} className='text-gray-500' />
                              <span>{product.name}</span>
                              {product.selected_variant && (
                                <span className='text-gray-500'>
                                  ({product.is_microfiber
                                    ? `${product.selected_variant.color || ''} ${product.selected_variant.size || ''} ${product.selected_variant.gsm || ''}`
                                    : `${product.selected_variant.quantity || ''} ${product.selected_variant.unit || ''}`})
                                </span>
                              )}
                            </div>
                            <div className='flex items-center space-x-2'>
                              {product.selected_variant && (
                                <span className='text-gray-600'>₹{(product.selected_variant.price || product.selected_variant.mrp || 0).toFixed(2)}</span>
                              )}
                              {product.selected_variant && (
                                <span className='text-xs text-gray-500'>
                                  Stock: {' '
                                  }{currentStock !== undefined ? (
                                    currentStock > 0 ? (
                                      <span className='text-green-600 font-medium'>
                                        {currentStock} in stock
                                      </span>
                                    ) : (
                                      <span className='text-red-600 font-medium'>Out of stock</span>
                                    )
                                  ) : (
                                    <span className='text-gray-500'>N/A</span>
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Pricing Summary */}
                <div className='p-4 space-y-2 bg-gray-50 rounded-lg'>
                  <div className='flex justify-between text-sm'>
                    <span className='font-medium'>Original Price:</span>
                    <span>₹{(itemData.original_price || 0).toFixed(2)}</span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span className='font-medium'>Discounted Price:</span>
                    <span className='font-semibold text-green-600'>
                      ₹{(itemData.price || 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Save Button */}
                <div className='pt-4 flex justify-end'>
                  <button
                    type='submit'
                    disabled={loading || uploading}
                    className='bg-black text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-[#601E8D] disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    {loading || uploading
                      ? 'Saving...'
                      : `Save ${itemLabel}`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default KitsCombosForm;
