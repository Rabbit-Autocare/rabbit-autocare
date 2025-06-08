'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image';
import { FiChevronLeft, FiPlus } from 'react-icons/fi';
import { useDropzone } from 'react-dropzone';

export default function ProductForm({ product = null, onSuccess, onCancel }) {
  const isEditMode = !!product;

  // Initialize form with product data if in edit mode, otherwise use empty values
  const [formData, setFormData] = useState({
    name: product?.name || '',
    category: product?.category || '',
    description: product?.description || '',
    images: product?.images || [],
    primaryImage: product?.images?.[0] || '',
    variants: product?.variants?.length
      ? product.variants
      : [{ size: '', price: '', stock: '' }],
  });

  // Store files in state instead of uploading immediately
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({});

  // Setup dropzone for image uploads
  const onDrop = useCallback((acceptedFiles) => {
    // Store files for later upload
    setSelectedFiles((prev) => [...prev, ...acceptedFiles]);

    // Generate preview URLs for display
    const newPreviewUrls = acceptedFiles.map((file) =>
      URL.createObjectURL(file)
    );
    setPreviewUrls((prev) => [...prev, ...newPreviewUrls]);
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif'],
    },
    multiple: true,
    noClick: true, // Prevent opening dialog on click, we'll use a specific button for this
    noKeyboard: true,
  });

  // Clean up preview URLs when component unmounts
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => {
        if (typeof url === 'string') URL.revokeObjectURL(url);
      });
    };
  }, [previewUrls]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleVariantChange = (index, field, value) => {
    const updatedVariants = [...formData.variants];
    updatedVariants[index][field] = value;
    setFormData({ ...formData, variants: updatedVariants });
  };

  const addVariant = () => {
    setFormData({
      ...formData,
      variants: [...formData.variants, { size: '', price: '', stock: '' }],
    });
  };

  const removeVariant = (index) => {
    if (formData.variants.length <= 1) return;
    const updated = [...formData.variants];
    updated.splice(index, 1);
    setFormData({ ...formData, variants: updated });
  };

  // Upload images only when form is submitted
  const uploadImages = async () => {
    if (selectedFiles.length === 0) return [];

    setUploadProgress({});
    const uploadPromises = selectedFiles.map(async (file, index) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${index}-${Math.random()
        .toString(36)
        .substring(2)}.${fileExt}`;

      setUploadProgress((prev) => ({
        ...prev,
        [fileName]: 0,
      }));

      try {
        const { data, error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type,
            onUploadProgress: (progress) => {
              const percent = Math.round(
                (progress.loaded / progress.total) * 100
              );
              setUploadProgress((prev) => ({
                ...prev,
                [fileName]: percent,
              }));
            },
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          return null;
        }

        return fileName;
      } catch (error) {
        console.error('Unexpected error:', error);
        return null;
      }
    });

    const results = await Promise.all(uploadPromises);
    return results.filter((result) => result !== null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    // Validate required fields
    if (!formData.name.trim() || !formData.category.trim()) {
      setMessage({
        type: 'error',
        text: 'Please fill in product name and category.',
      });
      setLoading(false);
      return;
    }

    // Filter and clean variants
    const validVariants = formData.variants.filter(
      (v) => v.size.trim() && v.price && v.stock !== ''
    );

    if (validVariants.length === 0) {
      setMessage({
        type: 'error',
        text: 'Please add at least one valid product variant with size, price and stock.',
      });
      setLoading(false);
      return;
    }

    try {
      // Upload images first
      const uploadedImages = await uploadImages();

      // Combine existing images with newly uploaded ones
      const allImages = [...formData.images];
      if (uploadedImages.length > 0) {
        allImages.push(...uploadedImages);
      }

      // Determine primary image
      let primaryImage = formData.primaryImage;
      if (!primaryImage && allImages.length > 0) {
        primaryImage = allImages[0];
      }

      // If a preview was marked as primary, use the corresponding uploaded image
      if (
        previewUrls.primaryIndex !== undefined &&
        uploadedImages[previewUrls.primaryIndex]
      ) {
        primaryImage = uploadedImages[previewUrls.primaryIndex];
      }

      // Prepare product data
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category.trim(),
        images: allImages,
        variants: validVariants.map((variant) => ({
          size: variant.size.trim(),
          price: parseFloat(variant.price),
          stock: parseInt(variant.stock, 10),
        })),
      };

      // For edit mode, include the product ID
      if (isEditMode) {
        productData.id = product.id;
      }

      // Send the request to our API
      const response = await fetch('/api/products/admin', {
        method: isEditMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || `Failed to ${isEditMode ? 'update' : 'add'} product`
        );
      }

      // Clear selected files and previews
      setSelectedFiles([]);
      previewUrls.forEach((url) => {
        if (typeof url === 'string') URL.revokeObjectURL(url);
      });
      setPreviewUrls([]);

      setMessage({
        type: 'success',
        text: `Product ${isEditMode ? 'updated' : 'added'} successfully!`,
      });

      if (onSuccess) {
        onSuccess(result);
      }
    } catch (error) {
      console.error(
        `Error ${isEditMode ? 'updating' : 'adding'} product:`,
        error
      );
      setMessage({
        type: 'error',
        text: `Error: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='max-w-3xl mx-auto bg-white'>
      <div className='mb-5'>
        <button
          onClick={onCancel}
          className='flex items-center text-gray-600 hover:text-gray-800 font-medium'
        >
          <FiChevronLeft className='mr-1' /> Products
        </button>
      </div>

      <h1 className='text-2xl font-bold mb-6'>Add New Product</h1>

      {message && (
        <div
          className={`p-3 mb-5 rounded ${
            message.type === 'error'
              ? 'bg-red-100 text-red-700'
              : 'bg-green-100 text-green-700'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className='space-y-5'>
          {/* Product Name */}
          <div>
            <label className='block mb-2 text-sm font-medium text-gray-700'>
              Product Name
            </label>
            <input
              name='name'
              value={formData.name}
              onChange={handleChange}
              className='w-full p-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-gray-400 focus:border-gray-400'
              placeholder='Enter product name'
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div>
            <label className='block mb-2 text-sm font-medium text-gray-700'>
              Description
            </label>
            <textarea
              name='description'
              value={formData.description}
              onChange={handleChange}
              className='w-full p-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-gray-400 focus:border-gray-400'
              rows='5'
              placeholder='Enter product description (optional)'
            />
          </div>

          {/* Category */}
          <div>
            <label className='block mb-2 text-sm font-medium text-gray-700'>
              Category
            </label>
            <div className='relative'>
              <select
                name='category'
                value={formData.category}
                onChange={handleChange}
                className='w-full p-2.5 border border-gray-300 rounded appearance-none bg-white focus:ring-1 focus:ring-gray-400 focus:border-gray-400 pr-8'
                disabled={loading}
              >
                <option value='' disabled>
                  Select Category
                </option>
                <option value='Car Care'>Car Interior</option>
                <option value='Interior Care'>Car Exterior</option>
                <option value='Exterior Care'>Microfibres</option>
              </select>
              <div className='absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none'>
                <svg
                  className='w-4 h-4 text-gray-500'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                  xmlns='http://www.w3.org/2000/svg'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M19 9l-7 7-7-7'
                  ></path>
                </svg>
              </div>
            </div>
          </div>

          {/* Product Variants */}
          <div className='mb-6'>
            <div className='flex mb-2'>
              <div className='w-1/3 pr-2'>
                <label className='block text-sm font-medium text-gray-700'>
                  Variant (Quantity/Size/Color)
                </label>
              </div>
              <div className='w-1/3 px-2'>
                <label className='block text-sm font-medium text-gray-700'>
                  Price
                </label>
              </div>
              <div className='w-1/3 pl-2'>
                <label className='block text-sm font-medium text-gray-700'>
                  Stock
                </label>
              </div>
            </div>

            {formData.variants.map((variant, index) => (
              <div key={index} className='flex mb-3'>
                <div className='w-1/3 pr-2'>
                  <input
                    type='text'
                    value={variant.size}
                    onChange={(e) =>
                      handleVariantChange(index, 'size', e.target.value)
                    }
                    placeholder='Example: 500ml'
                    className='w-full p-2.5 border border-gray-300 rounded'
                    disabled={loading}
                  />
                </div>
                <div className='w-1/3 px-2'>
                  <input
                    type='number'
                    value={variant.price}
                    onChange={(e) =>
                      handleVariantChange(index, 'price', e.target.value)
                    }
                    placeholder='Example: 499'
                    className='w-full p-2.5 border border-gray-300 rounded'
                    step='0.01'
                    min='0'
                    disabled={loading}
                  />
                </div>
                <div className='w-1/3 pl-2'>
                  <input
                    type='number'
                    value={variant.stock}
                    onChange={(e) =>
                      handleVariantChange(index, 'stock', e.target.value)
                    }
                    placeholder='Example: 20'
                    className='w-full p-2.5 border border-gray-300 rounded'
                    min='0'
                    disabled={loading}
                  />
                </div>
              </div>
            ))}

            <button
              type='button'
              onClick={addVariant}
              className='inline-flex items-center px-3 py-1.5 bg-gray-100 border border-gray-300 rounded text-sm font-medium text-gray-800 hover:bg-gray-200'
            >
              <span className='mr-1'>+</span>
              Add Variant
            </button>
          </div>

          {/* Media Upload */}
          <div>
            <h3 className='text-sm font-medium text-gray-700 mb-2'>Media</h3>

            <div
              {...getRootProps()}
              className='border border-dashed border-gray-300 rounded p-6 text-center'
            >
              <input {...getInputProps()} />
              <h4 className='font-medium text-gray-800 mb-1'>
                Upload Product Images
              </h4>
              <p className='text-sm text-gray-500 mb-3'>
                Drag and drop images here, or browse
              </p>

              <button
                type='button'
                onClick={open}
                className='px-4 py-1.5 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm font-medium'
              >
                Browse
              </button>
            </div>

            {/* Display selected images */}
            {previewUrls.length > 0 && (
              <div className='mt-4 grid grid-cols-5 gap-3'>
                {previewUrls.map((url, index) => (
                  <div
                    key={index}
                    className='relative border rounded overflow-hidden h-16'
                  >
                    <Image
                      src={url}
                      alt={`Preview ${index + 1}`}
                      fill
                      className='object-cover'
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Upload progress */}
            {Object.keys(uploadProgress).length > 0 && (
              <div className='mt-3 space-y-2'>
                {Object.entries(uploadProgress).map(([filename, progress]) => (
                  <div key={filename}>
                    <div className='flex justify-between text-xs text-gray-500 mb-1'>
                      <span>{filename}</span>
                      <span>{progress}%</span>
                    </div>
                    <div className='w-full bg-gray-200 rounded-full h-1.5'>
                      <div
                        className='bg-blue-600 h-1.5 rounded-full'
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className='flex justify-end gap-3 pt-4 border-t mt-6'>
            <button
              type='button'
              onClick={onCancel}
              className='px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors'
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type='submit'
              className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400'
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add product'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
