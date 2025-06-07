'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabaseClient';
import '../../../app/globals.css';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Search, Trash2, Plus } from 'lucide-react';
import { KitsCombosService } from '@/lib/service/kitsCombosService';
import { ProductService } from '@/lib/service/productService';
import Image from 'next/image';

// Dynamically import the shared form
const KitsCombosForm = dynamic(() =>
  import('@/components/forms/KitsCombosForm')
);

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
  const [itemData, setItemData] = useState({
    name: '',
    description: '',
    image_url: null,
    original_price: 0,
    discounted_price: 0,
    discount_percentage: 0,
  });
  const [error, setError] = useState(null);

  const itemLabel = activeTab === 'kits' ? 'Kit' : 'Combo';

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('kits_combos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
    fetchProducts();
  }, [fetchItems]);

  const fetchProducts = async () => {
    try {
      const response = await ProductService.getProducts({});
      setAllProducts(response?.success ? response.products : []);
    } catch (err) {
      console.error('Error fetching products:', err);
      setAllProducts([]);
    }
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${path}`;
  };

  const handleAddNew = () => {
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
    setCurrentView(`add-${activeTab}`);
  };

  const handleCancel = () => setCurrentView('list');

  const handleProductSelect = (product, isSelected) => {
    if (isSelected) {
      // When selecting a product, add it WITHOUT auto-selecting a variant
      setSelectedProducts([
        ...selectedProducts,
        { ...product, selected_variant: null },
      ]);
    } else {
      // When deselecting a product, remove it from the array
      const updatedProducts = selectedProducts.filter(
        (p) => p.id !== product.id
      );
      setSelectedProducts(updatedProducts);
      calculatePrices(updatedProducts);
    }
  };

  // Fix the handleVariantSelect function

  const handleVariantSelect = (productId, variant) => {
    const updatedProducts = selectedProducts.map((product) => {
      if (product.id === productId) {
        return { ...product, selected_variant: variant };
      }
      return product;
    });

    setSelectedProducts(updatedProducts);
    calculatePrices(updatedProducts);
  };

  const handleQuantityChange = (productId, quantity) => {
    const updated = selectedProducts.map((p) =>
      p.id === productId ? { ...p, quantity: parseInt(quantity) || 1 } : p
    );
    setSelectedProducts(updated);
    calculatePrices(updated);
  };

  const handleDiscountChange = (e) => {
    const discount = parseFloat(e.target.value) || 0;
    const discounted = itemData.original_price * (1 - discount / 100);
    setItemData((prev) => ({
      ...prev,
      discount_percentage: discount,
      discounted_price: discounted,
    }));
  };

  const calculatePrices = (products) => {
    const total = products.reduce((sum, p) => {
      const price = p.selected_variant?.price || p.price || 0;
      return sum + parseFloat(price) * (p.quantity || 1);
    }, 0);
    const discount = parseFloat(itemData.discount_percentage) || 0;
    const discounted = total * (1 - discount / 100);
    setItemData((prev) => ({
      ...prev,
      original_price: total,
      discounted_price: discounted,
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);

      const reader = new FileReader();
      reader.onload = (event) => setPreviewImage(event.target.result);
      reader.readAsDataURL(file);

      const ext = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).slice(2)}.${ext}`;
      const filePath = `${activeTab}-images/${fileName}`;

      const { error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);
      if (error) throw error;

      setItemData((prev) => ({ ...prev, image_url: filePath }));
    } catch (error) {
      console.error('Image upload error:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  // Update the handleSubmit function to work with JSON variants

  const handleSubmit = async (e) => {
    e.preventDefault();

    // First check if all selected products have a variant selected
    const missingVariants = selectedProducts.filter(
      (p) => p.variants?.length > 0 && !p.selected_variant
    );

    if (missingVariants.length > 0) {
      alert(`Please select variants for all products`);
      return;
    }

    if (!itemData.name) {
      alert(`Please enter a ${itemLabel} name`);
      return;
    }

    if (selectedProducts.length === 0) {
      alert('Please select at least one product');
      return;
    }

    try {
      setLoading(true);

      // Since variants are stored as JSON, we need to include the variant object
      // instead of just an ID in the payload
      const productsData = selectedProducts.map((p) => ({
        id: p.id,
        selected_variant: p.selected_variant || null, // Store the entire variant object
        quantity: 1, // Fixed quantity to 1 as requested
      }));

      const payload = {
        name: itemData.name,
        description: itemData.description,
        image_url: itemData.image_url,
        original_price: itemData.original_price,
        price: itemData.discounted_price,
        discount_percent: itemData.discount_percentage,
        products: productsData,
      };

      if (activeTab === 'kits') {
        await KitsCombosService.createKit(payload);
      } else {
        await KitsCombosService.createCombo(payload);
      }

      alert(`${itemLabel} created successfully`);
      setCurrentView('list');
      fetchItems();
    } catch (err) {
      console.error('Submit error:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter((item) =>
    item.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className='p-6 max-w-6xl mx-auto'>
        {currentView === 'list' ? (
          <>
            <div className='flex justify-between items-center mb-4'>
              <h1 className='text-2xl font-bold'>Kits & Combos</h1>
              <button
                onClick={handleAddNew}
                className='bg-gray-200 hover:bg-[#601E8D] hover:text-white text-black px-4 py-2 rounded-lg transition text-xs font-medium flex items-center gap-2'
              >
                <Plus size={16} />
                Add {itemLabel}
              </button>
            </div>

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

            <div className='mb-6 relative'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-[#777777] w-4 h-4' />
              <input
                type='text'
                placeholder={`Search ${itemLabel}`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='w-full text-black bg-gray-100 pl-10 pr-4 py-2 rounded-lg outline-none text-sm'
              />
            </div>

            {loading ? (
              <p className='text-center text-gray-500 py-8'>Loading...</p>
            ) : filteredItems.length === 0 ? (
              <div className='bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500'>
                No {itemLabel}s found.
              </div>
            ) : (
              <div className='bg-white border border-gray-200 rounded-lg overflow-x-auto'>
                <table className='min-w-full text-sm'>
                  <thead className='border-b text-black'>
                    <tr>
                      <th className='px-5 py-4 text-left font-medium'>Image</th>
                      <th className='px-5 py-4 text-left font-medium'>
                        {itemLabel} Name
                      </th>
                      <th className='px-5 py-4 text-left font-medium'>
                        Inventory
                      </th>
                      <th className='px-5 py-4 text-left font-medium'>Price</th>
                      <th className='px-5 py-4 text-center font-medium'>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className='divide-y'>
                    {filteredItems.map((item) => (
                      <tr key={item.id} className='hover:bg-gray-50'>
                        <td className='px-5 py-4'>
                          <div className="w-16 h-16 relative">
                            <Image
                              src={item.image_url || "/placeholder.svg"}
                              alt={item.name}
                              fill
                              className="object-cover rounded"
                            />
                          </div>
                        </td>
                        <td className='px-5 py-4 font-medium text-gray-800'>
                          {item.name}
                        </td>
                        <td className='px-5 py-4 text-gray-700'>
                          {item.inventory || 'Out of Stock'}
                        </td>
                        <td className='px-5 py-4 text-gray-700'>
                          ₹{item.price}
                        </td>
                        <td className='px-5 py-4 text-center'>
                          <button
                            onClick={() => deleteItem(item.id)}
                            className='text-black hover:text-[#601E8D]'
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
        ) : (
          <KitsCombosForm
            itemLabel={itemLabel}
            itemData={itemData}
            selectedProducts={selectedProducts}
            allProducts={allProducts}
            previewImage={previewImage}
            loading={loading}
            uploading={uploading}
            onCancel={handleCancel}
            onChange={setItemData}
            onImageUpload={handleImageUpload}
            onDiscountChange={handleDiscountChange}
            onSubmit={handleSubmit}
            onProductSelect={handleProductSelect}
            onVariantSelect={handleVariantSelect}
            onQuantityChange={handleQuantityChange}
            getImageUrl={getImageUrl}
          />
        )}
      </div>
    </AdminLayout>
  );
}
