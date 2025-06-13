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

  // Fetch stock information for variants
  useEffect(() => {
    const fetchVariantStocks = async () => {
      const stocks = {};
      for (const product of selectedProducts) {
        if (product.selected_variant) {
          try {
            const stock = await StockService.getVariantStock(product.selected_variant.id);
            stocks[product.selected_variant.id] = stock;
          } catch (error) {
            console.error('Error fetching stock for variant', product.selected_variant.id, error);
          }
        }
      }
      setVariantStocks(stocks);
    };

    if (selectedProducts.length > 0) {
      fetchVariantStocks();
    }
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

    // Transform data for API
    const productsData = selectedProducts.map(p => {
      if (!p.selected_variant) {
        throw new Error(`No variant selected for product: ${p.name}`);
      }
      return {
        product_id: p.id,
        variant_id: p.selected_variant.id,
        quantity: p.quantity || 1
      };
    });

    const submitData = {
      name: itemData.name,
      description: itemData.description,
      image_url: itemData.image_url,
      original_price: itemData.original_price,
      price: itemData.price,
      discount_percentage: itemData.discount_percentage,
      products: productsData
    };

    // Call the parent's onSubmit with the transformed data
    onSubmit(submitData);
  };

  // Add quantity selection UI for each product
  const renderQuantitySelector = (product) => {
    return (
      <div className="mt-2 flex items-center space-x-2">
        <label className="text-sm text-gray-600">Quantity:</label>
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => {
              const newQuantity = Math.max(1, (product.quantity || 1) - 1);
              const updatedProducts = selectedProducts.map(p =>
                p.id === product.id && p.selected_variant?.id === product.selected_variant?.id
                  ? { ...p, quantity: newQuantity }
                  : p
              );
              onQuantityChange(updatedProducts);
            }}
            className="w-6 h-6 flex items-center justify-center border rounded-full hover:bg-gray-100"
          >
            -
          </button>
          <span className="w-8 text-center">{product.quantity || 1}</span>
          <button
            type="button"
            onClick={() => {
              const newQuantity = (product.quantity || 1) + 1;
              const updatedProducts = selectedProducts.map(p =>
                p.id === product.id && p.selected_variant?.id === product.selected_variant?.id
                  ? { ...p, quantity: newQuantity }
                  : p
              );
              onQuantityChange(updatedProducts);
            }}
            className="w-6 h-6 flex items-center justify-center border rounded-full hover:bg-gray-100"
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
              <div className='p-4 space-y-6'>
                {allProducts.map((product) => {
                  const selectedInstances = selectedProducts.filter(p => p.id === product.id);
                  const isSelected = selectedInstances.length > 0;
                  const isMicrofiber = product.is_microfiber === true;
                  const { colors, sizes } = getUniqueColorsAndSizes(product);

                  return (
                    <div
                      key={`product-${product.id}`}
                      className={`rounded-lg p-4 transition-all duration-200 ${
                        isSelected ? 'bg-purple-50 border border-purple-200' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className='flex items-start space-x-4'>
                        <div className='w-20 h-20 bg-gray-100 rounded flex items-center justify-center overflow-hidden'>
                          {product.main_image_url ? (
                            <img
                              src={getImageUrl(product.main_image_url)}
                              alt={product.name}
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
                              <p className='text-xs text-gray-500 mt-1'>
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
                              {selectedInstances.map((selected, index) => (
                                <div key={`${product.id}-instance-${index}`} className="border-t pt-2">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium">Instance {index + 1}</span>
                                    {selectedInstances.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updatedProducts = selectedProducts.filter(p =>
                                            !(p.id === product.id &&
                                              p.selected_variant?.id === selected.selected_variant?.id)
                                          );
                                          onProductSelect(product, false);
                                        }}
                                        className="text-red-500 hover:text-red-700"
                                      >
                                        <X size={16} />
                                      </button>
                                    )}
                                  </div>

                                  {/* Color Selection for Microfiber Products */}
                                  {isMicrofiber && colors.length > 0 && (
                                    <div className='space-y-2'>
                                      <h4 className='font-medium text-sm'>Choose Color:</h4>
                                      <div className='flex flex-wrap gap-2'>
                                        {colors.map((color, colorIndex) => {
                                          const isSelected = selected?.selected_variant?.color === color;
                                          const hasStock = isColorAvailable(product, color);

                                          return (
                                            <div key={`${product.id}-color-${colorIndex}`} className='relative group'>
                                              <button
                                                type='button'
                                                onClick={() => {
                                                  const currentSelectedSize = selected?.selected_variant?.size;
                                                  let targetVariant = product.variants.find(v =>
                                                    v.color === color &&
                                                    (currentSelectedSize ? v.size === currentSelectedSize : true) &&
                                                    v.stock > 0
                                                  );

                                                  if (!targetVariant) {
                                                    targetVariant = product.variants.find(v => v.color === color && v.stock > 0);
                                                  }

                                                  if (targetVariant) {
                                                    onVariantSelect(product.id, targetVariant, selected);
                                                  } else {
                                                    onVariantSelect(product.id, null, selected);
                                                  }
                                                }}
                                                disabled={!hasStock}
                                                className={`
                                                  w-8 h-8 rounded-full border-2 transition-all duration-200 relative
                                                  ${
                                                    isSelected
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
                                              <div className='absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-10'>
                                                {color}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  {/* Size Selection for Microfiber Products */}
                                  {isMicrofiber && sizes.length > 0 && (
                                    <div className='space-y-2'>
                                      <h4 className='font-medium text-sm'>Choose Size:</h4>
                                      <div className='flex flex-wrap gap-2'>
                                        {sizes.map((size, sizeIndex) => {
                                          const isSelected = selected?.selected_variant?.size === size;
                                          const currentSelectedColor = selected?.selected_variant?.color;
                                          const hasStock = isSizeAvailable(product, size);
                                          const isCurrentCombinationAvailable = currentSelectedColor ?
                                            getVariantForCombination(product, currentSelectedColor, size)?.stock > 0 : hasStock;

                                          return (
                                            <div key={`${product.id}-size-${sizeIndex}`} className='relative group'>
                                              <button
                                                type='button'
                                                onClick={() => {
                                                  const currentSelectedColor = selected?.selected_variant?.color;
                                                  let targetVariant = product.variants.find(v =>
                                                    v.size === size &&
                                                    (currentSelectedColor ? v.color === currentSelectedColor : true) &&
                                                    v.stock > 0
                                                  );

                                                  if (!targetVariant) {
                                                    targetVariant = product.variants.find(v => v.size === size && v.stock > 0);
                                                  }

                                                  if (targetVariant) {
                                                    onVariantSelect(product.id, targetVariant, selected);
                                                  } else {
                                                    onVariantSelect(product.id, null, selected);
                                                  }
                                                }}
                                                className={`
                                                  px-4 py-2 text-sm font-medium transition-all duration-200 rounded-full
                                                  ${
                                                    isSelected
                                                      ? 'bg-white text-black border-2 border-black'
                                                      : !isCurrentCombinationAvailable && currentSelectedColor
                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
                                                  }
                                                `}
                                              >
                                                {size}
                                              </button>
                                              {!isCurrentCombinationAvailable && currentSelectedColor && (
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

                                  {/* Variant Selection for Non-Microfiber Products */}
                                  {!isMicrofiber && product.variants?.length > 0 && (
                                    <div className='space-y-2'>
                                      <h4 className='font-medium text-sm'>Choose Quantity:</h4>
                                      <div className='flex flex-wrap gap-2'>
                                        {product.variants.map((variant, variantIndex) => {
                                          const isOutOfStock = variant.stock === 0;
                                          const isSelected = selected?.selected_variant?.id === variant.id;

                                          return (
                                            <div key={`${product.id}-variant-${variantIndex}`} className='relative group'>
                                              <button
                                                type='button'
                                                onClick={() => onVariantSelect(product.id, variant, selected)}
                                                disabled={isOutOfStock}
                                                className={`
                                                  px-4 py-2 text-sm font-medium transition-all duration-200 rounded-full
                                                  ${
                                                    isSelected
                                                      ? 'bg-white text-black border-2 border-black'
                                                      : isOutOfStock
                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
                                                  }
                                                `}
                                              >
                                                {`${variant.quantity || ''} ${variant.unit || 'ml'}`}
                                              </button>
                                              {isOutOfStock && (
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

                                  {/* Quantity Selector */}
                                  {selected?.selected_variant && renderQuantitySelector(selected)}

                                  {/* Stock Information */}
                                  {selected?.selected_variant && (
                                    <div className='text-xs text-gray-600'>
                                      {variantStocks[selected.selected_variant.id] ? (
                                        <span className='text-green-600'>
                                          In Stock
                                        </span>
                                      ) : (
                                        <span className='text-red-600'>Out of stock</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}

                              {/* Add Another Instance Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  onProductSelect(product, true);
                                }}
                                className="mt-2 text-sm text-purple-600 hover:text-purple-800"
                              >
                                + Add Another Instance
                              </button>
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
                        <img
                          src={previewImage}
                          alt='Preview'
                          className='h-24 w-auto mx-auto object-contain'
                        />
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
                      {selectedProducts.map((product) => (
                        <div key={product.id} className='flex items-center justify-between text-sm'>
                          <div className='flex items-center space-x-2'>
                            <Package size={16} className='text-gray-500' />
                            <span>{product.name}</span>
                            {product.selected_variant && (
                              <span className='text-gray-500'>
                                ({product.is_microfiber
                                  ? `${product.selected_variant.color || 'N/A'} - ${product.selected_variant.size || 'N/A'}`
                                  : `${product.selected_variant.quantity || ''} ${product.selected_variant.unit || 'ml'}`})
                              </span>
                            )}
                          </div>
                          <div className='flex items-center space-x-2'>
                            {product.selected_variant && (
                              <span className='text-gray-600'>₹{(product.selected_variant.price || product.selected_variant.mrp || 0).toFixed(2)}</span>
                            )}
                            {product.selected_variant && (
                              <span className='text-xs text-gray-500'>
                                Stock: {product.selected_variant.stock > 0 ? product.selected_variant.stock : 'Out of stock'}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
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
