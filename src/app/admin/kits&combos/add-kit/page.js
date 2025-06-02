'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import AdminLayout from '@/components/layouts/AdminLayout';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload } from 'lucide-react';
import Link from 'next/link';

export default function AddKitPage() {
  const router = useRouter();
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [kitData, setKitData] = useState({
    name: '',
    description: '',
    image_url: null,
    original_price: 0,
    discounted_price: 0,
    discount_percentage: 0,
  });
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('products').select('*');

      if (error) throw error;

      setAllProducts(data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = (product, isSelected) => {
    if (isSelected) {
      setSelectedProducts([
        ...selectedProducts,
        { ...product, selected_variant: product.variants?.[0] || null },
      ]);
    } else {
      setSelectedProducts(selectedProducts.filter((p) => p.id !== product.id));
    }

    // Recalculate prices
    calculatePrices([
      ...selectedProducts,
      { ...product, selected_variant: product.variants?.[0] || null },
    ]);
  };

  const handleVariantSelect = (productId, variant) => {
    const updatedProducts = selectedProducts.map((p) => {
      if (p.id === productId) {
        return { ...p, selected_variant: variant };
      }
      return p;
    });

    setSelectedProducts(updatedProducts);
    calculatePrices(updatedProducts);
  };

  const calculatePrices = (products) => {
    const totalOriginal = products.reduce((sum, p) => {
      const price = p.selected_variant?.price || p.price || 0;
      return sum + parseFloat(price);
    }, 0);

    let discountPercentage = parseFloat(kitData.discount_percentage) || 0;
    const discountedPrice = totalOriginal * (1 - discountPercentage / 100);

    setKitData((prev) => ({
      ...prev,
      original_price: totalOriginal,
      discounted_price: discountedPrice,
    }));
  };

  const handleDiscountChange = (e) => {
    const discountPercentage = parseFloat(e.target.value) || 0;
    const discountedPrice =
      kitData.original_price * (1 - discountPercentage / 100);

    setKitData((prev) => ({
      ...prev,
      discount_percentage: discountPercentage,
      discounted_price: discountedPrice,
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);

      // Preview the selected image
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewImage(event.target.result);
      };
      reader.readAsDataURL(file);

      // Generate a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()
        .toString(36)
        .substring(2, 15)}.${fileExt}`;
      const filePath = `kit-images/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Set the image URL in state
      setKitData((prev) => ({
        ...prev,
        image_url: filePath,
      }));
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!kitData.name) {
      alert('Please enter a kit name');
      return;
    }

    if (selectedProducts.length === 0) {
      alert('Please select at least one product');
      return;
    }

    try {
      setLoading(true);

      // Create the kit entry
      const { data: kitData, error: kitError } = await supabase
        .from('kits')
        .insert([
          {
            name: kitData.name,
            description: kitData.description,
            image_url: kitData.image_url,
            original_price: kitData.original_price,
            price: kitData.discounted_price,
            discount_percent: kitData.discount_percentage,
            inventory: 1, // Default value, adjust as needed
          },
        ])
        .select()
        .single();

      if (kitError) throw kitError;

      // Create kit_products entries for each selected product
      const kitProductsData = selectedProducts.map((product) => ({
        kit_id: kitData.id,
        product_id: product.id,
        variant_id: product.selected_variant?.id || null,
      }));

      const { error: relationError } = await supabase
        .from('kit_products')
        .insert(kitProductsData);

      if (relationError) throw relationError;

      alert('Kit created successfully!');
      router.push('/admin/kits&combos');
    } catch (err) {
      console.error('Error creating kit:', err);
      alert(`Error creating kit: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className='p-6 max-w-6xl mx-auto'>
        <div className='mb-8'>
          <Link
            href='/admin/kits&combos'
            className='flex items-center text-gray-600 hover:text-gray-900'
          >
            <ArrowLeft size={18} className='mr-1' />
            <span>Back to Kits & Combos</span>
          </Link>
          <h1 className='text-2xl font-bold mt-4'>Add Kit</h1>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          {/* Left Column - Product Selection */}
          <div className='bg-white p-4 border border-gray-200 rounded-lg'>
            <h2 className='text-lg font-medium mb-4'>Select Products</h2>

            {loading ? (
              <p className='text-center text-gray-500 py-8'>
                Loading products...
              </p>
            ) : (
              <div className='space-y-4 max-h-[600px] overflow-y-auto'>
                {allProducts.map((product) => (
                  <div
                    key={product.id}
                    className='flex items-center p-3 border border-gray-200 rounded-lg'
                  >
                    <input
                      type='checkbox'
                      id={`product-${product.id}`}
                      className='mr-3'
                      onChange={(e) =>
                        handleProductSelect(product, e.target.checked)
                      }
                    />
                    <div className='flex-1'>
                      <label
                        htmlFor={`product-${product.id}`}
                        className='font-medium block'
                      >
                        {product.name}
                      </label>
                      <p className='text-sm text-gray-500'>
                        Select variant&apos;s bottle
                      </p>
                      <div className='mt-2 flex flex-wrap gap-2'>
                        {(product.variants || []).map((variant, idx) => (
                          <button
                            key={idx}
                            className={`text-xs py-1 px-2 border rounded-full ${
                              selectedProducts.find((p) => p.id === product.id)
                                ?.selected_variant?.id === variant.id
                                ? 'bg-gray-800 text-white'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                            onClick={() =>
                              handleVariantSelect(product.id, variant)
                            }
                          >
                            {variant.size} • ₹{variant.price}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Kit Details */}
          <div className='md:col-span-2 bg-white p-4 border border-gray-200 rounded-lg'>
            <h2 className='text-lg font-medium mb-4'>Kit Details</h2>

            <form onSubmit={handleSubmit} className='space-y-4'>
              <div>
                <label className='block text-sm font-medium mb-1'>
                  Kit Name
                </label>
                <input
                  type='text'
                  placeholder='Enter kit name'
                  className='w-full p-2 border border-gray-300 rounded'
                  value={kitData.name}
                  onChange={(e) =>
                    setKitData({ ...kitData, name: e.target.value })
                  }
                />
              </div>

              <div>
                <label className='block text-sm font-medium mb-1'>
                  Kit Description
                </label>
                <textarea
                  placeholder='Enter description'
                  className='w-full p-2 border border-gray-300 rounded h-24'
                  value={kitData.description}
                  onChange={(e) =>
                    setKitData({ ...kitData, description: e.target.value })
                  }
                />
              </div>

              <div>
                <label className='block text-sm font-medium mb-1'>Media</label>
                <div className='border border-gray-300 rounded p-4 text-center'>
                  {previewImage ? (
                    <div className='mb-2'>
                      <img
                        src={previewImage}
                        alt='Preview'
                        className='max-h-32 mx-auto'
                      />
                    </div>
                  ) : (
                    <p className='text-gray-500 text-sm mb-2'>
                      Upload Product Images
                    </p>
                  )}
                  <p className='text-xs text-gray-500 mb-2'>
                    Drag and drop images here, or browse
                  </p>
                  <label className='bg-gray-200 text-sm py-1 px-3 rounded cursor-pointer hover:bg-gray-300'>
                    Browse
                    <input
                      type='file'
                      accept='image/*'
                      className='hidden'
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium mb-1'>
                  Discount Percentage
                </label>
                <input
                  type='number'
                  placeholder='Enter discount percentage'
                  className='w-full p-2 border border-gray-300 rounded'
                  value={kitData.discount_percentage}
                  onChange={handleDiscountChange}
                  min='0'
                  max='100'
                />
              </div>

              <div className='bg-gray-50 p-3 rounded'>
                <p className='text-sm'>
                  <strong>Original Price:</strong> ₹
                  {kitData.original_price.toFixed(2)}
                </p>
                <p className='text-sm'>
                  <strong>Discounted Price:</strong> ₹
                  {kitData.discounted_price.toFixed(2)}
                </p>
              </div>

              <div className='pt-4'>
                <button
                  type='submit'
                  className='bg-black text-white px-4 py-2 rounded hover:bg-gray-800 disabled:opacity-50'
                  disabled={loading || uploading}
                >
                  {loading || uploading ? 'Saving...' : 'Save Kit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
