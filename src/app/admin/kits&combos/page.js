'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import '../../../app/globals.css';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Search, Trash2, Plus, ArrowLeft, X } from 'lucide-react';
import Image from 'next/image';

export default function KitsAndCombosPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('kits'); // 'kits' or 'combos'
  const [currentView, setCurrentView] = useState('list'); // 'list', 'add-kit', or 'add-combo'
  const [allProducts, setAllProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // Item data state
  const [itemData, setItemData] = useState({
    name: '',
    description: '',
    image_url: null,
    original_price: 0,
    discounted_price: 0,
    discount_percentage: 0,
  });

  useEffect(() => {
    fetchItems();
    fetchProducts();
  }, [activeTab]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      // Use the correct table based on the active tab
      const tableName = activeTab === 'kits' ? 'kits' : 'combos';
      const { data, error } = await supabase.from(tableName).select('*');

      if (error) {
        console.error(`Error fetching ${activeTab}:`, error);
        throw error;
      }

      setItems(data || []);
    } catch (err) {
      console.error(`Failed to fetch ${activeTab}:`, err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase.from('products').select('*');

      if (error) throw error;

      setAllProducts(data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const deleteItem = async (id) => {
    if (
      !window.confirm(
        `Are you sure you want to delete this ${activeTab.slice(0, -1)}?`
      )
    ) {
      return;
    }

    try {
      // Use the correct table based on the active tab
      const tableName = activeTab === 'kits' ? 'kits' : 'combos';
      const { error } = await supabase.from(tableName).delete().eq('id', id);

      if (error) {
        console.error(`Error deleting ${activeTab.slice(0, -1)}:`, error);
        alert(`Error deleting: ${error.message}`);
        return;
      }

      setItems(items.filter((item) => item.id !== id));
      alert(
        `${
          activeTab.slice(0, -1).charAt(0).toUpperCase() +
          activeTab.slice(0, -1).slice(1)
        } deleted successfully`
      );
    } catch (err) {
      console.error(`Failed to delete ${activeTab.slice(0, -1)}:`, err);
      alert(`Error: ${err.message}`);
    }
  };

  const handleAddNew = () => {
    // Reset form data
    setItemData({
      name: '',
      description: '',
      image_url: null,
      original_price: 0,
      discounted_price: 0,
      discount_percentage: 0,
    });
    setSelectedProducts([]);
    setPreviewImage(null);

    // Set the current view based on the active tab
    setCurrentView(activeTab === 'kits' ? 'add-kit' : 'add-combo');
  };

  const handleCancel = () => {
    setCurrentView('list');
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${path}`;
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

    // Recalculate prices with updated products list
    const updatedProducts = isSelected
      ? [
          ...selectedProducts,
          { ...product, selected_variant: product.variants?.[0] || null },
        ]
      : selectedProducts.filter((p) => p.id !== product.id);

    calculatePrices(updatedProducts);
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

    let discountPercentage = parseFloat(itemData.discount_percentage) || 0;
    const discountedPrice = totalOriginal * (1 - discountPercentage / 100);

    setItemData((prev) => ({
      ...prev,
      original_price: totalOriginal,
      discounted_price: discountedPrice,
    }));
  };

  const handleDiscountChange = (e) => {
    const discountPercentage = parseFloat(e.target.value) || 0;
    const discountedPrice =
      itemData.original_price * (1 - discountPercentage / 100);

    setItemData((prev) => ({
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
      const filePath = `${
        activeTab === 'kits' ? 'kit' : 'combo'
      }-images/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Set the image URL in state
      setItemData((prev) => ({
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

    if (!itemData.name) {
      alert(`Please enter a ${activeTab === 'kits' ? 'kit' : 'combo'} name`);
      return;
    }

    if (selectedProducts.length === 0) {
      alert('Please select at least one product');
      return;
    }

    try {
      setLoading(true);

      const tableName = activeTab === 'kits' ? 'kits' : 'combos';
      const relationTableName =
        activeTab === 'kits' ? 'kit_products' : 'combo_products';
      const relationIdField = activeTab === 'kits' ? 'kit_id' : 'combo_id';

      // Create the item entry
      const { data: newItem, error: itemError } = await supabase
        .from(tableName)
        .insert([
          {
            name: itemData.name,
            description: itemData.description,
            image_url: itemData.image_url,
            original_price: itemData.original_price,
            price: itemData.discounted_price,
            discount_percent: itemData.discount_percentage,
            inventory: 1, // Default value
          },
        ])
        .select()
        .single();

      if (itemError) throw itemError;

      // Create relationship entries for each selected product
      const relationData = selectedProducts.map((product) => ({
        [relationIdField]: newItem.id,
        product_id: product.id,
        variant_id: product.selected_variant?.id || null,
      }));

      const { error: relationError } = await supabase
        .from(relationTableName)
        .insert(relationData);

      if (relationError) throw relationError;

      alert(`${activeTab === 'kits' ? 'Kit' : 'Combo'} created successfully!`);
      setCurrentView('list');
      fetchItems();
    } catch (err) {
      console.error(
        `Error creating ${activeTab === 'kits' ? 'kit' : 'combo'}:`,
        err
      );
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter((item) =>
    item.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // MAIN LIST VIEW
  const renderListView = () => (
    <>
      {/* Header */}
      <div className='flex justify-between items-center mb-4'>
        <h1 className='text-2xl font-bold'>Kits & Combos</h1>
        <button
          onClick={handleAddNew}
          className='bg-gray-200 hover:bg-[#601E8D] hover:text-white text-black px-4 py-2 rounded-lg transition text-xs font-medium flex items-center gap-2'
        >
          <Plus size={16} />
          {activeTab === 'kits' ? 'Add Kit' : 'Add Combo'}
        </button>
      </div>

      {/* Tab Navigation */}
      <div className='flex items-center gap-6 border-b border-gray-200 mb-4'>
        <button
          className={`pb-3 text-sm font-medium transition ${
            activeTab === 'kits'
              ? 'text-black border-b-4 border-[#E5E8EB]'
              : 'text-gray-500'
          }`}
          onClick={() => setActiveTab('kits')}
        >
          Kits
        </button>
        <button
          className={`pb-3 text-sm font-medium transition ${
            activeTab === 'combos'
              ? 'text-black border-b-4 border-[#E5E8EB]'
              : 'text-gray-500'
          }`}
          onClick={() => setActiveTab('combos')}
        >
          Combos
        </button>
      </div>

      {/* Search */}
      <div className='mb-6'>
        <div className='relative w-full'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-[#777777] w-4 h-4' />
          <input
            type='text'
            placeholder={`Search ${activeTab}`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='w-full text-black placeholder-[#777777] bg-gray-100 pl-10 pr-4 py-2 rounded-lg outline-none text-sm'
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <p className='text-center text-gray-500 py-8'>Loading...</p>
      ) : filteredItems.length === 0 ? (
        <div className='bg-white rounded-lg border border-gray-200 p-8 text-center'>
          <p className='text-gray-500'>No {activeTab} found.</p>
        </div>
      ) : (
        <div className='bg-white rounded-lg border border-gray-200 overflow-x-auto'>
          <table className='min-w-full text-sm'>
            <thead className='text-black border-b border-gray-200'>
              <tr>
                <th className='px-5 py-4 text-left font-medium'>Image</th>
                <th className='px-5 py-4 text-left font-medium'>
                  {activeTab === 'kits' ? 'Kit Name' : 'Combo Name'}
                </th>
                <th className='px-5 py-4 text-left font-medium'>Inventory</th>
                <th className='px-5 py-4 text-left font-medium'>Price</th>
                <th className='px-5 py-4 text-center font-medium'>Actions</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100'>
              {filteredItems.map((item) => (
                <tr key={item.id} className='hover:bg-gray-50'>
                  <td className='px-5 py-4'>
                    <div className='w-10 h-10 bg-gray-100 rounded flex items-center justify-center overflow-hidden'>
                      {item.image_url ? (
                        <img
                          src={getImageUrl(item.image_url)}
                          alt={item.name}
                          width={40}
                          height={40}
                          className='object-cover rounded'
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/placeholder-image.png';
                          }}
                        />
                      ) : (
                        <div className='w-10 h-10 bg-gray-200 rounded' />
                      )}
                    </div>
                  </td>
                  <td className='px-5 py-4 font-medium text-gray-800'>
                    {item.name}
                  </td>
                  <td className='px-5 py-4 text-gray-700'>
                    {item.inventory === 0 || item.inventory === null ? (
                      <span className='text-red-500'>Out of Stock</span>
                    ) : (
                      item.inventory
                    )}
                  </td>
                  <td className='px-5 py-4 text-gray-700'>
                    ₹{item.price || 'N/A'}
                  </td>
                  <td className='px-5 py-4 flex justify-center items-center'>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className='text-black hover:text-[#601E8D] transition'
                      title={`Delete ${activeTab === 'kits' ? 'Kit' : 'Combo'}`}
                    >
                      <Trash2 className='w-4 h-4' />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );

  // FORM VIEW
  const renderFormView = () => (
    <>
      <div className='mb-6'>
        <button
          onClick={handleCancel}
          className='flex items-center text-gray-600 hover:text-gray-900'
        >
          <ArrowLeft size={18} className='mr-1' />
          <span>Back to Kits & Combos</span>
        </button>
        <h1 className='text-2xl font-bold mt-4'>
          Add {activeTab === 'kits' ? 'Kit' : 'Combo'}
        </h1>
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
                    checked={selectedProducts.some((p) => p.id === product.id)}
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
                          type='button'
                          className={`text-xs py-1 px-2 border rounded-full ${
                            selectedProducts.find((p) => p.id === product.id)
                              ?.selected_variant?.id === variant.id
                              ? 'bg-gray-800 text-white'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                          onClick={() =>
                            handleVariantSelect(product.id, variant)
                          }
                          disabled={
                            !selectedProducts.some((p) => p.id === product.id)
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

        {/* Right Column - Item Details */}
        <div className='md:col-span-2 bg-white p-4 border border-gray-200 rounded-lg'>
          <h2 className='text-lg font-medium mb-4'>
            {activeTab === 'kits' ? 'Kit' : 'Combo'} Details
          </h2>

          <form onSubmit={handleSubmit} className='space-y-4'>
            <div>
              <label className='block text-sm font-medium mb-1'>
                {activeTab === 'kits' ? 'Kit' : 'Combo'} Name
              </label>
              <input
                type='text'
                placeholder={`Enter ${
                  activeTab === 'kits' ? 'kit' : 'combo'
                } name`}
                className='w-full p-2 border border-gray-300 rounded'
                value={itemData.name}
                onChange={(e) =>
                  setItemData({ ...itemData, name: e.target.value })
                }
              />
            </div>

            <div>
              <label className='block text-sm font-medium mb-1'>
                {activeTab === 'kits' ? 'Kit' : 'Combo'} Description
              </label>
              <textarea
                placeholder='Enter description'
                className='w-full p-2 border border-gray-300 rounded h-24'
                value={itemData.description}
                onChange={(e) =>
                  setItemData({ ...itemData, description: e.target.value })
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
                value={itemData.discount_percentage}
                onChange={handleDiscountChange}
                min='0'
                max='100'
              />
            </div>

            <div className='bg-gray-50 p-3 rounded'>
              <p className='text-sm'>
                <strong>Original Price:</strong> ₹
                {itemData.original_price.toFixed(2)}
              </p>
              <p className='text-sm'>
                <strong>Discounted Price:</strong> ₹
                {itemData.discounted_price.toFixed(2)}
              </p>
            </div>

            <div className='pt-4'>
              <button
                type='submit'
                className='bg-black text-white px-4 py-2 rounded hover:bg-gray-800 disabled:opacity-50'
                disabled={loading || uploading}
              >
                {loading || uploading
                  ? 'Saving...'
                  : `Save ${activeTab === 'kits' ? 'Kit' : 'Combo'}`}
              </button>
              <button
                type='button'
                onClick={handleCancel}
                className='ml-2 border border-gray-300 px-4 py-2 rounded hover:bg-gray-100'
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );

  return (
    <AdminLayout>
      <div className='p-6 max-w-6xl mx-auto'>
        {currentView === 'list' && renderListView()}
        {(currentView === 'add-kit' || currentView === 'add-combo') &&
          renderFormView()}
      </div>
    </AdminLayout>
  );
}
