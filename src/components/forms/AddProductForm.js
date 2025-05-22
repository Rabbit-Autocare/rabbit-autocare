'use client';
import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Image from 'next/image';
import "../../app/globals.css";

export default function AddProductPage() {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    imageUrl: '',
    variants: [{ price: '', size: '', stock: '' }],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleVariantChange = (index, field, value) => {
    const newVariants = [...formData.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setFormData((prev) => ({ ...prev, variants: newVariants }));
  };

  const addVariant = () => {
    setFormData((prev) => ({
      ...prev,
      variants: [...prev.variants, { price: '', size: '', stock: '' }],
    }));
  };

  const removeVariant = (index) => {
    const newVariants = [...formData.variants];
    newVariants.splice(index, 1);
    setFormData((prev) => ({ ...prev, variants: newVariants }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      alert('Please upload a JPG or PNG image.');
      return;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    setLoading(true);
    setError(null);

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      setError('Image upload failed: ' + uploadError.message);
      setLoading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('product-images').getPublicUrl(filePath);

    setFormData((prev) => ({ ...prev, imageUrl: publicUrl }));
    setLoading(false);
  };

  const validateForm = () => {
    if (!formData.name.trim()) return 'Product name is required.';
    if (!formData.category.trim()) return 'Category is required.';
    if (!formData.imageUrl) return 'Product image is required.';
    if (formData.variants.length === 0) return 'At least one variant is required.';
    for (const v of formData.variants) {
      if (!v.price || Number(v.price) <= 0) return 'Each variant must have a valid price.';
      if (!v.size.trim()) return 'Each variant must have a size.';
      if (!v.stock || Number(v.stock) < 0) return 'Each variant must have a valid stock number.';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setMessage({ type: 'error', text: validationError });
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);

    const variantsParsed = formData.variants.map((v) => ({
      price: Number(v.price),
      size: v.size.trim(),
      stock: Number(v.stock),
    }));

    const { data, error } = await supabase.from('products').insert([
      {
        name: formData.name.trim(),
        category: formData.category.trim(),
        description: formData.description.trim(),
        image: formData.imageUrl,
        variants: variantsParsed,
      },
    ]);

    setLoading(false);

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Product added successfully!' });
      setFormData({
        name: '',
        category: '',
        description: '',
        imageUrl: '',
        variants: [{ price: '', size: '', stock: '' }],
      });
    }
  };

  return (
 
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">Add New Product</h1>

        {message && (
          <div
            className={`mb-6 px-4 py-3 rounded ${
              message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Name */}
          <div>
            <label htmlFor="name" className="block mb-1 font-semibold text-gray-700">
              Product Name<span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              name="name"
              id="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter product name"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block mb-1 font-semibold text-gray-700">
              Category<span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              name="category"
              id="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter category"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block mb-1 font-semibold text-gray-700">
              Description
            </label>
            <textarea
              name="description"
              id="description"
              rows="4"
              value={formData.description}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-3 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter product description"
            ></textarea>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block mb-2 font-semibold text-gray-700">
              Upload Product Image<span className="text-red-600">*</span>
            </label>
            <input
              type="file"
              accept="image/jpeg, image/jpg, image/png"
              onChange={handleImageUpload}
              className="border border-gray-300 rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={loading}
            />
            {formData.imageUrl && (
              <div className="mt-4 w-32 h-32 relative rounded shadow overflow-hidden">
                <Image
                  src={formData.imageUrl}
                  alt="Product preview"
                  fill
                  sizes="128px"
                  style={{ objectFit: 'cover' }}
                />
              </div>
            )}
          </div>

          {/* Variants */}
          <div>
            <label className="block mb-2 font-semibold text-gray-700">
              Variants<span className="text-red-600">*</span>
            </label>
            {formData.variants.map((variant, idx) => (
              <div key={idx} className="flex gap-4 items-center mb-3">
                <input
                  type="number"
                  min="0"
                  placeholder="Price (₹)"
                  value={variant.price}
                  onChange={(e) => handleVariantChange(idx, 'price', e.target.value)}
                  className="border border-gray-300 rounded-md p-2 w-24 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Size"
                  value={variant.size}
                  onChange={(e) => handleVariantChange(idx, 'size', e.target.value)}
                  className="border border-gray-300 rounded-md p-2 w-24 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Stock"
                  value={variant.stock}
                  onChange={(e) => handleVariantChange(idx, 'stock', e.target.value)}
                  className="border border-gray-300 rounded-md p-2 w-24 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                {formData.variants.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeVariant(idx)}
                    className="text-red-600 hover:text-red-800 font-bold"
                    aria-label="Remove variant"
                  >
                    &times;
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addVariant}
              className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              + Add Variant
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? 'Saving...' : 'Add Product'}
          </button>
        </form>
      </div>
   
  );
}
