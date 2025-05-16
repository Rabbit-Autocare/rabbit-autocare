'use client';
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import '../app/globals.css';

export default function AddProductForm({ onProductAdded }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  setImageUrl(publicUrl);
  setLoading(false);
  console.log('Uploaded Image URL:', publicUrl);
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !price || !description || !imageUrl) {
      alert('Please fill in all fields.');
      return;
    }

    const { error } = await supabase.from('products').insert([
      {
        name,
        price,
        description,
        image: imageUrl,
      },
    ]);

    if (error) {
      alert('Failed to add product.');
      return;
    }

    setName('');
    setPrice('');
    setDescription('');
    setImageUrl('');
    onProductAdded();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-lg shadow-lg w-full max-w-xl mx-auto"
    >
      <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">Add New Product</h2>

      <input
        type="text"
        placeholder="Product Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border p-3 w-full rounded mb-4 focus:outline-blue-400"
      />
      <input
        type="number"
        placeholder="Price"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className="border p-3 w-full rounded mb-4 focus:outline-blue-400"
      />
      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="border p-3 w-full rounded mb-4 resize-none h-24 focus:outline-blue-400"
      />
      <input
        type="file"
        accept="image/jpeg, image/jpg, image/png"
        onChange={handleImageUpload}
        className="border p-3 w-full rounded mb-4"
      />
      {imageUrl && (
        <div className="mb-4">
          <img src={imageUrl} alt="Preview" className="w-32 h-32 object-cover rounded shadow" />
        </div>
      )}

      <button
        type="submit"
        className={`bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded w-full ${
          loading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        disabled={loading}
      >
        {loading ? 'Uploading...' : 'Add Product'}
      </button>

      {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
    </form>
  );
}
