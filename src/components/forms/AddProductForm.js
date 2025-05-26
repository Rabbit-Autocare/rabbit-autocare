'use client';
import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image';

export default function AddProductPage() {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    imageUrl: '',
    variants: [{ size: '', price: '', stock: '' }],
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

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
    const updated = [...formData.variants];
    updated.splice(index, 1);
    setFormData({ ...formData, variants: updated });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = fileName;

    setLoading(true);
    setMessage(null);

    try {
      const { data, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        setMessage({ type: 'error', text: 'Image upload failed: ' + uploadError.message });
        setLoading(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setFormData({ ...formData, imageUrl: publicUrl });
      setMessage({ type: 'success', text: 'Image uploaded successfully!' });
    } catch (error) {
      console.error('Unexpected error:', error);
      setMessage({ type: 'error', text: 'Unexpected error: ' + error.message });
    }
    
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    // Validate required fields
    if (!formData.name.trim() || !formData.category.trim()) {
      setMessage({ type: 'error', text: 'Please fill in product name and category.' });
      setLoading(false);
      return;
    }

    // Filter and clean variants - only include variants with all required fields
    const validVariants = formData.variants.filter(v => 
      v.size.trim() && v.price && v.stock !== ''
    );

    if (validVariants.length === 0) {
      setMessage({ type: 'error', text: 'Please add at least one complete variant (size, price, and stock).' });
      setLoading(false);
      return;
    }

    const cleanedVariants = validVariants.map((v) => ({
      size: v.size.trim(),
      price: parseFloat(v.price),
      stock: parseInt(v.stock),
    }));

    console.log('Submitting product with variants:', cleanedVariants);

    try {
      const { data, error } = await supabase
        .from('products')
        .insert([
          {
            name: formData.name.trim(),
            category: formData.category.trim(),
            description: formData.description.trim() || null,
            image: formData.imageUrl || null,
            variants: cleanedVariants,
          },
        ])
        .select();

      if (error) {
        console.error('Database insert error:', error);
        setMessage({ 
          type: 'error', 
          text: `Failed to add product: ${error.message}${error.details ? ` - ${error.details}` : ''}` 
        });
      } else {
        console.log('Product added successfully:', data);
        setMessage({ type: 'success', text: 'Product added successfully!' });
        
        // Reset form
        setFormData({
          name: '',
          category: '',
          description: '',
          imageUrl: '',
          variants: [{ size: '', price: '', stock: '' }],
        });
      }
    } catch (error) {
      console.error('Unexpected error during insert:', error);
      setMessage({ type: 'error', text: 'Unexpected error: ' + error.message });
    }

    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-6">Add Product</h1>

      {message && (
        <div
          className={`p-3 rounded mb-4 ${
            message.type === 'error'
              ? 'bg-red-100 text-red-700 border border-red-300'
              : 'bg-green-100 text-green-700 border border-green-300'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Product Name *
          </label>
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter product name"
            required
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Category *
          </label>
          <input
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter product category"
            required
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            rows="4"
            placeholder="Enter product description (optional)"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Upload Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={loading}
          />
          {formData.imageUrl && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Image Preview:</p>
              <div className="w-40 h-40 border border-gray-300 rounded-md overflow-hidden">
                <img
                  src={formData.imageUrl}
                  alt="Product preview"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block mb-3 text-sm font-medium text-gray-700">
            Product Variants *
          </label>
          <div className="space-y-3">
            {formData.variants.map((variant, index) => (
              <div key={index} className="flex gap-3 items-center p-3 bg-gray-50 rounded-md">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Size (e.g., 50ml, 100ml, 250ml)"
                    value={variant.size}
                    onChange={(e) => handleVariantChange(index, 'size', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div className="w-24">
                  <input
                    type="number"
                    placeholder="Price"
                    value={variant.price}
                    onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    step="0.01"
                    min="0"
                  />
                </div>
                <div className="w-20">
                  <input
                    type="number"
                    placeholder="Stock"
                    value={variant.stock}
                    onChange={(e) => handleVariantChange(index, 'stock', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    min="0"
                  />
                </div>
                {formData.variants.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeVariant(index)}
                    className="text-red-600 hover:text-red-800 font-bold text-xl w-8 h-8 flex items-center justify-center rounded hover:bg-red-100"
                    title="Remove variant"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          
          <button
            type="button"
            onClick={addVariant}
            className="mt-3 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            + Add Another Variant
          </button>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            className="w-full p-4 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            disabled={loading}
          >
            {loading ? 'Adding Product...' : 'Add Product'}
          </button>
        </div>
      </form>
    </div>
  );
}